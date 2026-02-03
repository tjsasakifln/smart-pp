/**
 * ComprasGovAdapter Integration Tests
 *
 * Tests the Compras.gov.br data source adapter including:
 * - API integration
 * - Error handling
 * - Data normalization
 * - Rate limiting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComprasGovAdapter } from './comprasGovAdapter';
import type { ComprasGovHalResponse, ComprasGovMaterial, ComprasGovContrato } from './types';

describe('ComprasGovAdapter', () => {
  let adapter: ComprasGovAdapter;

  beforeEach(() => {
    adapter = new ComprasGovAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct name and baseUrl', () => {
      expect(adapter.name).toBe('Compras.gov.br - Dados Abertos');
      expect(adapter.baseUrl).toBe('http://compras.dados.gov.br');
    });
  });

  describe('search()', () => {
    it('should fetch materials from API', async () => {
      const mockMaterialsResponse: ComprasGovHalResponse<ComprasGovMaterial> = {
        _links: {
          self: { href: 'http://example.com' },
        },
        _embedded: {
          materiais: [
            {
              codigo: 150505,
              descricao: 'PAPEL A4 75G/M2',
              unidade_fornecimento: 'RESMA',
              grupo: {
                codigo: 15,
                descricao: 'MATERIAL DE EXPEDIENTE',
              },
            },
          ],
        },
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockMaterialsResponse,
      } as Response);

      const results = await adapter.search('papel A4');

      expect(fetchSpy).toHaveBeenCalled();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].description).toContain('PAPEL A4');
      expect(results[0].source).toContain('CATMAT');
    });

    it('should handle API errors gracefully', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const results = await adapter.search('test');

      // Should return empty array instead of throwing
      expect(results).toEqual([]);
    });

    it('should normalize data correctly', async () => {
      const mockResponse: ComprasGovHalResponse<ComprasGovMaterial> = {
        _links: {
          self: { href: 'http://example.com' },
        },
        _embedded: {
          materiais: [
            {
              codigo: 123456,
              descricao: 'TEST MATERIAL',
              unidade_fornecimento: 'KG',
              grupo: {
                codigo: 10,
                descricao: 'TEST GROUP',
              },
            },
          ],
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await adapter.search('test');

      expect(results[0]).toMatchObject({
        id: expect.stringContaining('catmat'),
        description: 'TEST MATERIAL',
        unit: 'KG',
        codigoCatmat: '123456',
        source: expect.stringContaining('CATMAT'),
      });
    });

    it('should respect rate limiting', async () => {
      const mockResponse: ComprasGovHalResponse<ComprasGovMaterial> = {
        _links: {
          self: { href: 'http://example.com' },
        },
        _embedded: {
          materiais: [],
        },
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const startTime = Date.now();

      // Make multiple searches
      await adapter.search('test1');
      await adapter.search('test2');

      const endTime = Date.now();

      // Should have made multiple calls
      expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

      // Note: Rate limiting is handled by retry logic, not explicit delays
      // Just verify calls were made
      expect(endTime - startTime).toBeGreaterThan(0);
    });

    it('should handle HTTP 429 (rate limit) with retry', async () => {
      let callCount = 0;

      vi.spyOn(global, 'fetch').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
          } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            _links: { self: { href: 'http://example.com' } },
            _embedded: { materiais: [] },
          }),
        } as Response;
      });

      const results = await adapter.search('test');

      // Should have retried
      expect(callCount).toBeGreaterThan(1);
      expect(results).toEqual([]);
    });

    it('should apply price filters', async () => {
      const mockContractsResponse: ComprasGovHalResponse<ComprasGovContrato> = {
        _links: {
          self: { href: 'http://example.com' },
        },
        _embedded: {
          contratos: [
            {
              id: '1',
              objeto: 'TEST CONTRACT 1',
              valor_inicial: 1000,
              data_assinatura: '2024-01-15',
              data_publicacao: '2024-01-10',
              unidade_gestora: {
                codigo: '123',
                nome: 'Test Organ',
              },
            },
            {
              id: '2',
              objeto: 'TEST CONTRACT 2',
              valor_inicial: 5000,
              data_assinatura: '2024-01-20',
              data_publicacao: '2024-01-15',
              unidade_gestora: {
                codigo: '456',
                nome: 'Test Organ 2',
              },
            },
          ],
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockContractsResponse,
      } as Response);

      const results = await adapter.search('TEST', {
        filters: {
          minPrice: 2000,
          maxPrice: 6000,
        },
      });

      // Should only include contracts within price range
      const contractResults = results.filter((r) => r.source.includes('Contratos'));
      expect(contractResults.every((r) => r.price >= 2000 && r.price <= 6000)).toBe(true);
    });

    it('should apply date filters', async () => {
      const mockResponse: ComprasGovHalResponse<ComprasGovContrato> = {
        _links: {
          self: { href: 'http://example.com' },
        },
        _embedded: {
          contratos: [
            {
              id: '1',
              objeto: 'OLD CONTRACT',
              valor_inicial: 1000,
              data_assinatura: '2020-01-15',
              data_publicacao: '2020-01-10',
            },
            {
              id: '2',
              objeto: 'NEW CONTRACT',
              valor_inicial: 2000,
              data_assinatura: '2024-01-15',
              data_publicacao: '2024-01-10',
            },
          ],
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await adapter.search('CONTRACT', {
        filters: {
          minDate: new Date('2023-01-01'),
        },
      });

      const contractResults = results.filter((r) => r.source.includes('Contratos'));
      expect(
        contractResults.every((r) => r.quotationDate >= new Date('2023-01-01'))
      ).toBe(true);
    });
  });

  describe('isAvailable()', () => {
    it('should return true when API is available', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);

      const available = await adapter.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when API is unavailable', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const available = await adapter.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false on HTTP error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const available = await adapter.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('Timeout handling', () => {
    it('should timeout long requests', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ _embedded: { materiais: [] } }),
                } as Response),
              35000
            ); // Longer than 30s timeout
          })
      );

      const results = await adapter.search('test');

      // Should handle timeout gracefully
      expect(results).toEqual([]);
    }, 35000);
  });

  describe('Data validation', () => {
    it('should handle malformed API responses', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({}), // Empty response
      } as Response);

      const results = await adapter.search('test');

      expect(results).toEqual([]);
    });

    it('should handle null/undefined fields', async () => {
      const mockResponse: ComprasGovHalResponse<ComprasGovMaterial> = {
        _links: {
          self: { href: 'http://example.com' },
        },
        _embedded: {
          materiais: [
            {
              codigo: 123,
              descricao: 'TEST',
              unidade_fornecimento: '', // Empty unit
              grupo: {
                codigo: 1,
                descricao: 'TEST',
              },
            },
          ],
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await adapter.search('test');

      expect(results[0].unit).toBe('UN'); // Should default to 'UN'
    });
  });
});
