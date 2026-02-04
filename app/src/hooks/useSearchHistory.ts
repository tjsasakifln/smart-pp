"use client";

import { useState, useEffect, useCallback } from "react";

interface SearchSummary {
  id: string;
  term: string;
  resultsCount: number;
  createdAt: Date;
  filters: unknown;
}

interface HistoryApiResponse {
  searches: SearchSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface HistoryResponse {
  searches: Array<{
    id: string;
    term: string;
    resultsCount: number;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

interface UseSearchHistoryResult {
  data: HistoryResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteSearch: (id: string) => Promise<void>;
}

export function useSearchHistory(
  page: number = 1,
  pageSize: number = 20
): UseSearchHistoryResult {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get sessionId from localStorage
      let sessionId = localStorage.getItem("sessionId");

      if (!sessionId) {
        // Generate a new session ID if it doesn't exist
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("sessionId", sessionId);
      }

      // Calculate offset from page number
      const offset = (page - 1) * pageSize;

      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/history?${params.toString()}`, {
        headers: {
          "x-session-id": sessionId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao buscar histórico");
      }

      const result: HistoryApiResponse = await response.json();

      // Transform API response to match our component expectations
      const totalPages = Math.ceil(result.pagination.total / pageSize);
      const transformedData: HistoryResponse = {
        searches: result.searches.map((s) => ({
          id: s.id,
          term: s.term,
          resultsCount: s.resultsCount,
          createdAt:
            s.createdAt instanceof Date
              ? s.createdAt.toISOString()
              : s.createdAt,
        })),
        pagination: {
          page,
          pageSize,
          totalPages,
          totalItems: result.pagination.total,
        },
      };

      setData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  const deleteSearch = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/history/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao excluir pesquisa");
        }

        // Refetch after deletion
        await fetchHistory();
      } catch (err) {
        throw err;
      }
    },
    [fetchHistory]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistory,
    deleteSearch,
  };
}
