// Types for search functionality - Licita Precos

export interface PriceResult {
  id: string;
  description: string;
  price: number;
  unit: string;
  source: string;
  sourceUrl: string;
  quotationDate: string;
  organ?: string;
  codigoCatmat?: string;
  codigoCatser?: string;
}

export interface SearchStats {
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
}

export interface SearchRequest {
  term: string;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    startDate?: string;
    endDate?: string;
    sources?: string[];
  };
  page?: number;
  pageSize?: number;
}

export interface SearchResponse {
  id: string;
  term: string;
  results: PriceResult[];
  stats: SearchStats;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalResults: number;
  };
  meta: {
    sources: string[];
    searchedAt: string;
    cached: boolean;
  };
}

export interface SearchError {
  error: string;
  message: string;
  statusCode: number;
}
