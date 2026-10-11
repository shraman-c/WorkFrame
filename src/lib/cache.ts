type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cacheMap = new Map<string, CacheEntry<any>>();

/**
 * Gets a cached item. Returns null if the item is missing or expired.
 */
export function getCached<T>(key: string): T | null {
  const entry = cacheMap.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheMap.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Sets an item in the cache with a specific TTL in milliseconds.
 */
export function setCached<T>(key: string, data: T, ttlMs: number): void {
  cacheMap.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Invalidates a specific key in the cache.
 */
export function invalidateCache(key: string): void {
  cacheMap.delete(key);
}

/**
 * Clears the entire cache.
 */
export function clearCache(): void {
  cacheMap.clear();
}
