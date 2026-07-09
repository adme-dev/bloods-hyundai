const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;
const EVENT_VERSION = 1;
const MAX_EVENT_BODY_BYTES = 64 * 1024;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/publish') {
      return handlePublish(request, env, ctx);
    }

    if (request.method === 'GET' && url.pathname === '/ws') {
      return handleWebSocket(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true, service: 'dealer-realtime-events' });
    }

    return Response.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      await sendEventToRoom(message.body, env);
      if (typeof message.ack === 'function') message.ack();
    }
  },
};

export class DealerRealtimeRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/broadcast') {
      if (!isInternalRequest(request, this.env)) {
        return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
      }

      const event = await request.json();
      const payload = JSON.stringify(event);
      let delivered = 0;

      for (const socket of this.ctx.getWebSockets()) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
          delivered += 1;
        }
      }

      return Response.json({ ok: true, delivered });
    }

    if (request.method === 'GET' && url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return Response.json({ error: { code: 'EXPECTED_WEBSOCKET', message: 'Expected WebSocket upgrade' } }, { status: 400 });
      }

      const auth = await validateClientToken(url, this.env);
      if (!auth.ok) {
        return Response.json({ error: { code: 'UNAUTHORIZED', message: auth.error } }, { status: 401 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({
        dealerId: auth.dealerId,
        connectedAt: new Date().toISOString(),
      });

      server.send(JSON.stringify({
        version: EVENT_VERSION,
        type: 'realtime.connected',
        dealerId: auth.dealerId,
        occurredAt: new Date().toISOString(),
      }));

      return new Response(null, { status: 101, webSocket: client });
    }

    return Response.json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, { status: 404 });
  }

  async webSocketMessage(socket, message) {
    if (message === 'ping') {
      socket.send('pong');
    }
  }

  async webSocketClose(socket, code, reason) {
    socket.close(code, reason);
  }

  async webSocketError(socket, error) {
    console.error('[DealerRealtimeRoom] WebSocket error', {
      error: error?.message || String(error),
      attachment: safeAttachment(socket),
    });
  }
}

async function handlePublish(request, env, ctx) {
  if (!env.REALTIME_PUBLISH_SECRET) {
    return Response.json({ error: { code: 'MISCONFIGURED', message: 'Publish secret not configured' } }, { status: 503 });
  }

  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_EVENT_BODY_BYTES) {
    return Response.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Realtime event payload is too large' } }, { status: 413 });
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_EVENT_BODY_BYTES) {
    return Response.json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Realtime event payload is too large' } }, { status: 413 });
  }

  const verified = await verifyPublishSignature(request, env.REALTIME_PUBLISH_SECRET, body);
  if (!verified.ok) {
    return Response.json({ error: { code: 'UNAUTHORIZED', message: verified.error } }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } }, { status: 400 });
  }

  const validation = validateRealtimeEvent(event);
  if (!validation.ok) {
    return Response.json({ error: { code: 'INVALID_EVENT', message: validation.error } }, { status: 422 });
  }

  if (env.REALTIME_EVENTS_QUEUE) {
    await env.REALTIME_EVENTS_QUEUE.send(event);
  } else {
    ctx.waitUntil(sendEventToRoom(event, env));
  }

  return Response.json({ ok: true, queued: Boolean(env.REALTIME_EVENTS_QUEUE) });
}

async function handleWebSocket(request, env) {
  const url = new URL(request.url);
  const dealerId = url.searchParams.get('dealerId');
  if (!dealerId) {
    return Response.json({ error: { code: 'VALIDATION_ERROR', message: 'dealerId is required' } }, { status: 422 });
  }

  const roomId = env.DEALER_REALTIME_ROOM.idFromName(dealerId);
  const room = env.DEALER_REALTIME_ROOM.get(roomId);
  return room.fetch(request);
}

