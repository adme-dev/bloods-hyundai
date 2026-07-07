import { useRequestURL } from '#app';

const normalizeHost = (host: string | null | undefined): string => {
  return (host || '')
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');
};

export function buildTenantCacheKey(baseKey: string, host: string | null | undefined): string {
  const normalizedHost = normalizeHost(host);
  return normalizedHost ? `${baseKey}:${normalizedHost}` : baseKey;
}

export function getRuntimeTenantCacheKey(baseKey: string): string {
  if (import.meta.client) {
    return buildTenantCacheKey(baseKey, window.location.host);
  }

  const requestUrl = useRequestURL();
  return buildTenantCacheKey(baseKey, requestUrl.host);
}
