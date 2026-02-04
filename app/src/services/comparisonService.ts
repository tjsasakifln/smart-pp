/**
 * Comparison Service - Story 3.5
 *
 * Handles comparison logic for multiple searches:
 * - Fetches search data from database
 * - Calculates statistics for each search
 * - Computes variation percentages between searches
 * - Identifies significant changes (> 10%)
 */

import { prisma } from "@/lib/prisma";
import type {
  ComparisonSearch,
  SearchStatistics,
  Variations,
  SignificantChange,
  ComparisonResponse,
} from "@/types/comparison";

const SIGNIFICANT_CHANGE_THRESHOLD = 10; // percentage

export class ComparisonService {
  /**
   * Compare multiple searches
   * @param searchIds Array of 2-3 search IDs
   * @returns Comparison data with variations and significant changes
   */
  async compareSearches(searchIds: string[]): Promise<ComparisonResponse> {
    // 1. Fetch all searches with results
    const searches = await this.fetchSearches(searchIds);

    // 2. Calculate variations between searches
    const variations = this.calculateVariations(searches);

    // 3. Identify significant changes (> 10%)
    const significantChanges = this.identifySignificantChanges(variations);

    return {
      searches,
      variations,
      significantChanges,
    };
  }

  /**
   * Fetch searches from database with their results
   */
  private async fetchSearches(
    searchIds: string[]
  ): Promise<ComparisonSearch[]> {
    const searches = await prisma.search.findMany({
      where: {
        id: { in: searchIds },
      },
      include: {
        results: {
          select: {
            price: true,
          },
        },
        _count: {
          select: { results: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check if all searches were found
    if (searches.length !== searchIds.length) {
      const foundIds = searches.map((s) => s.id);
      const missingIds = searchIds.filter((id) => !foundIds.includes(id));
      throw new Error(`Searches not found: ${missingIds.join(", ")}`);
    }

    // Map to ComparisonSearch format with statistics
    return searches.map((search) => ({
      id: search.id,
      term: search.term,
      date: search.createdAt.toISOString(),
      statistics: this.calculateStatistics(search.results),
      resultsCount: search._count.results,
    }));
  }

  /**
   * Calculate statistics for a set of search results
   */
  private calculateStatistics(
    results: Array<{ price: any }>
  ): SearchStatistics {
    if (results.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    // Convert Decimal to number and sort
    const prices = results
      .map((r) => Number(r.price))
      .filter((p) => !isNaN(p))
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    const sum = prices.reduce((acc, price) => acc + price, 0);
    const average = sum / prices.length;
    const median = prices[Math.floor(prices.length / 2)];
    const min = prices[0];
    const max = prices[prices.length - 1];

    return {
      average: Math.round(average * 100) / 100, // Round to 2 decimals
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      count: prices.length,
    };
  }

  /**
   * Calculate variation percentages between all searches
   */
  private calculateVariations(searches: ComparisonSearch[]): Variations {
    const metrics: Array<keyof SearchStatistics> = [
      "average",
      "median",
      "min",
      "max",
    ];

    const variations: Variations = {
      average: {},
      median: {},
      min: {},
      max: {},
    };

    // Calculate variations for each pair of searches
    for (let i = 0; i < searches.length; i++) {
      for (let j = i + 1; j < searches.length; j++) {
        const fromSearch = searches[i];
        const toSearch = searches[j];

        metrics.forEach((metric) => {
          const fromValue = fromSearch.statistics[metric];
          const toValue = toSearch.statistics[metric];

          // Calculate variation from -> to
          const forwardChange = this.calculateChange(fromValue, toValue);
          variations[metric][`${fromSearch.id}_vs_${toSearch.id}`] =
            forwardChange;

          // Calculate variation to -> from (inverse)
          const backwardChange = this.calculateChange(toValue, fromValue);
          variations[metric][`${toSearch.id}_vs_${fromSearch.id}`] =
            backwardChange;
        });
      }
    }

    return variations;
  }

  /**
   * Calculate percentage change between two values
   */
  private calculateChange(oldValue: number, newValue: number): string {
    // Handle division by zero
    if (oldValue === 0) {
      if (newValue === 0) return "0.0%";
      return "N/A"; // Cannot calculate % from zero
    }

    const change = ((newValue - oldValue) / oldValue) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  }

  /**
   * Identify significant changes (> 10% variation)
   */
  private identifySignificantChanges(
    variations: Variations
  ): SignificantChange[] {
    const significantChanges: SignificantChange[] = [];

    const metrics: Array<keyof Variations> = ["average", "median", "min", "max"];

    metrics.forEach((metric) => {
      Object.entries(variations[metric]).forEach(([comparison, change]) => {
        if (change === "N/A") return;

        // Parse percentage (e.g. "+5.2%" -> 5.2)
        const value = Math.abs(parseFloat(change.replace("%", "")));

        if (value > SIGNIFICANT_CHANGE_THRESHOLD) {
          const [from, to] = comparison.split("_vs_");
          significantChanges.push({
            metric,
            from,
            to,
            change,
            significant: true,
          });
        }
      });
    });

    return significantChanges;
  }
}

// Export singleton instance
export const comparisonService = new ComparisonService();
