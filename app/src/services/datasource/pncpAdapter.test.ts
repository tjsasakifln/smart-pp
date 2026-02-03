/**
 * PNCPAdapter Integration Tests
 *
 * Tests the PNCP (Portal Nacional de Contratações Públicas) data source adapter
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PNCPAdapter } from './pncpAdapter';
import type {
  PNCPPaginatedResponse,
  PNCPContrato,
  PNCPAta,
  PNCPItemAta,
} from './types';

describe('PNCPAdapter', () => {
  let adapter: PNCPAdapter;

  beforeEach(() => {
    adapter = new PNCPAdapter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct name and baseUrl', () => {
      expect(adapter.name).toBe('PNCP - Portal Nacional de Contratacoes Publicas');
      expect(adapter.baseUrl).toBe('https://pncp.gov.br/api/consulta/v1');
    });
  });

  describe('search()', () => {
    it('should fetch contratos from PNCP API', async () => {
      const mockContratosResponse: PNCPPaginatedResponse<PNCPContrato> = {
        data: [
          {
            numeroContrato: '001/2024',
            anoContrato: 2024,
            objetoContrato: 'PAPEL A4 75G/M2 BRANCO',
            valorInicial: 10000,
            valorGlobal: 10000,
            dataAssinatura: '2024-01-15T00:00:00Z',
            dataVigenciaInicio: '2024-01-16T00:00:00Z',
            dataVigenciaFim: '2024-12-31T00:00:00Z',
            fornecedor: {
              cnpjCpf: '12345678000199',
              nomeRazaoSocial: 'Fornecedor Teste Ltda',
            },
            orgaoEntidade: {
              cnpj: '00394460000141',
              razaoSocial: 'Ministério da Gestão',
            },
            linkContrato: 'https://pncp.gov.br/app/contratos/12345',
          },
        ],
        paginacao: {
          paginaAtual: 1,
          totalPaginas: 1,
          totalRegistros: 1,
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockContratosResponse,
      } as Response);

      const results = await adapter.search('PAPEL A4');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toMatchObject({
        description: expect.stringContaining('PAPEL'),
        source: 'PNCP - Contrato',
        organ: 'Ministério da Gestão',
      });
    });

    it('should handle API errors gracefully', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('PNCP API down'));

      const results = await adapter.search('test');

      // Should return empty array instead of throwing
      expect(results).toEqual([]);
    });

    it('should normalize data correctly', async () => {
      const mockResponse: PNCPPaginatedResponse<PNCPContrato> = {
        data: [
          {
            numeroContrato: '123/2024',
            anoContrato: 2024,
            objetoContrato: 'TEST OBJECT',
            valorInicial: 5000,
            valorGlobal: 4800,
            dataAssinatura: '2024-02-01T10:30:00Z',
            dataVigenciaInicio: '2024-02-02T00:00:00Z',
            dataVigenciaFim: '2025-02-01T23:59:59Z',
            fornecedor: {
              cnpjCpf: '98765432000188',
              nomeRazaoSocial: 'Test Company',
            },
            orgaoEntidade: {
              cnpj: '00000000000191',
              razaoSocial: 'Test Ministry',
            },
            linkContrato: 'https://pncp.gov.br/app/contratos/test',
          },
        ],
        paginacao: {
          paginaAtual: 1,
          totalPaginas: 1,
          totalRegistros: 1,
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await adapter.search('TEST');

      expect(results[0]).toMatchObject({
        id: expect.stringContaining('pncp-contrato'),
        description: 'TEST OBJECT',
        price: 4800, // valorGlobal
        unit: 'GLOBAL',
        source: 'PNCP - Contrato',
        organ: 'Test Ministry',
        modalidade: 'Contrato',
        situacao: 'Vigente',
      });
    });

    it('should respect rate limiting (10 req/s)', async () => {
      const mockResponse: PNCPPaginatedResponse<PNCPContrato> = {
        data: [],
        paginacao: {
          paginaAtual: 1,
          totalPaginas: 1,
          totalRegistros: 0,
        },
      };

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const startTime = Date.now();

      // Make 5 searches rapidly
      await Promise.all([
        adapter.search('test1'),
        adapter.search('test2'),
        adapter.search('test3'),
        adapter.search('test4'),
        adapter.search('test5'),
      ]);

      const endTime = Date.now();

      // Should have rate limited (at least 100ms * 5 calls = 500ms)
      expect(endTime - startTime).toBeGreaterThanOrEqual(400);
      expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle pagination correctly', async () => {
      const page1Response: PNCPPaginatedResponse<PNCPContrato> = {
        data: [
          {
            numeroContrato: '001/2024',
            anoContrato: 2024,
            objetoContrato: 'CONTRACT PAGE 1',
            valorInicial: 1000,
            valorGlobal: 1000,
            dataAssinatura: '2024-01-15T00:00:00Z',
            dataVigenciaInicio: '2024-01-16T00:00:00Z',
            dataVigenciaFim: '2024-12-31T00:00:00Z',
            fornecedor: {
              cnpjCpf: '12345678000199',
              nomeRazaoSocial: 'Test Supplier',
            },
            orgaoEntidade: {
              cnpj: '00394460000141',
              razaoSocial: 'Test Organ',
            },
          },
        ],
        paginacao: {
          paginaAtual: 1,
          totalPaginas: 2,
          totalRegistros: 2,
        },
      };

      const page2Response: PNCPPaginatedResponse<PNCPContrato> = {
        data: [
          {
            numeroContrato: '002/2024',
            anoContrato: 2024,
            objetoContrato: 'CONTRACT PAGE 2',
            valorInicial: 2000,
            valorGlobal: 2000,
            dataAssinatura: '2024-01-20T00:00:00Z',
            dataVigenciaInicio: '2024-01-21T00:00:00Z',
            dataVigenciaFim: '2024-12-31T00:00:00Z',
            fornecedor: {
              cnpjCpf: '12345678000199',
              nomeRazaoSocial: 'Test Supplier',
            },
            orgaoEntidade: {
              cnpj: '00394460000141',
              razaoSocial: 'Test Organ',
            },
          },
        ],
        paginacao: {
          paginaAtual: 2,
          totalPaginas: 2,
          totalRegistros: 2,
        },
      };

      let callCount = 0;
      vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
        callCount++;
        const urlStr = url.toString();

        if (urlStr.includes('pagina=1')) {
          return {
            ok: true,
            json: async () => page1Response,
          } as Response;
        } else if (urlStr.includes('pagina=2')) {
          return {
            ok: true,
            json: async () => page2Response,
          } as Response;
        }

        return {
          ok: true,
          json: async () => ({
            data: [],
            paginacao: { paginaAtual: 3, totalPaginas: 2, totalRegistros: 2 },
          }),
        } as Response;
      });

      const results = await adapter.search('CONTRACT');

      // Should fetch multiple pages
      expect(callCount).toBeGreaterThanOrEqual(2);
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should fetch and normalize atas de registro de preco', async () => {
      const mockAtasResponse: PNCPPaginatedResponse<PNCPAta> = {
        data: [
          {
            numeroAta: 'ARP-001/2024',
            anoAta: 2024,
            dataAssinatura: '2024-01-10T00:00:00Z',
            dataVigenciaInicio: '2024-01-11T00:00:00Z',
            dataVigenciaFim: '2025-01-10T23:59:59Z',
            situacao: 'Vigente',
            orgaoEntidade: {
              cnpj: '00394460000141',
              razaoSocial: 'Ministério Teste',
            },
            fornecedor: {
              cnpjCpf: '12345678000199',
              nomeRazaoSocial: 'Fornecedor ARP',
            },
            itensAta: [
              {
                numeroItem: 1,
                descricao: 'PAPEL A4 SULFITE 75G RESMA 500FLS',
                quantidade: 1000,
                unidadeMedida: 'RESMA',
                valorUnitario: 22.5,
                saldoQuantidade: 800,
              },
            ],
          },
        ],
        paginacao: {
          paginaAtual: 1,
          totalPaginas: 1,
          totalRegistros: 1,
        },
      };

      // Mock both contratos and atas endpoints
      vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
        const urlStr = url.toString();

        if (urlStr.includes('/contratos?')) {
          return {
            ok: true,
            json: async () => ({
              data: [],
              paginacao: { paginaAtual: 1, totalPaginas: 1, totalRegistros: 0 },
            }),
          } as Response;
        } else if (urlStr.includes('/atas?')) {
          return {
            ok: true,
            json: async () => mockAtasResponse,
          } as Response;
        }

        return {
          ok: false,
          status: 404,
        } as Response;
      });

      const results = await adapter.search('PAPEL');

      const ataResults = results.filter((r) => r.source.includes('Ata'));
      expect(ataResults.length).toBeGreaterThan(0);
      expect(ataResults[0]).toMatchObject({
        description: expect.stringContaining('PAPEL'),
        price: 22.5,
        unit: 'RESMA',
        source: 'PNCP - Ata de Registro de Preco',
        modalidade: 'Registro de Precos',
      });
    });

    it('should apply price filters', async () => {
      const mockResponse: PNCPPaginatedResponse<PNCPContrato> = {
        data: [
          {
            numeroContrato: '001/2024',
            anoContrato: 2024,
            objetoContrato: 'LOW PRICE CONTRACT',
            valorInicial: 1000,
            valorGlobal: 1000,
            dataAssinatura: '2024-01-15T00:00:00Z',
            dataVigenciaInicio: '2024-01-16T00:00:00Z',
            dataVigenciaFim: '2024-12-31T00:00:00Z',
            fornecedor: {
              cnpjCpf: '12345678000199',
              nomeRazaoSocial: 'Test',
            },
            orgaoEntidade: {
              cnpj: '00394460000141',
              razaoSocial: 'Test Organ',
            },
          },
          {
            numeroContrato: '002/2024',
            anoContrato: 2024,
            objetoContrato: 'HIGH PRICE CONTRACT',
            valorInicial: 10000,
            valorGlobal: 10000,
            dataAssinatura: '2024-01-20T00:00:00Z',
            dataVigenciaInicio: '2024-01-21T00:00:00Z',
            dataVigenciaFim: '2024-12-31T00:00:00Z',
            fornecedor: {
              cnpjCpf: '12345678000199',
              nomeRazaoSocial: 'Test',
            },
            orgaoEntidade: {
              cnpj: '00394460000141',
              razaoSocial: 'Test Organ',
            },
          },
        ],
        paginacao: {
          paginaAtual: 1,
          totalPaginas: 1,
          totalRegistros: 2,
        },
      };

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const results = await adapter.search('CONTRACT', {
        filters: {
          minPrice: 5000,
        },
      });

      // Should only include contracts above minPrice
      expect(results.every((r) => r.price >= 5000)).toBe(true);
    });

    it('should handle date range constraints (max 365 days)', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [],
          paginacao: { paginaAtual: 1, totalPaginas: 1, totalRegistros: 0 },
        }),
      } as Response);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2025-01-01'); // > 365 days

      await adapter.search('test', {
        filters: {
          minDate: startDate,
          maxDate: endDate,
        },
      });

      // Check that API calls respect 365-day limit
      const url = fetchSpy.mock.calls[0][0].toString();
      expect(url).toContain('dataInicial=20230101');
      // End date should be adjusted to within 365 days of start
    });
  });

  describe('isAvailable()', () => {
    it('should return true when PNCP API is available', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);

      const available = await adapter.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when PNCP API is unavailable', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const available = await adapter.isAvailable();

      expect(available).toBe(false);
    });

    it('should return false on HTTP error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 503,
      } as Response);

      const available = await adapter.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed API responses', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({}), // Missing data field
      } as Response);

      const results = await adapter.search('test');

      expect(results).toEqual([]);
    });

    it('should handle timeout', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: [] }),
                } as Response),
              35000
            ); // Longer than 30s timeout
          })
      );

      const results = await adapter.search('test');

      expect(results).toEqual([]);
    }, 35000);

    it('should retry on HTTP 429', async () => {
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
            data: [],
            paginacao: { paginaAtual: 1, totalPaginas: 1, totalRegistros: 0 },
          }),
        } as Response;
      });

      await adapter.search('test');

      expect(callCount).toBeGreaterThan(1);
    });
  });
});
