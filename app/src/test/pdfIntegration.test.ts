/**
 * PDF Integration Test
 * 
 * Simple integration test to verify PDF generation without database dependency
 */

import { describe, it, expect } from 'vitest';
import { generatePDFFilename } from '@/services/reports/pdfGenerator';

describe('PDF Integration Tests (No DB)', () => {
  describe('generatePDFFilename', () => {
    it('should generate valid filename', () => {
      const filename = generatePDFFilename('notebook dell');
      expect(filename).toMatch(/^relatorio-notebook-dell-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should sanitize special characters', () => {
      const filename = generatePDFFilename('test/path@2024!#$%');
      // Special characters are replaced with dashes, then collapsed
      expect(filename).toMatch(/^relatorio-test-path-2024-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should handle Portuguese characters', () => {
      const filename = generatePDFFilename('computador portátil');
      // Non-ASCII characters are replaced with dashes
      expect(filename).toMatch(/^relatorio-computador-port-til-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should truncate very long terms', () => {
      const longTerm = 'this is a very long search term that should be truncated to prevent filename issues';
      const filename = generatePDFFilename(longTerm);
      
      // Extract the term part (between 'relatorio-' and last '-YYYY-MM-DD.pdf')
      const parts = filename.split('-');
      // Remove 'relatorio' at start and date parts (YYYY, MM, DD.pdf) at end
      const termParts = parts.slice(1, -3);
      const termLength = termParts.join('-').length;
      
      expect(termLength).toBeLessThanOrEqual(30);
    });

    it('should include current date in filename', () => {
      const filename = generatePDFFilename('test');
      const today = new Date().toISOString().split('T')[0];
      expect(filename).toContain(today);
    });

    it('should remove leading and trailing dashes', () => {
      const filename = generatePDFFilename('!!!test###');
      // Should not start or end with dashes
      expect(filename).toMatch(/^relatorio-test-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should collapse multiple consecutive dashes', () => {
      const filename = generatePDFFilename('test   multiple   spaces');
      // Multiple dashes should be collapsed to single dash
      expect(filename).toMatch(/^relatorio-test-multiple-spaces-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });
});
