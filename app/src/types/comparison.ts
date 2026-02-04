/**
 * Type definitions for Search Comparison feature (Story 3.5)
 * Shared between frontend and backend
 */

export interface ComparisonRequest {
  searchIds: string[]; // 2-3 search IDs
}

export interface SearchStatistics {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
}

export interface ComparisonSearch {
  id: string;
  term: string;
  date: string; // ISO date string
  statistics: SearchStatistics;
  resultsCount: number;
}

export interface Variations {
  average: Record<string, string>; // e.g. "id1_vs_id2": "+5.2%"
  median: Record<string, string>;
  min: Record<string, string>;
  max: Record<string, string>;
}

export interface SignificantChange {
  metric: "average" | "median" | "min" | "max";
  from: string; // search ID
  to: string; // search ID
  change: string; // e.g. "+10.5%"
  significant: boolean; // true if > 10%
}

export interface ComparisonResponse {
  searches: ComparisonSearch[];
  variations: Variations;
  significantChanges: SignificantChange[];
}

export interface ComparisonError {
  error: string;
  code?: "INVALID_INPUT" | "NOT_FOUND" | "SERVER_ERROR";
}
