import type {
  DealerStudioApiKeyDetails,
  DealerStudioCreateResult,
  DealerStudioDealership,
  DealerStudioLeadPayload,
} from './types';

const DEALER_STUDIO_BASE_URL = 'https://dashboard.dealerstudio.com.au';
const REQUEST_TIMEOUT_MS = 8_000;
type Fetcher = typeof fetch;

export async function fetchDealerStudioApiKeyDetails(
  apiKey: string,
  fetcher: Fetcher = fetch,
): Promise<DealerStudioApiKeyDetails> {
  if (!apiKey.trim()) throw new Error('Dealer Studio API key is not configured');
  const response = await fetcher(`${DEALER_STUDIO_BASE_URL}/api/v1/apikeys/apikey_details.json`, {
    method: 'GET',
    headers: authHeaders(apiKey),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    redirect: 'error',
  });

  if (!response.ok) {
    throw new Error(providerErrorMessage('Dealer Studio connection failed', response.status));
  }
  const body: unknown = await response.json().catch(() => null);
  const parsed = parseApiKeyDetails(body);
  if (!parsed) throw new Error('Dealer Studio returned an invalid API key details response');
  return parsed;
}

export async function createDealerStudioLead(
  apiKey: string,
  payload: DealerStudioLeadPayload,
  fetcher: Fetcher = fetch,
): Promise<DealerStudioCreateResult> {
  if (!apiKey.trim()) {
    return { ok: false, kind: 'configuration', status: null, error: 'Dealer Studio API key is not configured' };
  }

  let response: Response;
  try {
    response = await fetcher(`${DEALER_STUDIO_BASE_URL}/api/v1/leads`, {
      method: 'POST',
      headers: authHeaders(apiKey),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: 'error',
    });
  } catch (error: any) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return {
      ok: false,
      kind: 'ambiguous',
      status: null,
      error: timedOut
        ? 'Dealer Studio request timed out; delivery outcome is unknown'
        : 'Dealer Studio request outcome is unknown',
    };
  }

  const body: unknown = await response.json().catch(() => null);
  if (response.status === 201 && isRecord(body)) {
    const leadId = positiveInteger(body.id);
    const leadClusterId = positiveInteger(body.lead_cluster_id);
    if (leadId && leadClusterId) return { ok: true, leadId, leadClusterId };
    return { ok: false, kind: 'permanent', status: 201, error: 'Dealer Studio returned an invalid create response' };
  }

  const error = summarizeProviderError(body, response.status);
  if (response.status === 422) return { ok: false, kind: 'validation', status: 422, error };
  if (response.status === 401 || response.status === 403) {
    return { ok: false, kind: 'configuration', status: response.status, error };
  }
  if (response.status === 429 || response.status >= 500) {
    return { ok: false, kind: 'retryable', status: response.status, error };
  }
  return { ok: false, kind: 'permanent', status: response.status, error };
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    authorization: `Bearer ${apiKey.trim()}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };
}

function parseApiKeyDetails(value: unknown): DealerStudioApiKeyDetails | null {
  if (!isRecord(value) || !positiveInteger(value.id) || !Array.isArray(value.permissions) || !Array.isArray(value.dealerships)) {
    return null;
  }
  const dealerships = value.dealerships.map(parseDealership);
  if (dealerships.some(row => !row)) return null;
  return {
    id: value.id,
    permissions: value.permissions.filter((item): item is string => typeof item === 'string'),
    dealerships: dealerships as DealerStudioDealership[],
  };
}

function parseDealership(value: unknown): DealerStudioDealership | null {
  if (!isRecord(value) || !positiveInteger(value.id) || !cleanString(value.name) || !cleanString(value.slug)) return null;
  if (!Array.isArray(value.locations) || !Array.isArray(value.users)) return null;
  const locations = value.locations.flatMap((location) => {
    if (!isRecord(location) || !positiveInteger(location.id) || !cleanString(location.name)) return [];
    return [{ id: location.id, name: cleanString(location.name), locationType: cleanString(location.location_type) || null }];
  });
  const users = value.users.flatMap((user) => {
    if (!isRecord(user) || !positiveInteger(user.id) || !cleanString(user.name) || !cleanString(user.email)) return [];
    return [{ id: user.id, name: cleanString(user.name), email: cleanString(user.email) }];
  });
  return { id: value.id, name: cleanString(value.name), slug: cleanString(value.slug), locations, users };
}

function summarizeProviderError(value: unknown, status: number): string {
  if (isRecord(value)) {
    const message = cleanString(value.message);
    if (message) return message.slice(0, 500);
    const details = Object.entries(value).flatMap(([field, errors]) =>
      Array.isArray(errors)
        ? errors.filter((item): item is string => typeof item === 'string').map(item => `${field}: ${item}`)
        : [],
    );
    if (details.length) return details.join('; ').slice(0, 500);
  }
  return providerErrorMessage('Dealer Studio rejected the lead', status);
}

function providerErrorMessage(prefix: string, status: number): string {
  return `${prefix} (${status})`;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function positiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
