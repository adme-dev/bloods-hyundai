type CacheStorage = {
  removeItem: (key: string) => Promise<unknown> | unknown;
};

export function getNitroFunctionCacheStorageKey(cacheName: string, cacheKey: string) {
  return `nitro:functions:${cacheName}:${cacheKey}.json`;
}

export async function invalidateNitroFunctionCache(
  storage: CacheStorage,
  cacheName: string,
  cacheKey: string,
) {
  await storage.removeItem(getNitroFunctionCacheStorageKey(cacheName, cacheKey));
}
