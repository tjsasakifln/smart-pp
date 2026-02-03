/**
 * StatsService Integration Tests
 *
 * Tests statistics, filtering, and sorting utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterResults,
  sortResults,
  calculateStats,
  getUniqueSources,
  type SortConfig,
} from './statsService';
import type { PriceResult } from '@/types/search';
import type { Filters } from '@/components/results/FiltersPanel';

describe('StatsService', () => {
  let mockResults: PriceResult[];

  beforeEach(() => {
    mockResults = [
      {
        id: '1',
        description: 'PAPEL A4 75G/M2',
        price: 22.5,
        unit: 'RESMA',
        source: 'PNCP - Pregao',
        sourceUrl: 'https://pncp.gov.br/1',
        quotationDate: '2024-01-15T00:00:00Z',
        organ: 'Ministério da Gestão',
      },
      {
        id: '2',
        description: 'CANETA AZUL',
        price: 1.25,
        unit: 'UN',
        source: 'PNCP - Ata',
        sourceUrl: 'https://pncp.gov.br/2',
        quotationDate: '2024-01-10T00:00:00Z',
        organ: 'Ministério da Educação',
      },
      {
        id: '3',
        description: 'NOTEBOOK I7 16GB',
        price: 5500.0,
        unit: 'UN',
        source: 'ComprasGov',
        sourceUrl: 'https://compras.gov.br/1',
        quotationDate: '2024-01-20T00:00:00Z',
        organ: 'Ministério da Defesa',
      },
      {
        id: '4',
        description: 'MOUSE USB',
        price: 35.0,
        unit: 'UN',
        source: 'PNCP - Pregao',
        sourceUrl: 'https://pncp.gov.br/3',
        quotationDate: '2024-01-25T00:00:00Z',
        organ: 'Ministério da Fazenda',
      },
    ];
  });

  describe('calculateStats()', () => {
    it('should calculate average correctly', () => {
      const stats = calculateStats(mockResults);

      // (22.5 + 1.25 + 5500 + 35) / 4 = 1389.6875
      expect(stats.average).toBeCloseTo(1389.69, 2);
    });

    it('should calculate median correctly (even count)', () => {
      const stats = calculateStats(mockResults);

      // Sorted: [1.25, 22.5, 35, 5500]
      // Median: (22.5 + 35) / 2 = 28.75
      expect(stats.median).toBe(28.75);
    });

    it('should calculate median correctly (odd count)', () => {
      const oddResults = mockResults.slice(0, 3);
      const stats = calculateStats(oddResults);

      // Sorted: [1.25, 22.5, 5500]
      // Median: 22.5
      expect(stats.median).toBe(22.5);
    });

    it('should handle empty results', () => {
      const stats = calculateStats([]);

      expect(stats).toEqual({
        count: 0,
        average: 0,
        median: 0,
        min: 0,
        max: 0,
      });
    });

    it('should handle single result', () => {
      const singleResult = [mockResults[0]];
      const stats = calculateStats(singleResult);

      expect(stats.count).toBe(1);
      expect(stats.average).toBe(22.5);
      expect(stats.median).toBe(22.5);
      expect(stats.min).toBe(22.5);
      expect(stats.max).toBe(22.5);
    });

    it('should ignore zero-price items', () => {
      const resultsWithZero: PriceResult[] = [
        ...mockResults,
        {
          id: '5',
          description: 'CATALOG ITEM',
          price: 0,
          unit: 'UN',
          source: 'CATMAT',
          sourceUrl: 'https://catmat.gov.br/1',
          quotationDate: '2024-01-01T00:00:00Z',
        },
      ];

      const stats = calculateStats(resultsWithZero);

      // Should calculate stats only for items with price > 0
      expect(stats.count).toBe(5); // Total count includes zero-price
      expect(stats.min).not.toBe(0); // Min should not be 0
      expect(stats.min).toBe(1.25); // Actual minimum non-zero price
    });

    it('should calculate min and max correctly', () => {
      const stats = calculateStats(mockResults);

      expect(stats.min).toBe(1.25);
      expect(stats.max).toBe(5500.0);
    });
  });

  describe('filterResults()', () => {
    it('should filter by minimum price', () => {
      const filters: Filters = {
        minPrice: 30,
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(2);
      expect(filtered.every((r) => r.price >= 30)).toBe(true);
    });

    it('should filter by maximum price', () => {
      const filters: Filters = {
        maxPrice: 50,
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(3);
      expect(filtered.every((r) => r.price <= 50)).toBe(true);
    });

    it('should filter by price range', () => {
      const filters: Filters = {
        minPrice: 10,
        maxPrice: 100,
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(2); // 22.5 and 35
      expect(filtered.every((r) => r.price >= 10 && r.price <= 100)).toBe(true);
    });

    it('should filter by start date', () => {
      const filters: Filters = {
        startDate: '2024-01-16',
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(2);
      expect(
        filtered.every(
          (r) => new Date(r.quotationDate) >= new Date('2024-01-16')
        )
      ).toBe(true);
    });

    it('should filter by end date', () => {
      const filters: Filters = {
        endDate: '2024-01-15',
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(2);
      expect(
        filtered.every(
          (r) => new Date(r.quotationDate) <= new Date('2024-01-15T23:59:59')
        )
      ).toBe(true);
    });

    it('should filter by date range', () => {
      const filters: Filters = {
        startDate: '2024-01-12',
        endDate: '2024-01-22',
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(2); // Jan 15 and Jan 20
    });

    it('should filter by sources', () => {
      const filters: Filters = {
        sources: ['PNCP - Pregao'],
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(2);
      expect(filtered.every((r) => r.source === 'PNCP - Pregao')).toBe(true);
    });

    it('should filter by multiple sources', () => {
      const filters: Filters = {
        sources: ['PNCP - Pregao', 'PNCP - Ata'],
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(3);
      expect(
        filtered.every(
          (r) => r.source === 'PNCP - Pregao' || r.source === 'PNCP - Ata'
        )
      ).toBe(true);
    });

    it('should apply multiple filters together', () => {
      const filters: Filters = {
        minPrice: 20,
        maxPrice: 40,
        startDate: '2024-01-01',
        endDate: '2024-01-20',
        sources: ['PNCP - Pregao'],
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(1);
      expect(filtered[0].price).toBe(22.5);
    });

    it('should return all results when no filters applied', () => {
      const filters: Filters = {};

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(mockResults.length);
    });

    it('should return empty array when filters match nothing', () => {
      const filters: Filters = {
        minPrice: 10000,
      };

      const filtered = filterResults(mockResults, filters);

      expect(filtered.length).toBe(0);
    });
  });

  describe('sortResults()', () => {
    it('should sort by price ascending', () => {
      const sortConfig: SortConfig = {
        field: 'price',
        order: 'asc',
      };

      const sorted = sortResults(mockResults, sortConfig);

      expect(sorted[0].price).toBe(1.25);
      expect(sorted[sorted.length - 1].price).toBe(5500.0);
    });

    it('should sort by price descending', () => {
      const sortConfig: SortConfig = {
        field: 'price',
        order: 'desc',
      };

      const sorted = sortResults(mockResults, sortConfig);

      expect(sorted[0].price).toBe(5500.0);
      expect(sorted[sorted.length - 1].price).toBe(1.25);
    });

    it('should sort by date ascending', () => {
      const sortConfig: SortConfig = {
        field: 'date',
        order: 'asc',
      };

      const sorted = sortResults(mockResults, sortConfig);

      expect(sorted[0].quotationDate).toBe('2024-01-10T00:00:00Z');
      expect(sorted[sorted.length - 1].quotationDate).toBe(
        '2024-01-25T00:00:00Z'
      );
    });

    it('should sort by date descending', () => {
      const sortConfig: SortConfig = {
        field: 'date',
        order: 'desc',
      };

      const sorted = sortResults(mockResults, sortConfig);

      expect(sorted[0].quotationDate).toBe('2024-01-25T00:00:00Z');
      expect(sorted[sorted.length - 1].quotationDate).toBe(
        '2024-01-10T00:00:00Z'
      );
    });

    it('should sort by description ascending', () => {
      const sortConfig: SortConfig = {
        field: 'description',
        order: 'asc',
      };

      const sorted = sortResults(mockResults, sortConfig);

      expect(sorted[0].description).toBe('CANETA AZUL');
      expect(sorted[sorted.length - 1].description).toBe('PAPEL A4 75G/M2');
    });

    it('should sort by description descending', () => {
      const sortConfig: SortConfig = {
        field: 'description',
        order: 'desc',
      };

      const sorted = sortResults(mockResults, sortConfig);

      expect(sorted[0].description).toBe('PAPEL A4 75G/M2');
      expect(sorted[sorted.length - 1].description).toBe('CANETA AZUL');
    });

    it('should sort by source ascending', () => {
      const sortConfig: SortConfig = {
        field: 'source',
        order: 'asc',
      };

      const sorted = sortResults(mockResults, sortConfig);

      expect(sorted[0].source).toBe('ComprasGov');
      expect(sorted[sorted.length - 1].source).toContain('PNCP');
    });

    it('should sort by source descending', () => {
      const sortConfig: SortConfig = {
        field: 'source',
        order: 'desc',
      };

      const sorted = sortResults(mockResults, sortConfig);

      expect(sorted[0].source).toContain('PNCP');
      expect(sorted[sorted.length - 1].source).toBe('ComprasGov');
    });

    it('should not modify original array', () => {
      const original = [...mockResults];
      const sortConfig: SortConfig = {
        field: 'price',
        order: 'asc',
      };

      sortResults(mockResults, sortConfig);

      expect(mockResults).toEqual(original);
    });

    it('should handle empty array', () => {
      const sortConfig: SortConfig = {
        field: 'price',
        order: 'asc',
      };

      const sorted = sortResults([], sortConfig);

      expect(sorted).toEqual([]);
    });

    it('should handle single item', () => {
      const singleResult = [mockResults[0]];
      const sortConfig: SortConfig = {
        field: 'price',
        order: 'asc',
      };

      const sorted = sortResults(singleResult, sortConfig);

      expect(sorted.length).toBe(1);
      expect(sorted[0]).toEqual(mockResults[0]);
    });
  });

  describe('getUniqueSources()', () => {
    it('should return unique sources', () => {
      const sources = getUniqueSources(mockResults);

      expect(sources.length).toBe(3);
      expect(sources).toContain('PNCP - Pregao');
      expect(sources).toContain('PNCP - Ata');
      expect(sources).toContain('ComprasGov');
    });

    it('should sort sources alphabetically', () => {
      const sources = getUniqueSources(mockResults);

      expect(sources[0]).toBe('ComprasGov');
      expect(sources).toEqual([...sources].sort());
    });

    it('should handle empty results', () => {
      const sources = getUniqueSources([]);

      expect(sources).toEqual([]);
    });

    it('should deduplicate sources', () => {
      const duplicateResults = [
        ...mockResults,
        ...mockResults, // Duplicate all items
      ];

      const sources = getUniqueSources(duplicateResults);

      // Should still only return 3 unique sources
      expect(sources.length).toBe(3);
    });
  });

  describe('Integration: Filter + Sort + Stats', () => {
    it('should apply filters, then sort, then calculate stats', () => {
      // First filter
      const filters: Filters = {
        minPrice: 20,
      };
      const filtered = filterResults(mockResults, filters);

      // Then sort
      const sortConfig: SortConfig = {
        field: 'price',
        order: 'asc',
      };
      const sorted = sortResults(filtered, sortConfig);

      // Then calculate stats
      const stats = calculateStats(sorted);

      expect(sorted.length).toBe(3); // 22.5, 35, 5500
      expect(sorted[0].price).toBe(22.5);
      expect(stats.min).toBe(22.5);
      expect(stats.max).toBe(5500.0);
    });

    it('should handle complex filtering workflow', () => {
      // Filter by price range and date
      const filters: Filters = {
        minPrice: 1,
        maxPrice: 100,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const filtered = filterResults(mockResults, filters);

      // Sort by date descending
      const sortConfig: SortConfig = {
        field: 'date',
        order: 'desc',
      };
      const sorted = sortResults(filtered, sortConfig);

      // Calculate stats on filtered results
      const stats = calculateStats(sorted);

      expect(sorted.length).toBeGreaterThan(0);
      expect(stats.count).toBe(sorted.length);
      expect(stats.average).toBeGreaterThan(0);
    });

    it('should handle workflow with no results', () => {
      // Filter that matches nothing
      const filters: Filters = {
        minPrice: 100000,
      };
      const filtered = filterResults(mockResults, filters);

      const sortConfig: SortConfig = {
        field: 'price',
        order: 'asc',
      };
      const sorted = sortResults(filtered, sortConfig);

      const stats = calculateStats(sorted);

      expect(sorted.length).toBe(0);
      expect(stats.count).toBe(0);
      expect(stats.average).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle results with same prices', () => {
      const samePriceResults: PriceResult[] = [
        { ...mockResults[0], price: 100 },
        { ...mockResults[1], price: 100 },
        { ...mockResults[2], price: 100 },
      ];

      const stats = calculateStats(samePriceResults);

      expect(stats.average).toBe(100);
      expect(stats.median).toBe(100);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(100);
    });

    it('should handle very large prices', () => {
      const largePriceResults: PriceResult[] = [
        { ...mockResults[0], price: 1000000 },
        { ...mockResults[1], price: 2000000 },
        { ...mockResults[2], price: 3000000 },
      ];

      const stats = calculateStats(largePriceResults);

      expect(stats.average).toBe(2000000);
      expect(stats.max).toBe(3000000);
    });

    it('should handle very small prices', () => {
      const smallPriceResults: PriceResult[] = [
        { ...mockResults[0], price: 0.01 },
        { ...mockResults[1], price: 0.02 },
        { ...mockResults[2], price: 0.03 },
      ];

      const stats = calculateStats(smallPriceResults);

      expect(stats.average).toBeCloseTo(0.02, 2);
      expect(stats.min).toBe(0.01);
    });

    it('should handle date boundaries correctly', () => {
      const filters: Filters = {
        startDate: '2024-01-15',
        endDate: '2024-01-15',
      };

      const filtered = filterResults(mockResults, filters);

      // Should include exactly one item on Jan 15
      expect(filtered.length).toBe(1);
      expect(filtered[0].quotationDate).toContain('2024-01-15');
    });
  });
});
