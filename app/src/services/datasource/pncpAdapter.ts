/**
 * PNCP (Portal Nacional de Contratacoes Publicas) Data Source Adapter
 *
 * Integrates with PNCP API to fetch price data from:
 * - /api/consulta/v1/contratos
 * - /api/consulta/v1/contratacoes
 * - /api/consulta/v1/contratacoes/{cnpj}/{ano}/{seq}/itens
 * - /api/consulta/v1/atas
 *
 * @see https://pncp.gov.br/api/consulta/swagger-ui/index.html
 */

import type {
  DataSourceAdapter,
  PriceItem,
  SearchOptions,
  PNCPContrato,
  PNCPContratacao,
  PNCPItemContratacao,
  PNCPAta,
  PNCPPaginatedResponse,
} from "./types";

const PNCP_BASE_URL = "https://pncp.gov.br/api/consulta/v1";
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RATE_LIMIT_DELAY = 100; // 100ms between requests (10 req/s)

// Common modalidade codes in PNCP
const MODALIDADES = {
  PREGAO_ELETRONICO: 6,
  DISPENSA_ELETRONICO: 8,
  CONCORRENCIA: 4,
  PREGAO_PRESENCIAL: 5,
};

/**
 * Format date as YYYYMMDD for PNCP API
 */
