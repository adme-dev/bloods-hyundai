/**
 * Client-side freshness for the cached site-config payload.
 *
 * The homepage sliders come from site-config. Nuxt's `getCachedData` returns
 * the SSR payload for the life of the SPA session, so once a visitor had the
 * page open, newly published slides never appeared without a hard reload —
 * the server cache being invalidated on save made no difference.
 *
 * Reusing the payload for a short window keeps navigation snappy while
 * ensuring a publish goes live on the next page view rather than "eventually".
 */

/** How long a fetched site-config payload may be reused client-side. */
export const SITE_CONFIG_CACHE_TTL_MS = 60_000;

/** Fetch timestamps per tenant cache key. */
const fetchedAt = new Map<string, number>();

/** Keys explicitly invalidated; the next read must refetch, never reuse. */
const staleKeys = new Set<string>();

export function markSiteConfigFetched(key: string) {
  staleKeys.delete(key);
  fetchedAt.set(key, Date.now());
}

export function isSiteConfigFresh(key: string, cached: unknown): boolean {
  if (!cached || staleKeys.has(key)) return false;

  const stamp = fetchedAt.get(key);
  // No stamp means this is the SSR payload on first paint — always usable.
  if (!stamp) {
    fetchedAt.set(key, Date.now());
    return true;
  }
  return Date.now() - stamp < SITE_CONFIG_CACHE_TTL_MS;
}

/**
 * Marks the client payload stale so the next read refetches. Call after
 * publishing in the admin, where waiting out the TTL would look like the save
 * failed. Marking beats clearing: a cleared map reads as "never fetched",
 * which the SSR-payload rule above would treat as fresh.
 */
export function invalidateSiteConfigCache() {
  for (const key of fetchedAt.keys()) staleKeys.add(key);
  fetchedAt.clear();
}
