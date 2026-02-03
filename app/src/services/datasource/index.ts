// Data Source Adapters - Licita Precos
// Barrel export for all data source adapters

export type {
  DataSourceAdapter,
  PriceItem,
  SearchOptions,
  // PNCP types
  PNCPOrgao,
  PNCPUnidadeGestora,
  PNCPFornecedor,
  PNCPContrato,
  PNCPContratacao,
  PNCPItemContratacao,
  PNCPAta,
  PNCPItemAta,
  PNCPPaginatedResponse,
  // ComprasGov types
  ComprasGovMaterial,
  ComprasGovContrato,
  ComprasGovHalResponse,
} from "./types";

export { PNCPAdapter, pncpAdapter } from "./pncpAdapter";
export { ComprasGovAdapter, comprasGovAdapter } from "./comprasGovAdapter";
export { DataSourceAggregator, dataSourceAggregator } from "./aggregator";
