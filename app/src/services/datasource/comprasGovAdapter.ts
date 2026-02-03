/**
 * Compras.gov.br Data Source Adapter
 *
 * Integrates with the Brazilian Government Open Data API:
 * - http://compras.dados.gov.br (Materials/Services catalog)
 * - https://dadosabertos.compras.gov.br (Contracts 2021+)
 *
 * @see https://compras.dados.gov.br/docs/home.html
 * @see https://dadosabertos.compras.gov.br/swagger-ui/index.html
 */

import type {
  DataSourceAdapter,
  PriceItem,
  SearchOptions,
  ComprasGovMaterial,
  ComprasGovContrato,
  ComprasGovHalResponse,
} from "./types";

const COMPRAS_BASE_URL = "http://compras.dados.gov.br";
const CONTRATOS_BASE_URL = "https://dadosabertos.compras.gov.br";
const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 2;

/**
 * Delay execution
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

export class ComprasGovAdapter implements DataSourceAdapter {
  name = "Compras.gov.br - Dados Abertos";
  baseUrl = COMPRAS_BASE_URL;

  /**
   * Search for prices in Compras.gov.br APIs
   */
  async search(term: string, options?: SearchOptions): Promise<PriceItem[]> {
    const results: PriceItem[] = [];

    try {
      // 1. Search in Materials catalog (CATMAT)
      const materials = await this.searchMaterials(term, options);
      results.push(...materials);

      // 2. Search in Contracts (2021+)
      const contracts = await this.searchContracts(term, options);
      results.push(...contracts);
    } catch (error) {
      console.error("[ComprasGovAdapter] Search error:", error);
    }

    return this.applyFilters(results, options?.filters);
  }

  /**
   * Search materials in CATMAT catalog
   * Note: This API returns catalog items, not prices directly
   */
  private async searchMaterials(
    term: string,
    options?: SearchOptions
  ): Promise<PriceItem[]> {
    try {
      const params = new URLSearchParams({
        descricao: term,
        offset: String(options?.offset ?? 0),
      });

      const url = `${COMPRAS_BASE_URL}/materiais/v1/materiais.json?${params}`;
      const response = await fetchWithRetry(url);
      const data: ComprasGovHalResponse<ComprasGovMaterial> =
        await response.json();

      const materials = data._embedded?.materiais ?? [];

      // Note: Materials API doesn't have prices, only catalog info
      // We include them for reference with price = 0
      return materials.map((material) => ({
        id: `catmat-${material.codigo}`,
        description: material.descricao,
        price: 0, // No price in catalog
        unit: material.unidade_fornecimento || "UN",
        source: "CATMAT - Compras.gov.br",
        sourceUrl: `${COMPRAS_BASE_URL}/materiais/doc/material/${material.codigo}`,
        quotationDate: new Date(),
        codigoCatmat: String(material.codigo),
        raw: material,
      }));
    } catch (error) {
      console.error("[ComprasGovAdapter] Error fetching materials:", error);
      return [];
    }
  }

  /**
   * Search contracts from 2021+
   */
  private async searchContracts(
    term: string,
    _options?: SearchOptions
  ): Promise<PriceItem[]> {
    try {
      // Note: The contracts API requires specific parameters
      // Using objeto_like for text search
      const params = new URLSearchParams({
        objeto_like: term,
      });

      const url = `${CONTRATOS_BASE_URL}/comprasContratos/v1/contratos?${params}`;
      const response = await fetchWithRetry(url);
      const data: ComprasGovHalResponse<ComprasGovContrato> =
        await response.json();

      const contracts = data._embedded?.contratos ?? [];

      return contracts.map((contract) => ({
        id: `contract-${contract.id}`,
        description: contract.objeto,
        price: contract.valor_inicial,
        unit: "GLOBAL",
        source: "Contratos - Compras.gov.br",
        sourceUrl: `${CONTRATOS_BASE_URL}/comprasContratos/doc/contrato/${contract.id}`,
        quotationDate: new Date(
          contract.data_assinatura || contract.data_publicacao
        ),
        organ: contract.unidade_gestora?.nome,
        raw: contract,
      }));
    } catch (error) {
      console.error("[ComprasGovAdapter] Error fetching contracts:", error);
      return [];
    }
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
      // Skip items with no price (catalog entries)
      if (item.price === 0) return true;

      if (filters.minPrice && item.price < filters.minPrice) return false;
      if (filters.maxPrice && item.price > filters.maxPrice) return false;
      if (filters.minDate && item.quotationDate < filters.minDate) return false;
      if (filters.maxDate && item.quotationDate > filters.maxDate) return false;
      return true;
    });
  }

  /**
   * Check if Compras.gov.br API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetchWithRetry(
        `${COMPRAS_BASE_URL}/materiais/v1/materiais.json?offset=0`,
        { method: "HEAD" }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const comprasGovAdapter = new ComprasGovAdapter();
