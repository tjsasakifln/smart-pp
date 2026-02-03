/**
 * SearchService Integration Tests
 *
 * Tests the search orchestration service including:
 * - Multi-source aggregation
 * - Deduplication
 * - Statistics calculation
 * - Filter application
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { searchService } from './searchService';
import type { PriceItem } from '../datasource/types';
import type { SearchRequest } from '@/types/search';

// Mock the data source aggregator
vi.mock('../datasource', () => ({
  dataSourceAggregator: {
    search: vi.fn(),
    getSources: vi.fn(),
    checkAvailability: vi.fn(),
  },
}));

// Mock the cache
vi.mock('../cache/cacheManager', () => ({
  searchCache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(() => ({
      size: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
    })),
  },
}));

import { dataSourceAggregator } from '../datasource';
import { searchCache } from '../cache/cacheManager';

describe('SearchService', () => {
  const mockPriceItems: PriceItem[] = [
    {
      id: 'item1',
      description: 'PAPEL A4 75G/M2 BRANCO',
      price: 22.5,
      unit: 'RESMA',
      source: 'PNCP',
      sourceUrl: 'https://pncp.gov.br/1',
      quotationDate: new Date('2024-01-15'),
      organ: 'Ministério da Gestão',
      codigoCatmat: '150505',
    },
    {
      id: 'item2',
      description: 'PAPEL SULFITE A4',
      price: 24.0,
      unit: 'RESMA',
      source: 'ComprasGov',
      sourceUrl: 'https://compras.gov.br/1',
      quotationDate: new Date('2024-01-10'),
      organ: 'Ministério da Educação',
      codigoCatmat: '150505',
    },
    {
      id: 'item3',
      description: 'CANETA AZUL',
      price: 1.25,
      unit: 'UN',
      source: 'PNCP',
      sourceUrl: 'https://pncp.gov.br/2',
      quotationDate: new Date('2024-01-20'),
      organ: 'Ministério da Fazenda',
      codigoCatmat: '150590',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.USE_MOCK_DATA = 'false';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('search()', () => {
    it('should aggregate results from multiple sources', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(mockPriceItems);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['PNCP', 'ComprasGov']);

      const request: SearchRequest = {
        term: 'papel A4',
      };

      const response = await searchService.search(request);

      expect(response.results.length).toBeGreaterThan(0);
      expect(response.meta.sources).toContain('PNCP');
      expect(response.meta.sources).toContain('ComprasGov');
    });

    it('should deduplicate results by ID', async () => {
      const duplicateItems: PriceItem[] = [
        ...mockPriceItems,
        { ...mockPriceItems[0], id: 'item1' }, // Duplicate
      ];

      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(duplicateItems);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['PNCP']);

      const request: SearchRequest = {
        term: 'test',
      };

      const response = await searchService.search(request);

      // Should remove duplicates
      const uniqueIds = new Set(response.results.map((r) => r.id));
      expect(uniqueIds.size).toBe(response.results.length);
    });

    it('should calculate statistics correctly', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(mockPriceItems);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['PNCP']);

      const request: SearchRequest = {
        term: 'test',
      };

      const response = await searchService.search(request);

      expect(response.stats).toBeDefined();
      expect(response.stats.count).toBe(3);
      expect(response.stats.average).toBeGreaterThan(0);
      expect(response.stats.median).toBeGreaterThan(0);
      expect(response.stats.min).toBe(1.25); // Cheapest item
      expect(response.stats.max).toBe(24.0); // Most expensive item
    });

    it('should apply price filters', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(mockPriceItems);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['PNCP']);

      const request: SearchRequest = {
        term: 'test',
        filters: {
          minPrice: 20,
          maxPrice: 25,
        },
      };

      await searchService.search(request);

      // Verify filters were passed to aggregator
      expect(dataSourceAggregator.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          filters: expect.objectContaining({
            minPrice: 20,
            maxPrice: 25,
          }),
        })
      );
    });

    it('should apply date filters', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(mockPriceItems);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['PNCP']);

      const request: SearchRequest = {
        term: 'test',
        filters: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      };

      await searchService.search(request);

      expect(dataSourceAggregator.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          filters: expect.objectContaining({
            minDate: expect.any(Date),
            maxDate: expect.any(Date),
          }),
        })
      );
    });

    it('should handle empty results', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue([]);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue([]);

      const request: SearchRequest = {
        term: 'nonexistent item',
      };

      const response = await searchService.search(request);

      // Should return mock data as fallback
      expect(response.results.length).toBeGreaterThan(0);
      expect(response.meta.sources).toContain('Mock Data');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockRejectedValue(
        new Error('API Error')
      );

      const request: SearchRequest = {
        term: 'test',
      };

      const response = await searchService.search(request);

      // Should fall back to mock data
      expect(response).toBeDefined();
      expect(response.results).toBeDefined();
    });
  });

  describe('Cache integration', () => {
    it('should return cached results when available', async () => {
      const cachedResponse = {
        id: 'cached_123',
        term: 'papel',
        results: [],
        stats: {
          count: 0,
          average: 0,
          median: 0,
          min: 0,
          max: 0,
        },
        pagination: {
          page: 1,
          pageSize: 20,
          totalPages: 1,
          totalResults: 0,
        },
        meta: {
          sources: ['Cache'],
          searchedAt: new Date().toISOString(),
          cached: true,
        },
      };

      vi.mocked(searchCache.get).mockReturnValue(cachedResponse);

      const request: SearchRequest = {
        term: 'papel',
      };

      const response = await searchService.search(request);

      expect(response.meta.cached).toBe(true);
      expect(dataSourceAggregator.search).not.toHaveBeenCalled();
    });

    it('should cache new search results', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(mockPriceItems);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['PNCP']);

      const request: SearchRequest = {
        term: 'test',
      };

      await searchService.search(request);

      expect(searchCache.set).toHaveBeenCalled();
    });

    it('should not cache mock data', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue([]);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue([]);

      const request: SearchRequest = {
        term: 'test',
      };

      await searchService.search(request);

      // Should not cache mock/fallback data
      expect(searchCache.set).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const manyItems: PriceItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `item${i}`,
        description: `Item ${i}`,
        price: 100 + i,
        unit: 'UN',
        source: 'Test',
        sourceUrl: `https://test.com/${i}`,
        quotationDate: new Date(),
      }));

      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(manyItems);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['Test']);

      const request: SearchRequest = {
        term: 'test',
        page: 2,
        pageSize: 10,
      };

      const response = await searchService.search(request);

      expect(response.pagination.page).toBe(2);
      expect(response.pagination.pageSize).toBe(10);
      expect(response.results.length).toBe(10);
      expect(response.pagination.totalResults).toBe(50);
      expect(response.pagination.totalPages).toBe(5);
    });

    it('should handle last page with partial results', async () => {
      const items: PriceItem[] = Array.from({ length: 25 }, (_, i) => ({
        id: `item${i}`,
        description: `Item ${i}`,
        price: 100,
        unit: 'UN',
        source: 'Test',
        sourceUrl: 'https://test.com',
        quotationDate: new Date(),
      }));

      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(items);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['Test']);

      const request: SearchRequest = {
        term: 'test',
        page: 3,
        pageSize: 10,
      };

      const response = await searchService.search(request);

      expect(response.results.length).toBe(5); // Last page has only 5 items
      expect(response.pagination.totalPages).toBe(3);
    });
  });

  describe('Statistics calculation', () => {
    it('should calculate average correctly', async () => {
      const items: PriceItem[] = [
        {
          id: '1',
          description: 'Item 1',
          price: 100,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
        {
          id: '2',
          description: 'Item 2',
          price: 200,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
        {
          id: '3',
          description: 'Item 3',
          price: 300,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
      ];

      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(items);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['Test']);

      const response = await searchService.search({ term: 'test' });

      expect(response.stats.average).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should calculate median correctly (odd count)', async () => {
      const items: PriceItem[] = [
        {
          id: '1',
          description: 'Item 1',
          price: 100,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
        {
          id: '2',
          description: 'Item 2',
          price: 200,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
        {
          id: '3',
          description: 'Item 3',
          price: 300,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
      ];

      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(items);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['Test']);

      const response = await searchService.search({ term: 'test' });

      expect(response.stats.median).toBe(200); // Middle value
    });

    it('should calculate median correctly (even count)', async () => {
      const items: PriceItem[] = [
        {
          id: '1',
          description: 'Item 1',
          price: 100,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
        {
          id: '2',
          description: 'Item 2',
          price: 200,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
        {
          id: '3',
          description: 'Item 3',
          price: 300,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
        {
          id: '4',
          description: 'Item 4',
          price: 400,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
      ];

      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(items);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['Test']);

      const response = await searchService.search({ term: 'test' });

      expect(response.stats.median).toBe(250); // (200 + 300) / 2
    });

    it('should handle empty results in statistics', async () => {
      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue([]);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue([]);

      const response = await searchService.search({ term: 'nonexistent' });

      expect(response.stats.count).toBeGreaterThanOrEqual(0);
    });

    it('should handle single result in statistics', async () => {
      const singleItem: PriceItem[] = [
        {
          id: '1',
          description: 'Single Item',
          price: 150,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
      ];

      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(singleItem);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['Test']);

      const response = await searchService.search({ term: 'test' });

      expect(response.stats.count).toBe(1);
      expect(response.stats.average).toBe(150);
      expect(response.stats.median).toBe(150);
      expect(response.stats.min).toBe(150);
      expect(response.stats.max).toBe(150);
    });

    it('should ignore zero-price items in statistics', async () => {
      const itemsWithZero: PriceItem[] = [
        {
          id: '1',
          description: 'Item with price',
          price: 100,
          unit: 'UN',
          source: 'Test',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
        {
          id: '2',
          description: 'Catalog item',
          price: 0, // Catalog item without price
          unit: 'UN',
          source: 'CATMAT',
          sourceUrl: 'https://test.com',
          quotationDate: new Date(),
        },
      ];

      vi.mocked(searchCache.get).mockReturnValue(undefined);
      vi.mocked(dataSourceAggregator.search).mockResolvedValue(itemsWithZero);
      vi.mocked(dataSourceAggregator.getSources).mockReturnValue(['Test']);

      const response = await searchService.search({ term: 'test' });

      // Stats should only include items with price > 0
      expect(response.stats.count).toBe(2); // Total count includes zero-price
      expect(response.stats.min).toBe(100); // Should not be 0
    });
  });

  describe('Utility methods', () => {
    it('should check source availability', async () => {
      vi.mocked(dataSourceAggregator.checkAvailability).mockResolvedValue({
        PNCP: true,
        ComprasGov: false,
      });

      const availability = await searchService.checkSources();

      expect(availability).toEqual({
        PNCP: true,
        ComprasGov: false,
      });
    });

    it('should get cache statistics', () => {
      vi.mocked(searchCache.getStats).mockReturnValue({
        size: 10,
        hits: 50,
        misses: 25,
        hitRate: 0.67,
      });

      const stats = searchService.getCacheStats();

      expect(stats.size).toBe(10);
      expect(stats.hits).toBe(50);
      expect(stats.hitRate).toBe(0.67);
    });

    it('should clear cache', () => {
      searchService.clearCache();

      expect(searchCache.clear).toHaveBeenCalled();
    });
  });
});
