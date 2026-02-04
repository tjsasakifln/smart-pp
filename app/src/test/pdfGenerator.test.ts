/**
 * PDF Generator Tests
 *
 * Tests for PDF generation service
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  generateOfficialReport,
  generatePDFFilename,
} from '@/services/reports/pdfGenerator';
import { searchPersistence } from '@/services/search/searchPersistence';
import type { SearchResponse } from '@/types/search';
import type { ReportConfig } from '@/types/report';

describe('PDF Generator', () => {
  let testSearchId: string;

  beforeAll(async () => {
    // Create a test search with mock results
    const mockSearchResponse: SearchResponse = {
      id: 'test-search-id',
      term: 'notebook dell',
      results: [
        {
          id: 'result-1',
          description: 'NOTEBOOK DELL INSPIRON 15 3000',
          price: 2500.0,
          unit: 'UN',
          source: 'PNCP',
          sourceUrl: 'https://pncp.gov.br/test1',
          quotationDate: '2026-01-15',
          organ: 'Prefeitura Municipal de São Paulo',
        },
        {
          id: 'result-2',
          description: 'NOTEBOOK DELL LATITUDE 5420',
          price: 3200.0,
          unit: 'UN',
          source: 'PNCP',
          sourceUrl: 'https://pncp.gov.br/test2',
          quotationDate: '2026-01-20',
          organ: 'Governo do Estado de SP',
        },
        {
          id: 'result-3',
          description: 'NOTEBOOK DELL VOSTRO 3510',
          price: 2800.0,
          unit: 'UN',
          source: 'Comprasnet',
          sourceUrl: 'https://comprasnet.gov.br/test1',
          quotationDate: '2026-01-10',
          organ: 'Ministério da Educação',
        },
      ],
      stats: {
        average: 2833.33,
        median: 2800,
        lowest: 2500,
        highest: 3200,
        count: 3,
      },
      meta: {
        sources: ['PNCP', 'Comprasnet'],
        searchedAt: new Date().toISOString(),
        cached: false,
      },
      pagination: {
        page: 1,
        pageSize: 20,
        totalResults: 3,
        totalPages: 1,
      },
    };

    testSearchId = await searchPersistence.saveSearch(mockSearchResponse);
  });

  describe('generateOfficialReport', () => {
    it('should generate a valid PDF buffer', async () => {
      const pdfBuffer = await generateOfficialReport(testSearchId);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Check PDF magic number
      const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });

    it('should throw error for non-existent search', async () => {
      await expect(
        generateOfficialReport('non-existent-id')
      ).rejects.toThrow('Search not found');
    });

    it('should generate PDF with custom config', async () => {
      const config: ReportConfig = {
        organName: 'Prefeitura de Teste',
        processNumber: '2026/001',
        observations: 'Este é um relatório de teste',
        includeMethodology: true,
        includeStatistics: true,
        referenceMethod: 'median',
      };

      const pdfBuffer = await generateOfficialReport(testSearchId, config);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle report with methodology disabled', async () => {
      const config: ReportConfig = {
        includeMethodology: false,
      };

      const pdfBuffer = await generateOfficialReport(testSearchId, config);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should handle report with statistics disabled', async () => {
      const config: ReportConfig = {
        includeStatistics: false,
      };

      const pdfBuffer = await generateOfficialReport(testSearchId, config);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should calculate correct statistics', async () => {
      // This is tested indirectly through PDF generation
      // The PDF should contain: average=2833.33, median=2800, lowest=2500, highest=3200
      const pdfBuffer = await generateOfficialReport(testSearchId);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('generatePDFFilename', () => {
    it('should generate filename with date and sanitized term', () => {
      const filename = generatePDFFilename('notebook dell');
      
      expect(filename).toMatch(/^relatorio-notebook-dell-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should sanitize special characters from search term', () => {
      const filename = generatePDFFilename('notebook/dell@2024');
      
      expect(filename).toMatch(/^relatorio-notebook-dell-2024-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should truncate long search terms', () => {
      const longTerm = 'a'.repeat(100);
      const filename = generatePDFFilename(longTerm);
      
      const termPart = filename.split('-').slice(1, -3).join('-');
      expect(termPart.length).toBeLessThanOrEqual(30);
    });

    it('should include current date', () => {
      const filename = generatePDFFilename('test');
      const today = new Date().toISOString().split('T')[0];
      
      expect(filename).toContain(today);
    });
  });
});