function formatDateForPNCP(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Parse ISO date string to Date
 */
function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Delay execution for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        // Rate limited - wait and retry
        await delay(1000);
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (retries > 0 && error instanceof Error && error.name !== "AbortError") {
      await delay(500);
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
}

export class PNCPAdapter implements DataSourceAdapter {
  name = "PNCP - Portal Nacional de Contratacoes Publicas";
  baseUrl = PNCP_BASE_URL;

  private lastRequestTime = 0;

  /**
   * Rate limit enforcement
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < RATE_LIMIT_DELAY) {
      await delay(RATE_LIMIT_DELAY - elapsed);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Search for prices across PNCP sources
   */
  async search(term: string, options?: SearchOptions): Promise<PriceItem[]> {
    const results: PriceItem[] = [];

    // Default date range: last 6 months (more focused results)
    const endDate = options?.filters?.maxDate || new Date();
    const startDate =
      options?.filters?.minDate ||
      new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    try {
      // 1. Search in contratos (actual contracts with values)
      const contratos = await this.searchContratos(
        term,
        startDate,
        endDate,
        options?.limit || 50
      );
      results.push(...contratos);

      // 2. Search in atas de registro de preco
      const atas = await this.searchAtas(term, startDate, endDate);
      const normalizedAtas = this.normalizeAtas(atas, term);
      results.push(...normalizedAtas);
    } catch (error) {
      console.error("[PNCPAdapter] Search error:", error);
      // Return partial results if any
    }

    // Apply filters if provided
    return this.applyFilters(results, options?.filters);
  }

  /**
   * Search contratos (actual contracts with values)
   */
  private async searchContratos(
    term: string,
    startDate: Date,
    endDate: Date,
    limit = 50
  ): Promise<PriceItem[]> {
    const results: PriceItem[] = [];
    const normalizedTerm = term.toLowerCase();

    // Ensure date range is <= 365 days
    const maxDate = new Date(startDate);
    maxDate.setDate(maxDate.getDate() + 365);
    const effectiveEndDate = endDate > maxDate ? maxDate : endDate;

    // Paginate to find matching contracts
    let page = 1;
    const maxPages = 5; // Limit API calls

    while (results.length < limit && page <= maxPages) {
      await this.enforceRateLimit();

      const params = new URLSearchParams({
        dataInicial: formatDateForPNCP(startDate),
        dataFinal: formatDateForPNCP(effectiveEndDate),
        pagina: String(page),
      });

      try {
        const url = `${this.baseUrl}/contratos?${params}`;
        console.log(`[PNCPAdapter] Fetching contratos page ${page}: ${url}`);

        const response = await fetchWithRetry(url);
        const data: PNCPPaginatedResponse<PNCPContrato> = await response.json();

        if (!data.data || data.data.length === 0) {
          break;
        }

        // Filter by term in objetoContrato
        const matching = data.data.filter((c) =>
          c.objetoContrato.toLowerCase().includes(normalizedTerm)
        );

        console.log(
          `[PNCPAdapter] Contratos page ${page}: ${data.data.length} total, ${matching.length} matching "${term}"`
        );

        // Normalize matching contracts to PriceItem
        for (const contract of matching) {
          results.push({
            id: `pncp-contrato-${contract.numeroContrato}-${contract.anoContrato}`,
            description: contract.objetoContrato,
            price: contract.valorGlobal || contract.valorInicial,
            unit: "GLOBAL",
            source: "PNCP - Contrato",
            sourceUrl: contract.linkContrato || this.baseUrl,
            quotationDate: parseDate(contract.dataAssinatura),
            organ: contract.orgaoEntidade.razaoSocial,
            modalidade: "Contrato",
            situacao: "Vigente",
            raw: contract,
          });
        }

        // Check if more pages available
        if (page >= (data.paginacao?.totalPaginas || 1)) {
          break;
        }

        page++;
      } catch (error) {
        console.error(
          `[PNCPAdapter] Error fetching contratos (page ${page}):`,
          error
        );
        break;
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Search contratacoes (licitacoes) by publication date
   * Note: PNCP API requires codigoModalidadeContratacao and max 365 day range
   */
  private async searchContratacoes(
    term: string,
    startDate: Date,
    endDate: Date,
    limit = 50
  ): Promise<PNCPContratacao[]> {
    const results: PNCPContratacao[] = [];
    const normalizedTerm = term.toLowerCase();

    // Ensure date range is <= 365 days
    const maxDate = new Date(startDate);
    maxDate.setDate(maxDate.getDate() + 365);
    const effectiveEndDate = endDate > maxDate ? maxDate : endDate;

    // Search across common modalidades
    const modalidadesToSearch = [
      MODALIDADES.PREGAO_ELETRONICO,
      MODALIDADES.DISPENSA_ELETRONICO,
    ];

    for (const modalidadeId of modalidadesToSearch) {
      if (results.length >= limit) break;

      await this.enforceRateLimit();

      const params = new URLSearchParams({
        dataInicial: formatDateForPNCP(startDate),
        dataFinal: formatDateForPNCP(effectiveEndDate),
        codigoModalidadeContratacao: String(modalidadeId),
        pagina: "1",
      });

      try {
        const url = `${this.baseUrl}/contratacoes/publicacao?${params}`;
        console.log(`[PNCPAdapter] Fetching contratacoes: ${url}`);

        const response = await fetchWithRetry(url);
        const data: PNCPPaginatedResponse<PNCPContratacao> =
          await response.json();

        // Filter by term in objetoCompra
        const matching = data.data.filter((c) =>
          c.objetoCompra.toLowerCase().includes(normalizedTerm)
        );

        console.log(
          `[PNCPAdapter] Modalidade ${modalidadeId}: ${data.data.length} total, ${matching.length} matching "${term}"`
        );

        results.push(...matching);
      } catch (error) {
        console.error(
          `[PNCPAdapter] Error fetching contratacoes (modalidade ${modalidadeId}):`,
          error
        );
      }
    }

    return results.slice(0, limit);
  }

  /**
   * Get items of a specific contratacao with detailed prices
   */
  private async getItensContratacao(
    cnpj: string,
    ano: number,
    sequencial: number
  ): Promise<PNCPItemContratacao[]> {
    await this.enforceRateLimit();

    try {
      const url = `${this.baseUrl}/contratacoes/${cnpj}/${ano}/${sequencial}/itens`;
      const response = await fetchWithRetry(url);
      const data = await response.json();

      return data.data || [];
    } catch (error) {
      console.error("[PNCPAdapter] Error fetching itens:", error);
      return [];
    }
  }

  /**
   * Search atas de registro de preco
   */
  private async searchAtas(
    term: string,
    startDate: Date,
    endDate: Date
  ): Promise<PNCPAta[]> {
    await this.enforceRateLimit();

    const params = new URLSearchParams({
      dataInicial: formatDateForPNCP(startDate),
      dataFinal: formatDateForPNCP(endDate),
      pagina: "1",
    });

    try {
      const url = `${this.baseUrl}/atas?${params}`;
      const response = await fetchWithRetry(url);
      const data: PNCPPaginatedResponse<PNCPAta> = await response.json();

      // Filter atas that have items matching the term
      const normalizedTerm = term.toLowerCase();
      return data.data.filter(
        (ata) =>
          ata.situacao === "Vigente" &&
          ata.itensAta?.some((item) =>
            item.descricao.toLowerCase().includes(normalizedTerm)
          )
      );
    } catch (error) {
      console.error("[PNCPAdapter] Error fetching atas:", error);
      return [];
    }
  }

  /**
   * Normalize itens de contratacao to PriceItem
   */
  private normalizeItens(
    itens: PNCPItemContratacao[],
    term: string,
    organ: string,
    modalidade: string
  ): PriceItem[] {
    const normalizedTerm = term.toLowerCase();

    return itens
      .filter((item) => item.descricao.toLowerCase().includes(normalizedTerm))
      .filter((item) => item.valorUnitarioHomologado || item.valorUnitarioEstimado)
      .map((item, index) => ({
        id: `pncp-item-${Date.now()}-${index}`,
        description: item.descricao,
        price: item.valorUnitarioHomologado || item.valorUnitarioEstimado,
        unit: item.unidadeMedida,
        source: `PNCP - ${modalidade}`,
        sourceUrl: this.baseUrl,
        quotationDate: new Date(),
        organ,
        codigoCatmat: item.materialOuServico === "MATERIAL" ? item.codigoCatmat : undefined,
        codigoCatser: item.materialOuServico === "SERVICO" ? item.codigoCatser : undefined,
        modalidade,
        situacao: item.situacaoItem,
        valorEstimado: item.valorUnitarioEstimado,
        raw: item,
      }));
  }

  /**
   * Normalize atas de registro de preco to PriceItem
   */
  private normalizeAtas(atas: PNCPAta[], term: string): PriceItem[] {
    const results: PriceItem[] = [];
    const normalizedTerm = term.toLowerCase();

    for (const ata of atas) {
      if (!ata.itensAta) continue;

      const matchingItens = ata.itensAta.filter((item) =>
        item.descricao.toLowerCase().includes(normalizedTerm)
      );

      for (const item of matchingItens) {
        results.push({
          id: `pncp-ata-${ata.numeroAta}-${item.numeroItem}`,
          description: item.descricao,
          price: item.valorUnitario,
          unit: item.unidadeMedida,
          source: "PNCP - Ata de Registro de Preco",
          sourceUrl: this.baseUrl,
          quotationDate: parseDate(ata.dataAssinatura),
          organ: ata.orgaoEntidade.razaoSocial,
          modalidade: "Registro de Precos",
          situacao: ata.situacao,
          raw: { ata, item },
        });
      }
    }

    return results;
  }

  /**
   * Apply price and date filters
   */
  private applyFilters(
    items: PriceItem[],
    filters?: SearchOptions["filters"]
  ): PriceItem[] {
    if (!filters) return items;

    return items.filter((item) => {
      if (filters.minPrice && item.price < filters.minPrice) return false;
      if (filters.maxPrice && item.price > filters.maxPrice) return false;
      if (filters.minDate && item.quotationDate < filters.minDate) return false;
      if (filters.maxDate && item.quotationDate > filters.maxDate) return false;
      return true;
    });
  }

  /**
   * Check if PNCP API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetchWithRetry(
        `${this.baseUrl}/contratos?dataInicial=20240101&dataFinal=20240102&pagina=1`,
        { method: "HEAD" }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const pncpAdapter = new PNCPAdapter();
