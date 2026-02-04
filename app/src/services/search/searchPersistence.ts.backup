/**
 * Search Persistence Service
 *
 * Handles automatic saving of search queries and results to the database.
 * Implements FIFO cleanup to maintain only the last 100 searches.
 */

import { prisma } from "@/lib/prisma";
import type { SearchResponse } from "@/types/search";
import type { Search, SearchResult } from "@prisma/client";

const MAX_SEARCHES = 100;

type SearchWithResults = Search & {
  results: SearchResult[];
};

type SearchSummary = {
  id: string;
  term: string;
  resultsCount: number;
  createdAt: Date;
  filters: unknown;
};

export const searchPersistence = {
  /**
   * Save a search and its results to the database
   */
  async saveSearch(
    response: SearchResponse,
    sessionId?: string
  ): Promise<string> {
    try {
      // Create the search record with nested results
      const search = await prisma.search.create({
        data: {
          term: response.term,
          filters: response.meta.sources.length > 0 ? {} : null, // Store filters if any
          resultsCount: response.pagination.totalResults,
          sessionId: sessionId || null,
          results: {
            create: response.results.map((result) => ({
              description: result.description,
              price: result.price,
              unit: result.unit,
              source: result.source,
              sourceUrl: result.sourceUrl,
              quotationDate: new Date(result.quotationDate),
              organ: result.organ || null,
            })),
          },
        },
      });

      console.log(
        '[SearchPersistence] Saved search "' + response.term + '" with ' + response.pagination.totalResults + ' results (ID: ' + search.id + ')'
      );

      // Cleanup old searches (FIFO - keep last 100)
      await this.cleanupOldSearches(sessionId);

      return search.id;
    } catch (error) {
      console.error("[SearchPersistence] Error saving search:", error);
      throw new Error('Failed to save search: ' + error);
    }
  },

  /**
   * Cleanup old searches to maintain FIFO limit
   * Keeps only the last MAX_SEARCHES (100) searches
   */
  async cleanupOldSearches(sessionId?: string): Promise<void> {
    try {
      // Count total searches for this session (or global if no session)
      const totalSearches = await prisma.search.count({
        where: sessionId ? { sessionId } : {},
      });

      if (totalSearches > MAX_SEARCHES) {
        const excessCount = totalSearches - MAX_SEARCHES;

        // Find the IDs of the oldest searches to delete
        const oldSearches = await prisma.search.findMany({
          where: sessionId ? { sessionId } : {},
          orderBy: { createdAt: "asc" },
          take: excessCount,
          select: { id: true },
        });

        const idsToDelete = oldSearches.map((s) => s.id);

        // Delete old searches (cascade will delete related results)
        const deleted = await prisma.search.deleteMany({
          where: { id: { in: idsToDelete } },
        });

        console.log(
          "[SearchPersistence] Cleaned up " + deleted.count + " old searches (FIFO)"
        );
      }
    } catch (error) {
      console.error("[SearchPersistence] Error cleaning up searches:", error);
      // Don't throw - cleanup failure shouldn't break the search
    }
  },

  /**
   * Get recent searches for a session
   */
  async getRecentSearches(
    sessionId?: string,
    limit: number = 20
  ): Promise<SearchSummary[]> {
    try {
      const searches = await prisma.search.findMany({
        where: sessionId ? { sessionId } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          term: true,
          resultsCount: true,
          createdAt: true,
          filters: true,
        },
      });

      return searches;
    } catch (error) {
      console.error("[SearchPersistence] Error fetching searches:", error);
      return [];
    }
  },

  /**
   * Get a specific search with all results
   */
  async getSearchById(searchId: string): Promise<SearchWithResults | null> {
    try {
      const search = await prisma.search.findUnique({
        where: { id: searchId },
        include: {
          results: {
            orderBy: { price: "asc" },
          },
        },
      });

      return search;
    } catch (error) {
      console.error("[SearchPersistence] Error fetching search:", error);
      return null;
    }
  },

  /**
   * Delete a search by ID
   */
  async deleteSearch(searchId: string): Promise<boolean> {
    try {
      await prisma.search.delete({
        where: { id: searchId },
      });

      console.log("[SearchPersistence] Deleted search: " + searchId);
      return true;
    } catch (error) {
      console.error("[SearchPersistence] Error deleting search:", error);
      return false;
    }
  },

  /**
   * Get total search count
   */
  async getSearchCount(sessionId?: string): Promise<number> {
    try {
      return await prisma.search.count({
        where: sessionId ? { sessionId } : {},
      });
    } catch (error) {
      console.error("[SearchPersistence] Error counting searches:", error);
      return 0;
    }
  },
};
