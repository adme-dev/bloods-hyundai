import { getRequestHeaders, type H3Event } from 'h3';

export function getTenantForwardHeaders(event: H3Event): Record<string, string> {
  const incomingHeaders = getRequestHeaders(event);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  for (const name of ['host', 'x-forwarded-host', 'x-forwarded-proto']) {
    const value = incomingHeaders[name];
    if (typeof value === 'string' && value) {
      headers[name] = value;
    }
  }

  return headers;
}
