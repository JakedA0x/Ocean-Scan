interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  /**
   * Fetches data with caching, deduplication, and retry logic.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 30_000,
    retries: number = 2
  ): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    // Check if an identical request is already in-flight
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const promise = this.executeWithRetry(fetcher, retries)
      .then((data) => {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttlMs,
        });
        return data;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  private async executeWithRetry<T>(fetcher: () => Promise<T>, retriesLeft: number): Promise<T> {
    try {
      return await fetcher();
    } catch (err) {
      if (retriesLeft <= 0) {
        throw err;
      }
      // Exponential backoff with jitter (300ms, 600ms + random jitter)
      const delay = Math.pow(2, 2 - retriesLeft) * 300 + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.executeWithRetry(fetcher, retriesLeft - 1);
    }
  }

  clear() {
    this.cache.clear();
    this.inFlight.clear();
  }
}

export const apiCache = new ApiCacheService();