async function sendEventToRoom(event, env) {
  const validation = validateRealtimeEvent(event);
  if (!validation.ok) {
    throw new Error(`Invalid realtime event: ${validation.error}`);
  }

  const roomId = env.DEALER_REALTIME_ROOM.idFromName(event.dealerId);
  const room = env.DEALER_REALTIME_ROOM.get(roomId);
  const response = await room.fetch('https://dealer-realtime-room/broadcast', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-realtime-secret': env.REALTIME_INTERNAL_SECRET || env.REALTIME_PUBLISH_SECRET || '',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Room broadcast failed ${response.status}: ${detail.slice(0, 500)}`);
  }
}

function validateRealtimeEvent(event) {
  if (!event || typeof event !== 'object') return { ok: false, error: 'Event must be an object' };
  if (event.version !== EVENT_VERSION) return { ok: false, error: 'Unsupported event version' };
  if (!isUuid(event.eventId)) return { ok: false, error: 'eventId must be a UUID' };
  if (!isUuid(event.dealerId)) return { ok: false, error: 'dealerId must be a UUID' };
  if (!['enquiry.created', 'enquiry.updated', 'dashboard.invalidate'].includes(event.type)) {
    return { ok: false, error: 'Unsupported event type' };
  }
  if (!event.occurredAt || Number.isNaN(Date.parse(event.occurredAt))) {
    return { ok: false, error: 'occurredAt must be an ISO date string' };
  }
  if (!event.entity || event.entity.type !== 'enquiry' || !isUuid(event.entity.id)) {
    return { ok: false, error: 'entity must reference an enquiry UUID' };
  }
  return { ok: true };
}

async function verifyPublishSignature(request, secret, body) {
  const timestamp = request.headers.get('x-dealer-realtime-timestamp') || '';
  const signature = request.headers.get('x-dealer-realtime-signature') || '';
  const timestampNumber = Number(timestamp);

  if (!timestamp || !Number.isFinite(timestampNumber)) {
    return { ok: false, error: 'Missing or invalid timestamp' };
  }
  if (Math.abs(Date.now() - timestampNumber) > SIGNATURE_TOLERANCE_MS) {
    return { ok: false, error: 'Expired timestamp' };
  }
  if (!signature.startsWith('sha256=')) {
    return { ok: false, error: 'Missing signature' };
  }

  const expected = `sha256=${await hmacHex(secret, `${timestamp}.${body}`)}`;
  if (!timingSafeEqual(signature, expected)) {
    return { ok: false, error: 'Invalid signature' };
  }

  return { ok: true };
}

async function validateClientToken(url, env) {
  const dealerId = url.searchParams.get('dealerId') || '';
  const timestamp = url.searchParams.get('ts') || '';
  const token = url.searchParams.get('token') || '';
  const secret = env.ADMIN_REALTIME_CLIENT_SECRET || env.REALTIME_PUBLISH_SECRET || '';

  if (!secret) return { ok: false, error: 'Client auth secret not configured' };
  if (!isUuid(dealerId)) return { ok: false, error: 'Invalid dealerId' };
  if (!timestamp || !Number.isFinite(Number(timestamp))) return { ok: false, error: 'Invalid timestamp' };
  if (Math.abs(Date.now() - Number(timestamp)) > SIGNATURE_TOLERANCE_MS) return { ok: false, error: 'Expired token' };

  const expected = await hmacHex(secret, `${dealerId}.${timestamp}`);
  if (!timingSafeEqual(token, expected)) return { ok: false, error: 'Invalid token' };

  return { ok: true, dealerId };
}

function isInternalRequest(request, env) {
  const expected = env.REALTIME_INTERNAL_SECRET || env.REALTIME_PUBLISH_SECRET || '';
  const provided = request.headers.get('x-internal-realtime-secret') || '';
  return Boolean(expected) && timingSafeEqual(provided, expected);
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i] ^ right[i];
  }
  return diff === 0;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function safeAttachment(socket) {
  try {
    return socket.deserializeAttachment();
  } catch {
    return null;
  }
}
