# Licita Preços - Technical Architecture Document

**Versão:** 1.0
**Data:** 2026-02-03
**Autor:** Aria (Architect Agent)
**Status:** Approved
**PRD Reference:** docs/prd.md

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-03 | 1.0 | Documento inicial de arquitetura | Aria (Architect) |
| 2026-02-03 | 1.1 | Adicionada integracao PNCP API | Craft (Squad Creator) |

---

## 1. Executive Summary

Este documento define a arquitetura técnica do sistema **Licita Preços**, uma aplicação web para pesquisa de preços em fontes governamentais para uso em processos licitatórios.

### 1.1 Key Architectural Decisions

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| **Arquitetura** | Monolito Modular | Simplicidade para MVP, fácil evolução |
| **Frontend** | Next.js 14 (App Router) | SSR, caching nativo, DX excelente |
| **Backend** | Next.js API Routes | TypeScript end-to-end, sem servidor separado |
| **Database** | PostgreSQL | Robusto, queries complexas, suportado pelo Railway |
| **ORM** | Prisma | Type-safe, migrations, ótima DX |
| **Fonte de Dados** | API de Dados Abertos + PNCP | APIs REST públicas do governo |
| **Deploy** | Railway | PaaS simples, PostgreSQL incluso |

---

## 2. Data Source Investigation

### 2.1 Painel de Preços - Status

> **IMPORTANTE:** O Painel de Preços (paineldeprecos.planejamento.gov.br) foi **descontinuado em 04/07/2025** e não recebe mais atualizações.

