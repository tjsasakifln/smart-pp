/**
 * Cache Manager Service
 *
 * LRU cache implementation for search results
 * to reduce external API calls and improve performance.
 */

import { LRUCache } from "lru-cache";
import type { SearchResponse } from "@/types/search";

interface CacheConfig {
  /** Maximum number of entries */
  max: number;
  /** Time-to-live in milliseconds */
  ttl: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  max: 1000,
  ttl: 10 * 60 * 1000, // 10 minutes
};

/**
 * Normalize search term for cache key
 */
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .substring(0, 100);
}

/**
 * Create cache key from search parameters
 */
function createCacheKey(
  term: string,
  filters?: Record<string, unknown>
): string {
  const normalizedTerm = normalizeSearchTerm(term);
  const filterHash = filters ? JSON.stringify(filters) : "";
  return `search:${normalizedTerm}:${filterHash}`;
}

class CacheManager {
  private cache: LRUCache<string, SearchResponse>;
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(config: CacheConfig = DEFAULT_CONFIG) {
    this.cache = new LRUCache<string, SearchResponse>({
      max: config.max,
      ttl: config.ttl,
      updateAgeOnGet: true, // Reset TTL on access
      allowStale: false,
    });
  }

  /**
   * Get cached search results
   */
  get(term: string, filters?: Record<string, unknown>): SearchResponse | undefined {
    const key = createCacheKey(term, filters);
    const cached = this.cache.get(key);

    if (cached) {
      this.stats.hits++;
      // Mark as cached in response
      return {
        ...cached,
        meta: {
          ...cached.meta,
          cached: true,
        },
      };
    }

    this.stats.misses++;
    return undefined;
  }

  /**
   * Store search results in cache
   */
  set(
    term: string,
    results: SearchResponse,
    filters?: Record<string, unknown>
  ): void {
    const key = createCacheKey(term, filters);
    this.cache.set(key, {
      ...results,
      meta: {
        ...results.meta,
        cached: false,
      },
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(term: string, filters?: Record<string, unknown>): void {
    const key = createCacheKey(term, filters);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Check if cache has entry (without getting it)
   */
  has(term: string, filters?: Record<string, unknown>): boolean {
    const key = createCacheKey(term, filters);
    return this.cache.has(key);
  }
}

// Export singleton instance
export const searchCache = new CacheManager();

// Export class for testing
export { CacheManager };
