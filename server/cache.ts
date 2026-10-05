/**
 * In-Memory Server-Side Caching with Prefix-based Invalidation
 */

interface CacheEntry {
  data: any;
  expiry: number;
}

const cacheStore = new Map<string, CacheEntry>();

export const serverCache = {
  /**
   * Retrieves data from the cache. Returns null if expired or not found.
   */
  get<T>(key: string): T | null {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      cacheStore.delete(key); // Lazy eviction
      return null;
    }
    
    return entry.data as T;
  },

  /**
   * Saves data to cache with a custom Time-To-Live (TTL) in milliseconds.
   */
  set(key: string, data: any, ttlMs: number): void {
    cacheStore.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  },

  /**
   * Removes cached keys starting with the specified prefix.
   * Useful when an entity changes (e.g. invalidating 'styles' when a style model is updated)
   */
  invalidate(prefix: string): void {
    let deletedCount = 0;
    for (const key of cacheStore.keys()) {
      if (key.startsWith(prefix)) {
        cacheStore.delete(key);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      console.log(`Cache invalidated: Prefix "${prefix}" (${deletedCount} keys evicted)`);
    }
  },

  /**
   * Flushes the entire cache store
   */
  clearAll(): void {
    cacheStore.clear();
    console.log('Cache fully cleared.');
  }
};

/**
 * Cleanup expired cache entries periodically to free memory
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cacheStore.entries()) {
    if (now > entry.expiry) {
      cacheStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref(); // Runs every 10 minutes, background unref
