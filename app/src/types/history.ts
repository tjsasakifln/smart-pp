// Types for search history - Licita Preços

export interface SearchHistoryItem {
  id: string;
  term: string;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    sources?: string[];
  };
  resultsCount: number;
  createdAt: string;
}

export interface HistoryFilters {
  term?: string;
  startDate?: string;
  endDate?: string;
}

export interface HistoryResponse {
  searches: SearchHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}
