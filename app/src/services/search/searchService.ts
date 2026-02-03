/**
 * Search Service
 *
 * Orchestrates search across data sources with caching,
 * statistics calculation, and fallback handling.
 */

import { dataSourceAggregator, type PriceItem } from "../datasource";
import { searchCache } from "../cache/cacheManager";
import type {
  SearchRequest,
  SearchResponse,
  SearchStats,
  PriceResult,
} from "@/types/search";

// Environment flag to use mock data
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

/**
 * Calculate statistics from price items
 */
function calculateStats(items: PriceItem[]): SearchStats {
  // Filter items with valid prices
  const pricesOnly = items.filter((item) => item.price > 0);

  if (pricesOnly.length === 0) {
    return {
      count: items.length,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
    };
  }

  const prices = pricesOnly.map((item) => item.price).sort((a, b) => a - b);
  const count = prices.length;
  const sum = prices.reduce((acc, p) => acc + p, 0);

  const median =
    count % 2 === 0
      ? (prices[count / 2 - 1] + prices[count / 2]) / 2
      : prices[Math.floor(count / 2)];

  return {
    count: items.length,
    average: Math.round((sum / count) * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: prices[0],
    max: prices[count - 1],
  };
}

/**
 * Convert PriceItem to PriceResult (API response format)
 */
function toPriceResult(item: PriceItem): PriceResult {
  return {
    id: item.id,
    description: item.description,
    price: item.price,
    unit: item.unit,
    source: item.source,
    sourceUrl: item.sourceUrl,
    quotationDate: item.quotationDate.toISOString(),
    organ: item.organ,
    codigoCatmat: item.codigoCatmat,
    codigoCatser: item.codigoCatser,
  };
}

/**
 * Mock data for development/fallback
 */
function getMockResults(term: string): PriceItem[] {
  const normalizedTerm = term.toLowerCase();

  const mockDatabase: PriceItem[] = [
    {
      id: "mock-1",
      description: "PAPEL A4, 75G/M2, BRANCO, PACOTE COM 500 FOLHAS",
      price: 22.5,
      unit: "RESMA",
      source: "PNCP - Pregao Eletronico",
      sourceUrl: "https://pncp.gov.br/app/contratos/12345",
      quotationDate: new Date("2024-01-15"),
      organ: "Ministerio da Gestao e Inovacao",
      codigoCatmat: "150505",
    },
    {
      id: "mock-2",
      description: "PAPEL SULFITE A4 75G BRANCO RESMA 500 FOLHAS",
      price: 24.0,
      unit: "RESMA",
      source: "PNCP - Ata de Registro de Preco",
      sourceUrl: "https://pncp.gov.br/app/atas/67890",
      quotationDate: new Date("2024-01-10"),
      organ: "Ministerio da Educacao",
      codigoCatmat: "150505",
    },
    {
      id: "mock-3",
      description: "PAPEL A4 SULFITE 75G/M2 BRANCO PCT 500FLS",
      price: 21.8,
      unit: "RESMA",
      source: "PNCP - Dispensa",
      sourceUrl: "https://pncp.gov.br/app/contratos/23456",
      quotationDate: new Date("2024-01-20"),
      organ: "Universidade Federal de Brasilia",
      codigoCatmat: "150505",
    },
    {
      id: "mock-4",
      description: "CANETA ESFEROGRAFICA AZUL PONTA MEDIA",
      price: 1.25,
      unit: "UNIDADE",
      source: "PNCP - Pregao Eletronico",
      sourceUrl: "https://pncp.gov.br/app/contratos/34567",
      quotationDate: new Date("2024-02-01"),
      organ: "Ministerio da Fazenda",
      codigoCatmat: "150590",
    },
    {
      id: "mock-5",
      description: "CANETA ESFEROGRAFICA AZUL CORPO TRANSPARENTE",
      price: 1.15,
      unit: "UNIDADE",
      source: "PNCP - Ata de Registro de Preco",
      sourceUrl: "https://pncp.gov.br/app/atas/78901",
      quotationDate: new Date("2024-01-25"),
      organ: "Ministerio da Saude",
      codigoCatmat: "150590",
    },
    {
      id: "mock-6",
      description: "COMPUTADOR DESKTOP CORE I5 8GB RAM 256GB SSD",
      price: 3500.0,
      unit: "UNIDADE",
      source: "PNCP - Pregao Eletronico",
      sourceUrl: "https://pncp.gov.br/app/contratos/45678",
      quotationDate: new Date("2024-01-18"),
      organ: "Ministerio da Ciencia e Tecnologia",
      codigoCatmat: "262020",
    },
    {
      id: "mock-7",
      description: "MICROCOMPUTADOR DESKTOP PROCESSADOR I5 10GER 8GB",
      price: 3200.0,
      unit: "UNIDADE",
      source: "PNCP - Ata de Registro de Preco",
      sourceUrl: "https://pncp.gov.br/app/atas/89012",
      quotationDate: new Date("2024-01-22"),
      organ: "Tribunal de Contas da Uniao",
      codigoCatmat: "262020",
    },
    {
      id: "mock-8",
      description: "NOTEBOOK 15.6 CORE I7 16GB RAM 512GB SSD",
      price: 5800.0,
      unit: "UNIDADE",
      source: "PNCP - Pregao Eletronico",
      sourceUrl: "https://pncp.gov.br/app/contratos/56789",
      quotationDate: new Date("2024-01-28"),
      organ: "Ministerio da Defesa",
      codigoCatmat: "262025",
    },
    {
      id: "mock-9",
      description: "SERVICO DE LIMPEZA E CONSERVACAO PREDIAL",
      price: 4500.0,
      unit: "M2/MES",
      source: "PNCP - Pregao Eletronico",
      sourceUrl: "https://pncp.gov.br/app/contratos/67890",
      quotationDate: new Date("2024-02-05"),
      organ: "Ministerio do Trabalho",
      codigoCatser: "75210",
    },
    {
      id: "mock-10",
      description: "SERVICOS DE LIMPEZA PREDIAL COM FORNECIMENTO DE MATERIAL",
      price: 4800.0,
      unit: "M2/MES",
      source: "PNCP - Ata de Registro de Preco",
      sourceUrl: "https://pncp.gov.br/app/atas/90123",
      quotationDate: new Date("2024-01-30"),
      organ: "Ministerio da Justica",
      codigoCatser: "75210",
    },
    {
      id: "mock-11",
      description: "AGUA MINERAL SEM GAS 500ML",
      price: 1.8,
      unit: "UNIDADE",
      source: "PNCP - Dispensa",
      sourceUrl: "https://pncp.gov.br/app/contratos/78901",
      quotationDate: new Date("2024-02-02"),
      organ: "Camara dos Deputados",
      codigoCatmat: "73010",
    },
    {
      id: "mock-12",
      description: "TONER IMPRESSORA HP CF258A PRETO ORIGINAL",
      price: 380.0,
      unit: "UNIDADE",
      source: "PNCP - Pregao Eletronico",
      sourceUrl: "https://pncp.gov.br/app/contratos/89012",
      quotationDate: new Date("2024-01-12"),
      organ: "Senado Federal",
      codigoCatmat: "254030",
    },
  ];

  return mockDatabase.filter(
    (item) =>
      item.description.toLowerCase().includes(normalizedTerm) ||
      (item.codigoCatmat && item.codigoCatmat.includes(term)) ||
      (item.codigoCatser && item.codigoCatser.includes(term))
  );
}

/**
 * Search Service
 */
export const searchService = {
  /**
   * Execute search with caching and fallback
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const { term, filters, page = 1, pageSize = 20 } = request;
    const startTime = Date.now();

    // Check cache first
    const cached = searchCache.get(term, filters);
    if (cached) {
      console.log(`[SearchService] Cache hit for: "${term}"`);
      // Apply pagination to cached results
      return this.paginateResponse(cached, page, pageSize);
    }

    console.log(`[SearchService] Cache miss for: "${term}", fetching...`);

    let items: PriceItem[] = [];
    let sources: string[] = [];
    let usedMock = false;

    // Try real APIs first (unless mock flag is set)
    if (!USE_MOCK_DATA) {
      try {
        console.log(`[SearchService] Querying real APIs for: "${term}"`);

        items = await dataSourceAggregator.search(term, {
          limit: 100,
          filters: filters
            ? {
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                minDate: filters.startDate
                  ? new Date(filters.startDate)
                  : undefined,
                maxDate: filters.endDate
                  ? new Date(filters.endDate)
                  : undefined,
              }
            : undefined,
        });

        sources = dataSourceAggregator.getSources();

        console.log(
          `[SearchService] Found ${items.length} results from real APIs`
        );
      } catch (error) {
        console.error("[SearchService] Real API error:", error);
        // Fall through to mock data
      }
    }

    // Fallback to mock data if no results or error
    if (items.length === 0) {
      console.log(`[SearchService] Using mock data for: "${term}"`);
      items = getMockResults(term);
      sources = ["Mock Data (APIs indisponiveis)"];
      usedMock = true;
    }

    // Calculate statistics
    const stats = calculateStats(items);

    // Build response
    const response: SearchResponse = {
      id: `search_${Date.now()}`,
      term,
      results: items.map(toPriceResult),
      stats,
      pagination: {
        page: 1,
        pageSize: items.length,
        totalPages: 1,
        totalResults: items.length,
      },
      meta: {
        sources,
        searchedAt: new Date().toISOString(),
        cached: false,
      },
    };

    // Cache the full results (without pagination)
    if (!usedMock && items.length > 0) {
      searchCache.set(term, response, filters);
    }

    const duration = Date.now() - startTime;
    console.log(`[SearchService] Search completed in ${duration}ms`);

    // Return paginated response
    return this.paginateResponse(response, page, pageSize);
  },

  /**
   * Apply pagination to response
   */
  paginateResponse(
    response: SearchResponse,
    page: number,
    pageSize: number
  ): SearchResponse {
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = response.results.slice(
      startIndex,
      startIndex + pageSize
    );

    return {
      ...response,
      results: paginatedResults,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(response.results.length / pageSize) || 1,
        totalResults: response.results.length,
      },
    };
  },

  /**
   * Check data source availability
   */
  async checkSources(): Promise<Record<string, boolean>> {
    return dataSourceAggregator.checkAvailability();
  },

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return searchCache.getStats();
  },

  /**
   * Clear cache
   */
  clearCache() {
    searchCache.clear();
  },
};