**Alternativas Oficiais:**
- [Pesquisa de Preços](https://www.gov.br/compras/pt-br/sistemas/conheca-o-compras/pesquisa-de-precos) - Novo módulo integrado ao Compras.gov.br (requer login)
- [API de Dados Abertos](https://compras.dados.gov.br/docs/home.html) - API REST pública

### 2.2 API de Dados Abertos - Compras Governamentais

**Base URL:** `http://compras.dados.gov.br/{modulo}/v1/{metodo}.{formato}`

| Aspecto | Detalhes |
|---------|----------|
| **Autenticação** | Não requerida (dados públicos) |
| **Formatos** | JSON, XML, CSV, HTML |
| **Rate Limits** | Não documentado oficialmente (implementar throttling próprio) |
| **Paginação** | 500 resultados/página, parâmetro `offset` |
| **Licença** | ODBL (Open DataBase License) |

#### Módulos Disponíveis

| Módulo | Endpoint | Dados |
|--------|----------|-------|
| **Materiais (CATMAT)** | `/materiais/v1/materiais` | Catálogo de materiais |
| **Serviços (CATSER)** | `/servicos/v1/servicos` | Catálogo de serviços |
| **Licitações** | `/licitacoes/v1/licitacoes` | Processos licitatórios |
| **Contratos** | `/comprasContratos/v1/contratos` | Contratos firmados (2021+) |
| **Fornecedores** | `/fornecedores/v1/fornecedores` | Cadastro de fornecedores |

#### Exemplos de Requisição

```bash
# Buscar materiais do grupo 10 (Armamento)
curl "http://compras.dados.gov.br/materiais/v1/materiais.json?grupo=10"

# Buscar materiais por descrição
curl "http://compras.dados.gov.br/materiais/v1/materiais.json?descricao=papel%20A4"

# Buscar com paginação
curl "http://compras.dados.gov.br/materiais/v1/materiais.json?descricao=caneta&offset=500"
```

#### Resposta Típica (JSON)

```json
{
  "_links": {
    "self": { "href": "..." },
    "next": { "href": "..." }
  },
  "_embedded": {
    "materiais": [
      {
        "codigo": 150505,
        "descricao": "PAPEL A4 75G/M2",
        "unidade_fornecimento": "RESMA",
        "grupo": { "codigo": 15, "descricao": "MATERIAL DE EXPEDIENTE" }
      }
    ]
  }
}
```

### 2.3 API de Contratos (Nova)

**Base URL:** `https://dadosabertos.compras.gov.br/`

**Swagger:** https://dadosabertos.compras.gov.br/swagger-ui/index.html

| Endpoint | Descrição |
|----------|-----------|
| `GET /comprasContratos/v1/contratos` | Lista contratos com filtros |
| `GET /comprasContratos/doc/contrato/{id}` | Detalhes do contrato |
| `GET /comprasContratos/doc/contrato/{id}/itens_compras_contratos` | Itens do contrato |

### 2.4 PNCP - Portal Nacional de Contratações Públicas (NOVA FONTE)

> **IMPORTANTE:** O PNCP é a fonte mais completa e atualizada de preços praticados em contratações públicas no Brasil. Entrou em operação em janeiro de 2024 e centraliza dados de União, Estados e Municípios.

**Base URL:** `https://pncp.gov.br/api/consulta/v1`

**Swagger:** https://pncp.gov.br/api/consulta/swagger-ui/index.html

**Documentação:** [docs/pncp-api-analysis.md](./pncp-api-analysis.md)

| Aspecto | Detalhes |
|---------|----------|
| **Autenticação** | Não requerida (dados públicos) |
| **Formato** | JSON |
| **Rate Limits** | Não documentado (implementar 10 req/s) |
| **Paginação** | Parâmetro `pagina` (1-indexed) |

#### Endpoints Principais PNCP

| Endpoint | Descrição | Prioridade |
|----------|-----------|------------|
| `GET /api/consulta/v1/contratos` | Contratos publicados | CRÍTICA |
| `GET /api/consulta/v1/contratacoes/publicacao` | Contratações por data | CRÍTICA |
| `GET /api/consulta/v1/contratacoes/{cnpj}/{ano}/{seq}/itens` | Itens com preços unitários | ALTA |
| `GET /api/consulta/v1/atas` | Atas de Registro de Preço | ALTA |
| `GET /api/consulta/v1/pca` | Plano de Contratações Anual | MÉDIA |

#### Exemplos de Requisição PNCP

```bash
# Buscar contratos por período
curl "https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20240101&dataFinal=20240131&pagina=1"

# Buscar contratações (licitações)
curl "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=20240101&dataFinal=20240131&pagina=1"

# Buscar itens de uma contratação específica (COM PREÇOS UNITÁRIOS)
curl "https://pncp.gov.br/api/consulta/v1/contratacoes/00394460000141/2024/1/itens"

# Buscar atas de registro de preço
curl "https://pncp.gov.br/api/consulta/v1/atas?dataInicial=20240101&dataFinal=20240131&pagina=1"
```

#### Resposta Típica - Itens de Contratação (Melhor fonte de preços)

```json
{
  "data": [
    {
      "numeroItem": 1,
      "descricao": "Papel A4, 75g/m2, branco, pacote com 500 folhas",
      "quantidade": 5000,
      "unidadeMedida": "RESMA",
      "valorUnitarioEstimado": 25.50,
      "valorUnitarioHomologado": 22.00,
      "materialOuServico": "MATERIAL",
      "codigoCatmat": "150505",
      "situacaoItem": "Homologado",
      "fornecedorAdjudicado": {
        "cnpjCpf": "12345678000199",
        "nomeRazaoSocial": "Papelaria XYZ Ltda"
      }
    }
  ]
}
```

#### Prioridade de Fontes de Dados

Quando houver dados duplicados, usar a seguinte prioridade:

| # | Fonte | Justificativa |
|---|-------|---------------|
| 1 | PNCP Itens (valorUnitarioHomologado) | Preço real pago |
| 2 | PNCP Atas (vigente) | Preço negociado |
| 3 | PNCP Contratos | Valor global |
| 4 | Compras.gov.br Contratos | Dados 2021+ |
| 5 | CATMAT/CATSER | Referência sem preço |

### 2.5 Estratégia de Integração

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FONTES DE DADOS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ API Dados       │  │ API Contratos   │  │ PNCP (NOVA FONTE)       │  │
│  │ Abertos         │  │ (2021+)         │  │ Portal Nacional         │  │
│  │ compras.dados   │  │ dadosabertos    │  │ Contratações Públicas   │  │
│  │ .gov.br         │  │ .compras.gov.br │  │ pncp.gov.br/api         │  │
│  └────────┬────────┘  └────────┬────────┘  └───────────┬─────────────┘  │
│           │                    │                       │                │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌──────────▼────────────┐   │
│  │ComprasGovAdapter│  │ContratosAdapter │  │   PNCPAdapter (NEW)   │   │
│  │• CATMAT         │  │• Contratos 2021+│  │• /contratos           │   │
│  │• CATSER         │  │                 │  │• /contratacoes        │   │
│  │• Licitações     │  │                 │  │• /contratacoes/.../   │   │
│  │• Fornecedores   │  │                 │  │  itens                │   │
│  └────────┬────────┘  └────────┬────────┘  │• /atas                │   │
│           │                    │           └──────────┬────────────┘   │
│           │                    │                      │                │
│           └────────────────────┼──────────────────────┘                │
│                                ▼                                       │
│                    ┌───────────────────────┐                           │
│                    │ DataSourceAggregator  │                           │
│                    │ • Merge results       │                           │
│                    │ • Deduplicate by      │                           │
│                    │   CATMAT/CATSER code  │                           │
│                    │ • Priority ranking    │                           │
│                    └───────────┬───────────┘                           │
│                                ▼                                       │
│                    ┌───────────────────────┐                           │
│                    │    Cache Layer        │                           │
│                    │    (LRU In-Memory)    │                           │
│                    └───────────┬───────────┘                           │
│                                ▼                                       │
│                    ┌───────────────────────┐                           │
│                    │   Application API     │                           │
│                    │   /api/search         │                           │
│                    └───────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

**Fontes:**
- [Documentação API de Dados Abertos](https://compras.dados.gov.br/docs/home.html)
- [Swagger UI - Contratos](https://dadosabertos.compras.gov.br/swagger-ui/index.html)
- [Manual API Compras](https://www.gov.br/compras/pt-br/acesso-a-informacao/manuais/manual-dados-abertos/manual-api-compras.pdf)
- [PNCP Portal Principal](https://www.gov.br/pncp/pt-br)
- [PNCP API Swagger](https://pncp.gov.br/api/consulta/swagger-ui/index.html)
- [Manual API PNCP v1.0](https://www.gov.br/pncp/pt-br/central-de-conteudo/manuais/versoes-anteriores/ManualPNCPAPIConsultasVerso1.0.pdf)

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAILWAY                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    NEXT.JS APPLICATION                    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                 FRONTEND LAYER                      │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │  │
│  │  │  │  Pages   │ │Components│ │  Hooks   │            │  │  │
│  │  │  │ (RSC)    │ │(shadcn)  │ │          │            │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          │                                │  │
│  │                          ▼                                │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                  API LAYER                          │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │  │
│  │  │  │ /search  │ │ /export  │ │ /history │            │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          │                                │  │
│  │                          ▼                                │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                 SERVICE LAYER                       │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │  │
│  │  │  │ Search   │ │ Export   │ │ Stats    │            │  │  │
│  │  │  │ Service  │ │ Service  │ │ Service  │            │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘            │  │  │
│  │  │  ┌──────────┐ ┌──────────┐                         │  │  │
│  │  │  │DataSource│ │ Cache    │                         │  │  │
│  │  │  │ Adapter  │ │ Manager  │                         │  │  │
│  │  │  └──────────┘ └──────────┘                         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                          │                                │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                    POSTGRESQL                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │  │
│  │  │ searches │ │ results  │ │ reports  │                  │  │
│  │  └──────────┘ └──────────┘ └──────────┘                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │        EXTERNAL APIs (Gov)             │
         │  compras.dados.gov.br                  │
         │  dadosabertos.compras.gov.br           │
         └────────────────────────────────────────┘
```

### 3.2 Project Structure

```
licita-precos/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page (search)
│   │   ├── resultados/
│   │   │   └── page.tsx       # Results page
│   │   ├── historico/
│   │   │   └── page.tsx       # History page
│   │   ├── api/
│   │   │   ├── health/
│   │   │   │   └── route.ts   # Health check
│   │   │   ├── search/
│   │   │   │   └── route.ts   # Search endpoint
│   │   │   ├── export/
│   │   │   │   ├── excel/
│   │   │   │   │   └── route.ts
│   │   │   │   └── pdf/
│   │   │   │       └── route.ts
│   │   │   └── history/
│   │   │       └── route.ts   # History CRUD
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchForm.tsx
│   │   ├── results/
│   │   │   ├── ResultsTable.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── FiltersPanel.tsx
│   │   │   └── Pagination.tsx
│   │   ├── export/
│   │   │   ├── ExportButton.tsx
│   │   │   └── ReportConfigModal.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   │
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── utils.ts           # Utility functions
│   │   └── constants.ts       # App constants
│   │
│   ├── services/
│   │   ├── search/
│   │   │   ├── searchService.ts
│   │   │   └── searchService.test.ts
│   │   ├── datasource/
│   │   │   ├── types.ts            # Common types
│   │   │   ├── adapter.ts          # Base adapter interface
│   │   │   ├── comprasGovAdapter.ts # API implementation
│   │   │   └── comprasGovAdapter.test.ts
│   │   ├── export/
│   │   │   ├── excelService.ts
│   │   │   └── pdfService.ts
│   │   ├── stats/
│   │   │   └── statsService.ts
│   │   └── cache/
│   │       └── cacheManager.ts
│   │
│   ├── hooks/
│   │   ├── useSearch.ts
│   │   ├── useFilters.ts
│   │   └── useExport.ts
│   │
│   └── types/
│       ├── search.ts
│       ├── result.ts
│       └── api.ts
│
├── public/
│   └── ...
│
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 4. Database Schema (Prisma)

### 4.1 Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│       Search        │       │    SearchResult     │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │──────<│ id (PK)             │
│ term                │       │ searchId (FK)       │
│ createdAt           │       │ description         │
│ resultsCount        │       │ price               │
│ filters (JSON)      │       │ unit                │
│ sessionId           │       │ source              │
└─────────────────────┘       │ sourceUrl           │
                              │ quotationDate       │
                              │ organ               │
                              │ createdAt           │
                              └─────────────────────┘
                                       │
                                       │
                              ┌────────▼────────────┐
                              │      Report         │
                              ├─────────────────────┤
                              │ id (PK)             │
                              │ searchId (FK)       │
                              │ organName           │
                              │ processNumber       │
                              │ observations        │
                              │ referencePrice      │
                              │ referenceMethod     │
                              │ generatedAt         │
                              │ pdfUrl              │
                              └─────────────────────┘
```

### 4.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Search {
  id           String         @id @default(cuid())
  term         String
  filters      Json?          // { minPrice, maxPrice, startDate, endDate, sources }
  resultsCount Int            @default(0)
  sessionId    String?        // For anonymous user tracking
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  results      SearchResult[]
  reports      Report[]

  @@index([term])
  @@index([sessionId])
  @@index([createdAt(sort: Desc)])
}

model SearchResult {
  id            String   @id @default(cuid())
  searchId      String
  search        Search   @relation(fields: [searchId], references: [id], onDelete: Cascade)

  description   String
  price         Decimal  @db.Decimal(15, 2)
  unit          String   // Unidade de medida (UN, KG, M, etc.)
  source        String   // Nome da fonte (Painel de Preços, ComprasNet, etc.)
  sourceUrl     String   // Link verificável
  quotationDate DateTime // Data da cotação original
  organ         String?  // Órgão que realizou a compra

  createdAt     DateTime @default(now())

  @@index([searchId])
  @@index([price])
  @@index([quotationDate])
}

model Report {
  id              String   @id @default(cuid())
  searchId        String
  search          Search   @relation(fields: [searchId], references: [id], onDelete: Cascade)

  organName       String?  // Nome do órgão/entidade
  processNumber   String?  // Número do processo
  observations    String?  // Observações/justificativas
  referencePrice  Decimal? @db.Decimal(15, 2) // Preço de referência escolhido
  referenceMethod String?  // Método usado (média, mediana, menor, maior)
  includeMethodology Boolean @default(true)

  generatedAt     DateTime @default(now())
  pdfUrl          String?  // URL do PDF gerado (se armazenado)

  @@index([searchId])
}
```

### 4.3 Indexes Strategy

| Tabela | Campo(s) | Tipo | Justificativa |
|--------|----------|------|---------------|
| Search | `term` | B-tree | Busca por termo |
| Search | `sessionId` | B-tree | Histórico por sessão |
| Search | `createdAt DESC` | B-tree | Ordenação cronológica |
| SearchResult | `searchId` | B-tree | FK relationship |
| SearchResult | `price` | B-tree | Filtros por faixa de preço |
| SearchResult | `quotationDate` | B-tree | Filtros por data |

---

## 5. API Design

### 5.1 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/search` | Executar pesquisa de preços |
| GET | `/api/history` | Listar histórico de pesquisas |
| GET | `/api/history/[id]` | Detalhes de uma pesquisa |
| DELETE | `/api/history/[id]` | Excluir pesquisa do histórico |
| POST | `/api/export/excel` | Gerar Excel |
| POST | `/api/export/pdf` | Gerar PDF |

### 5.2 API Specifications

#### POST /api/search

**Request:**
```typescript
interface SearchRequest {
  term: string;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    startDate?: string; // ISO 8601
    endDate?: string;   // ISO 8601
    sources?: string[];
  };
  page?: number;
  pageSize?: number;
}
```

**Response:**
```typescript
interface SearchResponse {
  id: string;
  term: string;
  results: PriceResult[];
  stats: {
    count: number;
    average: number;
    median: number;
    min: number;
    max: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalResults: number;
  };
  meta: {
    sources: string[];
    searchedAt: string;
    cached: boolean;
  };
}

interface PriceResult {
  id: string;
  description: string;
  price: number;
  unit: string;
  source: string;
  sourceUrl: string;
  quotationDate: string;
  organ?: string;
}
```

#### POST /api/export/excel

**Request:**
```typescript
interface ExcelExportRequest {
  searchId: string;
  includeStats?: boolean;
  filteredOnly?: boolean;
}
```

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="pesquisa-precos-{term}-{date}.xlsx"`

---

## 6. Caching Strategy

### 6.1 Cache Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CACHE STRATEGY                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Next.js Data Cache (Built-in)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ • Route Handler caching (revalidate: 900)       │   │
│  │ • fetch() with cache: 'force-cache'             │   │
│  │ • TTL: 15 minutes for external API calls        │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  Layer 2: In-Memory Cache (LRU)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ • Search results by term (normalized)           │   │
│  │ • TTL: 10 minutes                               │   │
│  │ • Max entries: 1000                             │   │
│  │ • Library: lru-cache                            │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  Layer 3: Database (Persistent)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ • Search history (permanent)                    │   │
│  │ • Results snapshot (for report generation)      │   │
│  │ • FIFO: Keep last 100 searches per session      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Cache Implementation

```typescript
// src/services/cache/cacheManager.ts
import { LRUCache } from 'lru-cache';

interface CacheOptions {
  ttl: number; // milliseconds
  max: number; // max entries
}

const searchCache = new LRUCache<string, SearchResponse>({
  max: 1000,
  ttl: 1000 * 60 * 10, // 10 minutes
});

export const cacheManager = {
  getSearchResults(term: string): SearchResponse | undefined {
    const key = normalizeSearchTerm(term);
    return searchCache.get(key);
  },

  setSearchResults(term: string, results: SearchResponse): void {
    const key = normalizeSearchTerm(term);
    searchCache.set(key, results);
  },

  invalidate(term: string): void {
    const key = normalizeSearchTerm(term);
    searchCache.delete(key);
  },

  clear(): void {
    searchCache.clear();
  }
};

function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().trim().replace(/\s+/g, ' ');
}
```

### 6.3 External API Caching

```typescript
// src/services/datasource/comprasGovAdapter.ts
export async function fetchFromComprasGov(
  endpoint: string,
  params: Record<string, string>
): Promise<ApiResponse> {
  const url = buildUrl(endpoint, params);

  // Next.js Data Cache with 15-minute revalidation
  const response = await fetch(url, {
    next: { revalidate: 900 }, // 15 minutes
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ExternalApiError(`API returned ${response.status}`);
  }

  return response.json();
}
```

---

## 7. Data Source Adapter Pattern

### 7.1 Adapter Interface

```typescript
// src/services/datasource/types.ts
export interface PriceItem {
  description: string;
  price: number;
  unit: string;
  source: string;
  sourceUrl: string;
  quotationDate: Date;
  organ?: string;
  raw?: unknown; // Original data for debugging
}

export interface DataSourceAdapter {
  name: string;
  search(term: string, options?: SearchOptions): Promise<PriceItem[]>;
  isAvailable(): Promise<boolean>;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: {
    minDate?: Date;
    maxDate?: Date;
  };
}
```

### 7.2 Compras.gov.br Adapter

```typescript
// src/services/datasource/comprasGovAdapter.ts
import { DataSourceAdapter, PriceItem, SearchOptions } from './types';

const BASE_URL = 'http://compras.dados.gov.br';
const CONTRACTS_URL = 'https://dadosabertos.compras.gov.br';

export class ComprasGovAdapter implements DataSourceAdapter {
  name = 'Compras.gov.br';

  async search(term: string, options?: SearchOptions): Promise<PriceItem[]> {
    const results: PriceItem[] = [];

    // 1. Search in Materials (CATMAT)
    const materials = await this.searchMaterials(term, options);
    results.push(...materials);

    // 2. Search in Contracts (2021+)
    const contracts = await this.searchContracts(term, options);
    results.push(...contracts);

    return results;
  }

  private async searchMaterials(
    term: string,
    options?: SearchOptions
  ): Promise<PriceItem[]> {
    const params = new URLSearchParams({
      descricao: term,
      offset: String(options?.offset ?? 0),
    });

    const response = await fetch(
      `${BASE_URL}/materiais/v1/materiais.json?${params}`,
      { next: { revalidate: 900 } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return this.normalizeMaterials(data._embedded?.materiais ?? []);
  }

  private async searchContracts(
    term: string,
    options?: SearchOptions
  ): Promise<PriceItem[]> {
    // Query contracts API for items matching the term
    const response = await fetch(
      `${CONTRACTS_URL}/comprasContratos/v1/contratos?objeto_like=${encodeURIComponent(term)}`,
      { next: { revalidate: 900 } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return this.normalizeContracts(data._embedded?.contratos ?? []);
  }

  private normalizeMaterials(materials: any[]): PriceItem[] {
    return materials.map(m => ({
      description: m.descricao,
      price: 0, // Materials API doesn't have prices directly
      unit: m.unidade_fornecimento ?? 'UN',
      source: 'CATMAT - Compras.gov.br',
      sourceUrl: `${BASE_URL}/materiais/doc/material/${m.codigo}`,
      quotationDate: new Date(),
      raw: m,
    }));
  }

  private normalizeContracts(contracts: any[]): PriceItem[] {
    return contracts.map(c => ({
      description: c.objeto ?? c.descricao,
      price: parseFloat(c.valor_inicial ?? 0),
      unit: 'UN',
      source: 'Contratos - Compras.gov.br',
      sourceUrl: `${CONTRACTS_URL}/comprasContratos/doc/contrato/${c.id}`,
      quotationDate: new Date(c.data_assinatura ?? c.data_publicacao),
      organ: c.unidade_gestora?.nome,
      raw: c,
    }));
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/materiais/v1/materiais.json?offset=0`, {
        method: 'HEAD',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

## 8. Excel Export Service

### 8.1 ExcelJS Implementation

```typescript
// src/services/export/excelService.ts
import ExcelJS from 'exceljs';
import { SearchResult, SearchStats } from '@/types/search';

export async function generateExcel(
  term: string,
  results: SearchResult[],
  stats: SearchStats
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Licita Preços';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Pesquisa de Preços');

  // Header Section
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = 'PESQUISA DE PREÇOS';
  sheet.getCell('A1').font = { bold: true, size: 16 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.getCell('A3').value = 'Termo pesquisado:';
  sheet.getCell('B3').value = term;
  sheet.getCell('A4').value = 'Data da pesquisa:';
  sheet.getCell('B4').value = new Date().toLocaleDateString('pt-BR');

  // Statistics Section
  sheet.getCell('A6').value = 'ESTATÍSTICAS';
  sheet.getCell('A6').font = { bold: true };

  const statsData = [
    ['Quantidade de resultados', stats.count],
    ['Média', formatCurrency(stats.average)],
    ['Mediana', formatCurrency(stats.median)],
    ['Menor valor', formatCurrency(stats.min)],
    ['Maior valor', formatCurrency(stats.max)],
  ];

  statsData.forEach((row, index) => {
    sheet.getCell(`A${7 + index}`).value = row[0];
    sheet.getCell(`B${7 + index}`).value = row[1];
  });

  // Results Table
  const tableStartRow = 14;

  // Headers
  const headers = ['Descrição', 'Preço', 'Unidade', 'Fonte', 'Data', 'Link'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(tableStartRow, index + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
  });

  // Data rows
  results.forEach((result, rowIndex) => {
    const row = tableStartRow + 1 + rowIndex;
    sheet.getCell(row, 1).value = result.description;
    sheet.getCell(row, 2).value = result.price;
    sheet.getCell(row, 2).numFmt = 'R$ #,##0.00';
    sheet.getCell(row, 3).value = result.unit;
    sheet.getCell(row, 4).value = result.source;
    sheet.getCell(row, 5).value = new Date(result.quotationDate).toLocaleDateString('pt-BR');

    // Hyperlink
    const linkCell = sheet.getCell(row, 6);
    linkCell.value = { text: 'Abrir fonte', hyperlink: result.sourceUrl };
    linkCell.font = { color: { argb: 'FF0000FF' }, underline: true };
  });

  // Auto-fit columns
  sheet.columns.forEach(column => {
    column.width = 20;
  });

  // Generate buffer
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
```

---

## 9. PDF Report Service

### 9.1 PDF Generation with @react-pdf/renderer

```typescript
// src/services/export/pdfService.tsx
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { SearchResult, SearchStats, ReportConfig } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 4,
  },
  table: {
    display: 'flex',
    width: 'auto',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 4,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
  },
});

interface ReportProps {
  term: string;
  results: SearchResult[];
  stats: SearchStats;
  config: ReportConfig;
}

function PriceReport({ term, results, stats, config }: ReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PESQUISA DE PREÇOS</Text>
          {config.organName && <Text>{config.organName}</Text>}
          {config.processNumber && (
            <Text>Processo nº {config.processNumber}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text>Termo pesquisado: {term}</Text>
          <Text>Data da pesquisa: {new Date().toLocaleDateString('pt-BR')}</Text>
        </View>

        {config.includeMethodology && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>METODOLOGIA</Text>
            <Text style={{ fontSize: 10 }}>
              A pesquisa de preços foi realizada conforme Art. 23 da Lei 14.133/2021
              e IN 65/2021, utilizando como fonte o Sistema de Compras do Governo
              Federal (Compras.gov.br) e dados abertos do Portal de Compras.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESTATÍSTICAS</Text>
          <Text>Quantidade de resultados: {stats.count}</Text>
          <Text>Média: {formatCurrency(stats.average)}</Text>
          <Text>Mediana: {formatCurrency(stats.median)}</Text>
          <Text>Menor valor: {formatCurrency(stats.min)}</Text>
          <Text>Maior valor: {formatCurrency(stats.max)}</Text>
          {config.referencePrice && (
            <Text style={{ marginTop: 8, fontWeight: 'bold' }}>
              Preço de Referência ({config.referenceMethod}): {' '}
              {formatCurrency(config.referencePrice)}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESULTADOS</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Descrição</Text>
              <Text style={styles.tableCell}>Preço</Text>
              <Text style={styles.tableCell}>Fonte</Text>
              <Text style={styles.tableCell}>Data</Text>
            </View>
            {results.slice(0, 50).map((result, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCell}>{result.description}</Text>
                <Text style={styles.tableCell}>{formatCurrency(result.price)}</Text>
                <Text style={styles.tableCell}>{result.source}</Text>
                <Text style={styles.tableCell}>
                  {new Date(result.quotationDate).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {config.observations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
            <Text style={{ fontSize: 10 }}>{config.observations}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Gerado pelo sistema Licita Preços em{' '}
          {new Date().toLocaleString('pt-BR')}
        </Text>
      </Page>
    </Document>
  );
}

export async function generatePdf(props: ReportProps): Promise<Buffer> {
  return renderToBuffer(<PriceReport {...props} />);
}
```

---

## 10. Security Architecture

### 10.1 Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| **Transport** | HTTPS only | Railway provides SSL |
| **Input** | Validation | Zod schemas on API routes |
| **Rate Limiting** | Request throttling | Custom middleware |
| **Headers** | Security headers | next.config.js |
| **Data** | LGPD compliance | No PII stored; session-based |

### 10.2 Rate Limiting

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// For MVP: Simple in-memory rate limiting
// For production: Use Upstash Redis
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
  analytics: true,
});

export async function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 10.3 Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 11. Deployment Architecture

### 11.1 Railway Configuration

```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[environments.production]
NEXT_PUBLIC_APP_URL = "https://licita-precos.up.railway.app"

[environments.staging]
NEXT_PUBLIC_APP_URL = "https://licita-precos-staging.up.railway.app"
```

### 11.2 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@host:5432/licita_precos?schema=public"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# External APIs (for future use)
# COMPRAS_GOV_API_KEY=""

# Rate Limiting (optional - for Upstash)
# UPSTASH_REDIS_REST_URL=""
# UPSTASH_REDIS_REST_TOKEN=""

# Monitoring (optional)
# SENTRY_DSN=""
```

### 11.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test

  deploy-staging:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: licita-precos-staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: railwayapp/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: licita-precos
```

---

## 12. Architecture Decision Records (ADRs)

### ADR-001: Use API de Dados Abertos as Primary Data Source

**Status:** Accepted
**Date:** 2026-02-03

**Context:**
O Painel de Preços original foi descontinuado em julho de 2025. Precisamos de uma fonte de dados alternativa para obter preços de contratações públicas.

**Decision:**
Utilizar a API de Dados Abertos do Compras.gov.br como fonte primária de dados.

**Consequences:**
- (+) API pública, sem necessidade de autenticação
- (+) Dados oficiais do governo
- (+) Formatos JSON/XML/CSV disponíveis
- (-) Dados de compras limitados até 2020 (materiais)
- (-) Contratos disponíveis apenas a partir de 2021
- (-) Sem rate limits documentados (implementar próprio)

**Alternatives Considered:**
1. Scraping do novo módulo Pesquisa de Preços - Rejeitado (requer login, TOS)
2. Banco de Preços em Saúde - Muito específico para saúde

---

### ADR-002: In-Memory Cache over Redis for MVP

**Status:** Accepted
**Date:** 2026-02-03

**Context:**
Precisamos de cache para reduzir chamadas às APIs externas e melhorar performance.

**Decision:**
Usar cache in-memory (LRU) para o MVP, com opção de migrar para Redis posteriormente.

**Consequences:**
- (+) Sem dependência adicional de infraestrutura
- (+) Mais simples para MVP
- (+) Zero custo adicional
- (-) Cache não compartilhado entre instâncias (ok para MVP com 1 instância)
- (-) Cache perdido em restart

**Migration Path:**
Para produção com múltiplas instâncias, migrar para Upstash Redis (Railway add-on).

---

### ADR-003: Monolith with Next.js over Microservices

**Status:** Accepted
**Date:** 2026-02-03

**Context:**
Precisamos definir a arquitetura geral do sistema.

**Decision:**
Monolito modular usando Next.js 14 (App Router) com API Routes.

**Consequences:**
- (+) Simplicidade de desenvolvimento e deploy
- (+) TypeScript end-to-end
- (+) Caching nativo do Next.js
- (+) Railway suporta nativamente
- (-) Escalabilidade limitada (aceitável para MVP)

---

### ADR-004: ExcelJS for Spreadsheet Generation

**Status:** Accepted
**Date:** 2026-02-03

**Context:**
Precisamos gerar arquivos Excel (.xlsx) com formatação e hyperlinks.

**Decision:**
Usar ExcelJS para geração de planilhas no servidor.

**Alternatives Considered:**
1. SheetJS - Mais popular, mas licença comercial para alguns recursos
2. xlsx-populate - Menos manutenido
3. Client-side generation - Não suporta hyperlinks complexos

**Consequences:**
- (+) Suporte completo a hyperlinks
- (+) Formatação rica
- (+) Licença MIT
- (+) Ativo e bem mantido

---

### ADR-005: Session-based Tracking over User Authentication

**Status:** Accepted
**Date:** 2026-02-03

**Context:**
MVP não requer autenticação, mas precisamos rastrear histórico de pesquisas.

**Decision:**
Usar identificador de sessão anônimo (cookie) para rastrear histórico.

**Implementation:**
```typescript
// Generate session ID on first visit
const sessionId = cookies().get('session_id')?.value ?? crypto.randomUUID();
```

**Consequences:**
- (+) Sem fricção para usuário (no login required)
- (+) LGPD friendly (sem dados pessoais)
- (-) Histórico perdido se cookie limpo
- (-) Não sincroniza entre dispositivos

---

## 13. Testing Strategy

### 13.1 Test Pyramid

```
         /\
        /  \      E2E Tests (Playwright)
       /----\     10% - Fluxos críticos
      /      \
     /--------\   Integration Tests
    /          \  30% - API routes, components
   /------------\
  /              \ Unit Tests
 /----------------\ 60% - Services, utilities
```

### 13.2 Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

---

## 14. Monitoring & Observability

### 14.1 Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      externalApi: 'unknown',
    },
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = 'ok';
  } catch {
    checks.checks.database = 'error';
    checks.status = 'degraded';
  }

  // External API check
  try {
    const response = await fetch(
      'http://compras.dados.gov.br/materiais/v1/materiais.json?offset=0',
      { method: 'HEAD' }
    );
    checks.checks.externalApi = response.ok ? 'ok' : 'error';
  } catch {
    checks.checks.externalApi = 'error';
  }

  return Response.json(checks, {
    status: checks.status === 'ok' ? 200 : 503,
  });
}
```

### 14.2 Logging Structure

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  base: {
    service: 'licita-precos',
    environment: process.env.NODE_ENV,
  },
});

// Usage
logger.info({ term, resultsCount }, 'Search completed');
logger.error({ error, endpoint }, 'External API error');
```

---

## 15. Dependencies

### 15.1 Production Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.10.0",
    "exceljs": "^4.4.0",
    "@react-pdf/renderer": "^3.4.0",
    "lru-cache": "^10.2.0",
    "pino": "^8.19.0",
    "zod": "^3.22.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.344.0"
  }
}
```

### 15.2 Development Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "prisma": "^5.10.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "vitest": "^1.3.0",
    "@testing-library/react": "^14.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "pino-pretty": "^10.3.0"
  }
}
```

---

## 16. Next Steps

### 16.1 Implementation Priority

| Priority | Task | Story Reference |
|----------|------|-----------------|
| 1 | Project scaffolding (Next.js, Prisma, shadcn) | Story 1.1 |
| 2 | Database schema + Railway deploy | Story 1.1 |
| 3 | ComprasGov adapter + cache | Story 1.3 |
| 4 | Search API + UI | Story 1.2, 1.3 |
| 5 | Results table + formatting | Story 1.4 |
| 6 | Stats calculation | Story 2.1 |
| 7 | Filters + sorting | Story 2.2, 2.3 |
| 8 | Excel export | Story 2.4 |

### 16.2 Handoff to Development

```
@dev

A arquitetura está definida em docs/architecture.md.

Para iniciar o desenvolvimento:

1. Clone o repositório
2. Execute: npx create-next-app@latest licita-precos --typescript --tailwind --eslint --app --src-dir
3. Configure Prisma: npx prisma init
4. Copie o schema de prisma/schema.prisma
5. Configure Railway e DATABASE_URL
6. Execute: npx prisma db push
7. Inicie com Story 1.1

Stack confirmada:
- Next.js 14 (App Router)
- TypeScript
- Prisma + PostgreSQL
- shadcn/ui + Tailwind
- Railway deploy

API externa: compras.dados.gov.br (sem auth, JSON)
```

---

## Sources

- [Documentação API de Dados Abertos](https://compras.dados.gov.br/docs/home.html)
- [Swagger UI - Contratos](https://dadosabertos.compras.gov.br/swagger-ui/index.html)
- [Manual API Compras (PDF)](https://www.gov.br/compras/pt-br/acesso-a-informacao/manuais/manual-dados-abertos/manual-api-compras.pdf)
- [Compras Públicas em Dados Abertos](https://www.gov.br/compras/pt-br/cidadao/compras-publicas-dados-abertos)
- [Pesquisa de Preços - Nova Ferramenta](https://www.gov.br/compras/pt-br/sistemas/conheca-o-compras/pesquisa-de-precos)
