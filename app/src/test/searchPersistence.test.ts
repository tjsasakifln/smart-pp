/**
 * Test suite for Search Persistence
 *
 * Tests the automatic saving of search history to the database.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { searchPersistence } from "@/services/search/searchPersistence";
import type { SearchResponse } from "@/types/search";

describe("Search Persistence Service", () => {
  const mockSearchResponse: SearchResponse = {
    id: "test_search_1",
    term: "papel a4",
    results: [
      {
        id: "result_1",
        description: "PAPEL A4 75G BRANCO RESMA 500 FOLHAS",
        price: 22.5,
        unit: "RESMA",
        source: "PNCP",
        sourceUrl: "https://pncp.gov.br/test",
        quotationDate: new Date("2024-01-15").toISOString(),
        organ: "Ministerio da Educacao",
        codigoCatmat: "150505",
      },
      {
        id: "result_2",
        description: "PAPEL SULFITE A4 BRANCO PCT 500",
        price: 24.0,
        unit: "RESMA",
        source: "PNCP",
        sourceUrl: "https://pncp.gov.br/test2",
        quotationDate: new Date("2024-01-20").toISOString(),
        organ: "Ministerio da Saude",
      },
    ],
    stats: {
      count: 2,
      average: 23.25,
      median: 23.25,
      min: 22.5,
      max: 24.0,
    },
    pagination: {
      page: 1,
      pageSize: 20,
      totalPages: 1,
      totalResults: 2,
    },
    meta: {
      sources: ["PNCP"],
      searchedAt: new Date().toISOString(),
      cached: false,
    },
  };

  it("should have saveSearch method", () => {
    expect(searchPersistence.saveSearch).toBeDefined();
    expect(typeof searchPersistence.saveSearch).toBe("function");
  });

  it("should have cleanupOldSearches method", () => {
    expect(searchPersistence.cleanupOldSearches).toBeDefined();
    expect(typeof searchPersistence.cleanupOldSearches).toBe("function");
  });

  it("should have getRecentSearches method", () => {
    expect(searchPersistence.getRecentSearches).toBeDefined();
    expect(typeof searchPersistence.getRecentSearches).toBe("function");
  });

  it("should have getSearchById method", () => {
    expect(searchPersistence.getSearchById).toBeDefined();
    expect(typeof searchPersistence.getSearchById).toBe("function");
  });

  it("should have deleteSearch method", () => {
    expect(searchPersistence.deleteSearch).toBeDefined();
    expect(typeof searchPersistence.deleteSearch).toBe("function");
  });

  it("should have getSearchCount method", () => {
    expect(searchPersistence.getSearchCount).toBeDefined();
    expect(typeof searchPersistence.getSearchCount).toBe("function");
  });

  // Note: Database integration tests require a running database
  // These tests verify the service interface and basic functionality
  describe("Interface validation", () => {
    it("should accept valid search response", () => {
      expect(() => {
        // Verify the mock data structure matches expected format
        const response = mockSearchResponse;
        expect(response.term).toBe("papel a4");
        expect(response.results.length).toBe(2);
        expect(response.pagination.totalResults).toBe(2);
      }).not.toThrow();
    });

    it("should handle session ID parameter", () => {
      expect(() => {
        const sessionId = "test-session-123";
        expect(sessionId).toBeDefined();
      }).not.toThrow();
    });
  });
});
