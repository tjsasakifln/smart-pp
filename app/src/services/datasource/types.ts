// Data Source Adapter Types - Licita Precos

/**
 * Normalized price item from any data source
 */
export interface PriceItem {
  id: string;
  description: string;
  price: number;
  unit: string;
  source: string;
  sourceUrl: string;
  quotationDate: Date;
  organ?: string;
  codigoCatmat?: string;
  codigoCatser?: string;
  modalidade?: string;
  situacao?: string;
  valorEstimado?: number;
  raw?: unknown; // Original data for debugging
}

/**
 * Search options for data source queries
 */
export interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    minDate?: Date;
    maxDate?: Date;
    sources?: string[];
  };
}

/**
 * Data source adapter interface
 * All data source adapters must implement this interface
 */
export interface DataSourceAdapter {
  /** Unique name of the data source */
  name: string;

  /** Base URL of the API */
  baseUrl: string;

  /** Search for items by term */
  search(term: string, options?: SearchOptions): Promise<PriceItem[]>;

  /** Check if the data source is available */
  isAvailable(): Promise<boolean>;
}

// ============================================================================
// PNCP API Response Types
// ============================================================================

export interface PNCPOrgao {
  cnpj: string;
  razaoSocial: string;
  poderId?: string;
  esferaId?: string;
}

export interface PNCPUnidadeGestora {
  codigo: string;
  nome: string;
}

export interface PNCPFornecedor {
  cnpjCpf: string;
  nomeRazaoSocial: string;
}

export interface PNCPContrato {
  numeroContrato: string;
  anoContrato: number;
  objetoContrato: string;
  valorInicial: number;
  valorGlobal: number;
  dataAssinatura: string;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  fornecedor: PNCPFornecedor;
  orgaoEntidade: PNCPOrgao;
  unidadeGestora?: PNCPUnidadeGestora;
  linkContrato?: string;
}

export interface PNCPContratacao {
  numeroCompra: string;
  anoCompra: number;
  sequencialCompra: number;
  modalidadeId: number;
  modalidadeNome: string;
  objetoCompra: string;
  valorTotalEstimado: number;
  valorTotalHomologado?: number;
  situacaoCompraId?: number;
  situacaoCompraNome?: string;
  dataPublicacaoPncp?: string;
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  linkSistemaOrigem?: string;
  orgaoEntidade: PNCPOrgao;
}

export interface PNCPItemContratacao {
  numeroItem: number;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  valorUnitarioEstimado: number;
  valorUnitarioHomologado?: number;
  valorTotalEstimado: number;
  valorTotalHomologado?: number;
  materialOuServico: "MATERIAL" | "SERVICO";
  codigoCatmat?: string;
  codigoCatser?: string;
  situacaoItem: string;
  fornecedorAdjudicado?: PNCPFornecedor;
}

export interface PNCPAta {
  numeroAta: string;
  anoAta: number;
  dataAssinatura: string;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  situacao: string;
  orgaoEntidade: PNCPOrgao;
  fornecedor: PNCPFornecedor;
  itensAta?: PNCPItemAta[];
}

export interface PNCPItemAta {
  numeroItem: number;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  valorUnitario: number;
  saldoQuantidade?: number;
}

export interface PNCPPaginatedResponse<T> {
  data: T[];
  paginacao: {
    paginaAtual: number;
    totalPaginas: number;
    totalRegistros: number;
  };
}

// ============================================================================
// Compras.gov.br API Response Types
// ============================================================================

export interface ComprasGovMaterial {
  codigo: number;
  descricao: string;
  unidade_fornecimento: string;
  grupo: {
    codigo: number;
    descricao: string;
  };
}

export interface ComprasGovContrato {
  id: string;
  objeto: string;
  valor_inicial: number;
  data_assinatura: string;
  data_publicacao: string;
  unidade_gestora?: {
    codigo: string;
    nome: string;
  };
}

export interface ComprasGovHalResponse<T> {
  _links: {
    self: { href: string };
    next?: { href: string };
  };
  _embedded: {
    [key: string]: T[];
  };
}
