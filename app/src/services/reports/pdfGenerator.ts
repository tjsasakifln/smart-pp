/**
 * PDF Generation Service
 *
 * Generates official price research reports in PDF format.
 */

import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { searchPersistence } from '@/services/search/searchPersistence';
import { OfficialReportTemplate } from '@/components/reports/OfficialReportTemplate';
import type { ReportConfig, ReportData, ReportStatistics } from '@/types/report';
import type { Decimal } from '@prisma/client/runtime/library';

/**
 * Calculate statistics from search results
 */
function calculateStatistics(results: { price: Decimal }[]): ReportStatistics {
  if (results.length === 0) {
    return {
      average: 0,
      median: 0,
      lowest: 0,
      highest: 0,
      count: 0,
    };
  }

  const prices = results.map((r) => Number(r.price)).sort((a, b) => a - b);
  const sum = prices.reduce((acc, price) => acc + price, 0);
  const average = sum / prices.length;

  let median: number;
  const mid = Math.floor(prices.length / 2);
  if (prices.length % 2 === 0) {
    median = (prices[mid - 1] + prices[mid]) / 2;
  } else {
    median = prices[mid];
  }

  return {
    average,
    median,
    lowest: prices[0],
    highest: prices[prices.length - 1],
    count: prices.length,
  };
}

/**
 * Extract unique sources from results
 */
function extractSources(results: { source: string }[]): string[] {
  const uniqueSources = new Set(results.map((r) => r.source));
  return Array.from(uniqueSources);
}

/**
 * Generate an official PDF report for a search
 *
 * @param searchId - The ID of the search to generate a report for
 * @param config - Optional report configuration
 * @returns Buffer containing the generated PDF
 */
export async function generateOfficialReport(
  searchId: string,
  config?: ReportConfig
): Promise<Buffer> {
  try {
    // Fetch search data with results
    const search = await searchPersistence.getSearchById(searchId);

    if (!search) {
      throw new Error(`Search not found: ${searchId}`);
    }

    if (search.results.length === 0) {
      throw new Error('Search has no results to generate report');
    }

    // Calculate statistics
    const statistics = calculateStatistics(search.results);

    // Extract sources
    const sources = extractSources(search.results);

    // Prepare report data
    const reportData: ReportData = {
      searchId: search.id,
      searchTerm: search.term,
      createdAt: search.createdAt,
      resultsCount: search.resultsCount,
      results: search.results.map((result) => ({
        description: result.description,
        price: Number(result.price),
        unit: result.unit,
        source: result.source,
        sourceUrl: result.sourceUrl,
        quotationDate: result.quotationDate,
        organ: result.organ,
      })),
      statistics,
      sources,
      config,
    };

    // Render PDF template to buffer
    const pdfElement = React.createElement(OfficialReportTemplate, { data: reportData });
    const pdfBuffer = await renderToBuffer(pdfElement);

    console.log(
      `[PDFGenerator] Generated report for search ${searchId} (${search.results.length} results)`
    );

    return pdfBuffer;
  } catch (error) {
    console.error('[PDFGenerator] Error generating PDF:', error);
    throw new Error(`Failed to generate PDF report: ${error}`);
  }
}

/**
 * Generate filename for PDF download
 *
 * @param searchTerm - The search term
 * @returns Formatted filename
 */
export function generatePDFFilename(searchTerm: string): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitizedTerm = searchTerm
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-').replace(/^-+|-+$/g, '')
    .substring(0, 30);

  return `relatorio-${sanitizedTerm}-${date}.pdf`;
}
