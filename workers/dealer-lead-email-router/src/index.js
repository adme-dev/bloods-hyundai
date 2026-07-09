export default {
  async email(message, env) {
    if (!env.INBOUND_LEAD_WEBHOOK_URL || !env.INBOUND_LEAD_WEBHOOK_SECRET) {
      message.setReject('Inbound lead webhook is not configured');
      return;
    }

    const raw = await streamToText(message.raw);
    const headers = headersToObject(message.headers);
    const response = await fetch(env.INBOUND_LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-inbound-lead-secret': env.INBOUND_LEAD_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        provider: 'cloudflare_email_routing',
        from: message.from,
        to: message.to,
        recipient: message.to,
        subject: headers.subject || '',
        messageId: headers['message-id'] || '',
        raw,
        headers,
        rawSize: message.rawSize,
        receivedAt: new Date().toISOString(),
      }),
    });

    if (response.ok) return;

    const detail = await response.text().catch(() => '');
    console.error('[Dealer Lead Email Router] Webhook rejected email', {
      status: response.status,
      to: message.to,
      from: message.from,
      detail: detail.slice(0, 500),
    });

    if (response.status >= 500) {
      throw new Error(`Inbound lead webhook failed with ${response.status}`);
    }

    if (env.FALLBACK_FORWARD_TO) {
      await message.forward(env.FALLBACK_FORWARD_TO, fallbackHeaders(response.status));
      return;
    }

    message.setReject(`Inbound lead webhook rejected email with ${response.status}`);
  },
};

async function streamToText(stream) {
  const chunks = [];
  const reader = stream.getReader();
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > 25 * 1024 * 1024) throw new Error('Inbound email exceeds Cloudflare Email Routing limit');
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function headersToObject(headers) {
  const out = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function fallbackHeaders(status) {
  const headers = new Headers();
  headers.set('X-Dealer-Lead-Router-Status', String(status));
  headers.set('X-Dealer-Lead-Router', 'dealer-lead-email-router');
  return headers;
}
