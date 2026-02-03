/**
 * Data Source Aggregator
 *
 * Combines results from multiple data sources (PNCP, Compras.gov.br)
 * with deduplication and priority ranking.
 */

import type { DataSourceAdapter, PriceItem, SearchOptions } from "./types";
import { pncpAdapter } from "./pncpAdapter";
import { comprasGovAdapter } from "./comprasGovAdapter";

/**
 * Priority ranking for data sources
 * Lower number = higher priority
 *
 * Priority: PNCP > Contratos > CATMAT
 * Within PNCP: Itens > Atas > Contratos
 */
const SOURCE_PRIORITY: Record<string, number> = {
  "PNCP - Pregão Eletrônico": 1,
  "PNCP - Pregao Eletronico": 1,
  "PNCP - Pregão": 1,
  "PNCP - Pregao": 1,
  "PNCP - Dispensa Eletrônica": 2,
  "PNCP - Dispensa Eletronica": 2,
  "PNCP - Dispensa": 2,
  "PNCP - Ata de Registro de Preco": 3,
  "PNCP - Contrato": 4,
  "PNCP - Concorrência": 5,
  "PNCP - Concorrencia": 5,
  "PNCP - Inexigibilidade": 6,
  "Contratos - Compras.gov.br": 7,
  "CATMAT - Compras.gov.br": 10, // Lowest priority (catalog, no prices)
};

/**
 * Get priority for a source
 */
function getSourcePriority(source: string): number {
  // Check for partial matches
  for (const [key, priority] of Object.entries(SOURCE_PRIORITY)) {
    if (source.includes(key) || key.includes(source)) {
      return priority;
    }
  }
  return 99; // Unknown sources get lowest priority
}

export class DataSourceAggregator {
  private adapters: DataSourceAdapter[];

  constructor(adapters: DataSourceAdapter[]) {
    this.adapters = adapters;
  }

  /**
   * Search across all data sources and aggregate results
   */
  async search(term: string, options?: SearchOptions): Promise<PriceItem[]> {
    // Fetch from all adapters in parallel
    const results = await Promise.allSettled(
      this.adapters.map((adapter) => adapter.search(term, options))
    );

    // Collect successful results
    const allItems: PriceItem[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        allItems.push(...result.value);
      } else {
        console.warn("[Aggregator] Adapter failed:", result.reason);
      }
    }

    // Deduplicate and rank
    const deduplicated = this.deduplicateItems(allItems);
    const sorted = this.sortByPriority(deduplicated);

    return sorted;
  }

  /**
   * Deduplicate items by CATMAT/CATSER code or description similarity
   */
  private deduplicateItems(items: PriceItem[]): PriceItem[] {
    const seen = new Map<string, PriceItem>();

    for (const item of items) {
      // Create a deduplication key
      const key = this.getDeduplicationKey(item);

      const existing = seen.get(key);

      if (!existing) {
        seen.set(key, item);
      } else {
        // Keep the item with higher priority (lower number)
        const existingPriority = getSourcePriority(existing.source);
        const newPriority = getSourcePriority(item.source);

        if (newPriority < existingPriority) {
          seen.set(key, item);
        } else if (
          newPriority === existingPriority &&
          item.price > 0 &&
          existing.price === 0
        ) {
          // Prefer items with actual prices
          seen.set(key, item);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Create a deduplication key for an item
   */
  private getDeduplicationKey(item: PriceItem): string {
    // Prefer CATMAT/CATSER codes for exact matching
    if (item.codigoCatmat) {
      return `catmat:${item.codigoCatmat}`;
    }
    if (item.codigoCatser) {
      return `catser:${item.codigoCatser}`;
    }

    // Fallback to normalized description
    return `desc:${this.normalizeDescription(item.description)}`;
  }

  /**
   * Normalize description for comparison
   */
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 50);
  }

  /**
   * Sort items by source priority and price
   */
  private sortByPriority(items: PriceItem[]): PriceItem[] {
    return items.sort((a, b) => {
      // First, sort by source priority
      const priorityDiff =
        getSourcePriority(a.source) - getSourcePriority(b.source);
      if (priorityDiff !== 0) return priorityDiff;

      // Then by price (items with prices first)
      if (a.price > 0 && b.price === 0) return -1;
      if (a.price === 0 && b.price > 0) return 1;

      // Then by date (most recent first)
      return b.quotationDate.getTime() - a.quotationDate.getTime();
    });
  }

  /**
   * Check which adapters are available
   */
  async checkAvailability(): Promise<Record<string, boolean>> {
    const results = await Promise.all(
      this.adapters.map(async (adapter) => ({
        name: adapter.name,
        available: await adapter.isAvailable(),
      }))
    );

    return Object.fromEntries(results.map((r) => [r.name, r.available]));
  }

  /**
   * Get list of available data sources
   */
  getSources(): string[] {
    return this.adapters.map((a) => a.name);
  }
}

// Export singleton with default adapters
export const dataSourceAggregator = new DataSourceAggregator([
  pncpAdapter,
  comprasGovAdapter,
]);
