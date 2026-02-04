/**
 * History API Routes Test
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { searchPersistence } from "@/services/search/searchPersistence";
import type { SearchResponse } from "@/types/search";

describe("History API Routes", () => {
  let testSearchId: string;
  const testSessionId = "test-session-history-api";

  const mockSearchResponse: SearchResponse = {
    term: "notebook",
    results: [{
      description: "Notebook Dell",
      price: 3500.0,
      unit: "UN",
      source: "PNCP",
      sourceUrl: "https://pncp.gov.br/item/123",
      quotationDate: new Date("2024-01-15").toISOString(),
      organ: "Ministerio da Educacao",
    }],
    pagination: { page: 1, pageSize: 20, totalResults: 1, totalPages: 1 },
    meta: { searchDuration: 150, sources: ["PNCP"], dataSource: "api" },
  };

  beforeAll(async () => {
    testSearchId = await searchPersistence.saveSearch(mockSearchResponse, testSessionId);
  });

  afterAll(async () => {
    try { await searchPersistence.deleteSearch(testSearchId); }
    catch (error) { console.log("Cleanup:", error); }
  });

  it("should list searches", async () => {
    const searches = await searchPersistence.getRecentSearches(testSessionId, 20);
    expect(searches).toBeDefined();
    expect(Array.isArray(searches)).toBe(true);
  });

  it("should get search by ID", async () => {
    const search = await searchPersistence.getSearchById(testSearchId);
    expect(search).toBeDefined();
    expect(search?.term).toBe("notebook");
  });

  it("should delete search", async () => {
    const tempId = await searchPersistence.saveSearch(mockSearchResponse, testSessionId);
    const success = await searchPersistence.deleteSearch(tempId);
    expect(success).toBe(true);
  });
});
