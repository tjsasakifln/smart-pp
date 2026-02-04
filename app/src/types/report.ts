/**
 * Report Configuration Types
 */

export interface ReportConfig {
  // Organization details
  organName?: string;
  processNumber?: string;
  observations?: string;

  // Report options
  includeMethodology?: boolean;
  includeStatistics?: boolean;
  includeCharts?: boolean;
  
  // Reference price settings
  referenceMethod?: 'average' | 'median' | 'lowest' | 'highest';
  referencePrice?: number;

  // Visual customization
  title?: string;
  logo?: string;
}

export interface ReportData {
  searchId: string;
  searchTerm: string;
  createdAt: Date;
  resultsCount: number;
  results: ReportResult[];
  statistics: ReportStatistics;
  sources: string[];
  config?: ReportConfig;
}

export interface ReportResult {
  description: string;
  price: number;
  unit: string;
  source: string;
  sourceUrl: string;
  quotationDate: Date;
  organ: string | null;
}

export interface ReportStatistics {
  average: number;
  median: number;
  lowest: number;
  highest: number;
  count: number;
}
