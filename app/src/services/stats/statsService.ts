/**
 * Statistics Service
 *
 * Provides filtering, sorting, and statistics calculation utilities
 * for search results.
 */

import type { PriceResult } from "@/types/search";
import type { Filters } from "@/components/results/FiltersPanel";

export type SortField = "price" | "date" | "description" | "source";
export type SortOrder = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

/**
 * Filter results based on filter criteria
 */
export function filterResults(
  results: PriceResult[],
  filters: Filters
): PriceResult[] {
  let filtered = [...results];

  // Filter by price range
  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((item) => item.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((item) => item.price <= filters.maxPrice!);
  }

  // Filter by date range
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.quotationDate);
      return itemDate >= startDate;
    });
  }
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date
    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.quotationDate);
      return itemDate <= endDate;
    });
  }

  // Filter by sources
  if (filters.sources && filters.sources.length > 0) {
    filtered = filtered.filter((item) =>
      filters.sources!.includes(item.source)
    );
  }

  return filtered;
}

/**
 * Sort results based on sort configuration
 */
export function sortResults(
  results: PriceResult[],
  sortConfig: SortConfig
): PriceResult[] {
  const sorted = [...results];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortConfig.field) {
      case "price":
        comparison = a.price - b.price;
        break;
      case "date":
        comparison =
          new Date(a.quotationDate).getTime() -
          new Date(b.quotationDate).getTime();
        break;
      case "description":
        comparison = a.description.localeCompare(b.description, "pt-BR");
        break;
      case "source":
        comparison = a.source.localeCompare(b.source, "pt-BR");
        break;
    }

    return sortConfig.order === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Calculate statistics from filtered results
 */
export function calculateStats(items: PriceResult[]) {
  const pricesOnly = items.filter((item) => item.price > 0);

  if (pricesOnly.length === 0) {
    return {
      count: items.length,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
    };
  }

  const prices = pricesOnly.map((item) => item.price).sort((a, b) => a - b);
  const count = prices.length;
  const sum = prices.reduce((acc, p) => acc + p, 0);

  const median =
    count % 2 === 0
      ? (prices[count / 2 - 1] + prices[count / 2]) / 2
      : prices[Math.floor(count / 2)];

  return {
    count: items.length,
    average: Math.round((sum / count) * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: prices[0],
    max: prices[count - 1],
  };
}

/**
 * Get unique sources from results
 */
export function getUniqueSources(results: PriceResult[]): string[] {
  const sources = new Set(results.map((item) => item.source));
  return Array.from(sources).sort();
}
