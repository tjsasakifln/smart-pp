# 🏗️ Licita Preços Squad

**Status:** ✅ Active
**Version:** 1.0.0
**Domain:** Gov-Tech
**Language:** pt-BR

---

## 📋 Visão Geral

Squad completo para desenvolvimento do **Licita Preços** - sistema inteligente de pesquisa de preços para processos licitatórios públicos no Brasil.

### Objetivo do Sistema

Automatizar a pesquisa de preços de mercado para fundamentar valores de referência em contratações públicas, conforme exigido pela **Lei 14.133/2021** (Nova Lei de Licitações) e **IN 65/2021**.

---

## 👥 Time do Squad

| Agente | Nome | Papel | Ícone | Comando |
|--------|------|-------|-------|---------|
| **pm** | Morgan | Product Manager | 📊 | `@pm` |
| **po** | Owen | Product Owner | 🎯 | `@po` |
| **analyst** | Ana | Business Analyst | 🔍 | `@analyst` |
| **architect** | Aria | Software Architect | 🏗️ | `@architect` |
| **dev** | Dex | Full Stack Developer ⭐ | 💻 | `@dev` |
| **data-engineer** | Dani | Data Engineer | 🗄️ | `@data-engineer` |
| **qa** | Quinn | QA Engineer | 🔎 | `@qa` |
| **devops** | Gage | DevOps Engineer | 🚀 | `@devops` |
| **sm** | Sam | Scrum Master | 🏃 | `@sm` |
| **ux** | Uma | UX/UI Designer | 🎨 | `@ux` |

⭐ **Agente Principal** (primary owner)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** (componentes acessíveis)
- **Lucide React** (ícones)

### Backend
- **Next.js API Routes**
- **Prisma ORM**
- **PostgreSQL**
- **Zod** (validação)
- **Pino** (logging estruturado)

### Fontes de Dados (APIs Governamentais)

| Fonte | Base URL | Adapter | Status |
|-------|----------|---------|--------|
| **CATMAT/CATSER** | `compras.dados.gov.br` | `comprasGovAdapter.ts` | ✅ Documentado |
| **Contratos 2021+** | `dadosabertos.compras.gov.br` | `comprasGovAdapter.ts` | ✅ Documentado |
| **PNCP** | `pncp.gov.br/api/consulta/v1` | `pncpAdapter.ts` | 🆕 **NOVA FONTE** |

### PNCP API - Endpoints Prioritários

```
✅ /contratos                                    (contratos publicados)
✅ /contratacoes                                 (licitações)
✅ /contratacoes/{cnpj}/{ano}/{seq}/itens       (itens com preços unitários)
✅ /atas                                         (atas de registro de preço)
⚠️ /pca                                          (plano de contratações anual)
```

### Export & Utilities
- **ExcelJS** - Geração de planilhas `.xlsx`
- **@react-pdf/renderer** - Geração de relatórios PDF
- **lru-cache** - Cache em memória (10 min TTL)

### Deploy
- **Railway** (app + PostgreSQL)
- **GitHub Actions** (CI/CD)

---

## 📂 Estrutura do Projeto

```
licita-precos/
├── docs/
│   ├── prd.md                          # Product Requirements Document
│   ├── architecture.md                 # Arquitetura Técnica
│   ├── pncp-api-analysis.md           # Análise detalhada da API PNCP
│   └── stories/                        # User Stories
│       ├── story-1.1-setup.md
│       ├── story-1.2-search-flow-mock-data.md
│       ├── story-1.3-real-api-integration.md   ✅ COMPLETA
│       └── ...
│
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── api/
│   │   │   ├── search/route.ts        # POST /api/search
│   │   │   ├── export/
│   │   │   │   ├── excel/route.ts     # POST /api/export/excel
│   │   │   │   └── pdf/route.ts       # POST /api/export/pdf
│   │   │   └── health/route.ts        # GET /api/health
│   │   ├── resultados/page.tsx        # Página de resultados
│   │   └── historico/page.tsx         # Histórico de pesquisas
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── search/                    # SearchBar, SearchForm
│   │   ├── results/                   # ResultsTable, StatsCard, FiltersPanel
│   │   └── export/                    # ExportButton, ReportConfigModal
│   │
│   ├── services/
│   │   ├── datasource/
│   │   │   ├── types.ts               # DataSourceAdapter interface
│   │   │   ├── comprasGovAdapter.ts   # Compras.gov.br adapter
│   │   │   ├── pncpAdapter.ts         # 🆕 PNCP adapter (PENDENTE)
│   │   │   └── aggregator.ts          # Multi-source aggregator
│   │   ├── cache/
│   │   │   └── cacheManager.ts        # LRU cache (10 min TTL)
│   │   ├── search/
│   │   │   └── searchService.ts       # Orquestração de buscas
│   │   ├── stats/
│   │   │   └── statsService.ts        # Cálculo de estatísticas
│   │   └── export/
│   │       ├── excelService.ts        # Geração de Excel
│   │       └── pdfService.ts          # Geração de PDF
│   │
│   └── types/
│       ├── search.ts
│       ├── result.ts
│       └── pncp.ts                    # 🆕 Tipos PNCP (PENDENTE)
│
├── prisma/
│   ├── schema.prisma                  # Database schema
│   └── migrations/
│
└── squads/
    └── licita-precos-squad/           # Este squad
        ├── squad.yaml                 # Manifest
        ├── README.md                  # Este arquivo
        └── ...
```

---

## 🎯 Estado Atual do Projeto

### ✅ Completo (Sprint 1-2)

- [x] **Story 1.3**: Integração com APIs reais (Compras.gov.br)
  - ComprasGovAdapter implementado
  - Cache LRU funcionando (10 min TTL)
  - Rate limiting (10 req/s)
  - Tratamento de erros com fallback
  - Logs estruturados

### 🚧 Em Progresso

- [ ] **Story 1.1**: Setup completo do projeto
  - AC3: Deploy no Railway (pendente)
  - AC6: README com instruções

### 📋 Próximos Passos (Backlog)

#### Sprint 2: PNCP Integration (2 semanas)
- [ ] Analisar API PNCP em detalhes (`@analyst`)
- [ ] Implementar `PNCPAdapter` (`@data-engineer`)
  - `/contratos`
  - `/contratacoes`
  - `/contratacoes/{cnpj}/{ano}/{seq}/itens`
  - `/atas`
- [ ] Integrar no `DataSourceAggregator` (`@dev`)
- [ ] Testes de integração (`@qa`)

#### Sprint 3: Data Quality (1 semana)
- [ ] **Story 1.4**: Links verificáveis
  - URL validation service
  - Formatação de preços (R$ X.XXX,XX)
  - Formatação de datas (DD/MM/AAAA)
  - Atas de Registro de Preço (PNCP)

#### Sprint 4: Statistics & Filters (2 semanas)
- [ ] **Story 2.1**: Estatísticas (média, mediana, min, max)
- [ ] **Story 2.2**: Filtros (preço, data, fonte)
- [ ] **Story 2.3**: Ordenação de resultados

#### Sprint 5: Export (2 semanas)
- [ ] **Story 2.4**: Exportação Excel
- [ ] **Story 2.5**: Paginação

#### Sprint 6: History & Reports (2 semanas)
- [ ] **Story 3.1**: Histórico de pesquisas
- [ ] **Story 3.2**: Interface de histórico
- [ ] **Story 3.3**: Geração de relatório PDF
- [ ] **Story 3.4**: Personalização de relatórios

---

## 🚀 Como Usar o Squad

### 1. Ativar o Squad

```bash
# Carregar o squad no projeto
@aios-master load-squad licita-precos-squad
```

### 2. Chamar Agentes

Cada agente pode ser acionado com `@{agent-id}`:

```bash
# Desenvolvedor principal
@dev "Implementar PNCPAdapter conforme blueprint"

# Engenheiro de Dados
@data-engineer "Analisar duplicação de dados entre fontes"

# Arquiteto
@architect "Revisar arquitetura do agregador de fontes"

# Product Manager
@pm "Atualizar prioridades do backlog"

# QA
@qa "Criar testes para integração PNCP"
```

### 3. Executar Tarefas

```bash
# Iniciar desenvolvimento
npm run dev

# Rodar testes
npm test

# Build para produção
npm run build

# Push schema para DB
npx prisma db push

# Abrir Prisma Studio
npx prisma studio
```

---

## 📊 KPIs do Squad

### Desenvolvimento
- **Sprint velocity**: 20-25 story points/sprint
- **Code coverage**: ≥ 70%
- **API integration success rate**: ≥ 95%

### Produto
- **Tempo de resposta de busca**: < 30 segundos
- **Fontes de dados integradas**: 4 (CATMAT, CATSER, Contratos, PNCP)
- **Taxa de sucesso de exportação**: ≥ 95%

---

## ⚠️ Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **R1**: PNCP rate limiting não documentado | Média | Alto | Rate limiting próprio (10 req/s), cache agressivo |
| **R2**: Mudanças na API PNCP | Baixa | Alto | Adapter pattern, monitoramento, testes |
| **R3**: Dados duplicados | Alta | Média | Deduplicação por CATMAT/CATSER |
| **R4**: PNCP indisponível | Média | Média | Circuit breaker, graceful degradation |

---

## 🔗 Referências

### PNCP (Portal Nacional de Contratações Públicas)
- [Portal Principal](https://www.gov.br/pncp/pt-br)
- [API Swagger](https://pncp.gov.br/api/consulta/swagger-ui/index.html)
- [Manual API PNCP v1.0](https://www.gov.br/pncp/pt-br/central-de-conteudo/manuais/versoes-anteriores/ManualPNCPAPIConsultasVerso1.0.pdf)

### Compras.gov.br
- [API Dados Abertos](https://compras.dados.gov.br/docs/home.html)
- [Swagger Contratos](https://dadosabertos.compras.gov.br/swagger-ui/index.html)

### Legislação
- [Lei 14.133/2021](http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm) - Nova Lei de Licitações
- [IN 65/2021](https://www.gov.br/compras/pt-br/acesso-a-informacao/legislacao/instrucoes-normativas/instrucao-normativa-no-65-de-7-de-julho-de-2021) - Pesquisa de Preços

---

## 📝 Documentação

- **PRD**: [`docs/prd.md`](../../docs/prd.md)
- **Arquitetura**: [`docs/architecture.md`](../../docs/architecture.md)
- **Análise PNCP**: [`docs/pncp-api-analysis.md`](../../docs/pncp-api-analysis.md)
- **Blueprint**: [`squads/.designs/licita-precos-squad-blueprint.yaml`](../.designs/licita-precos-squad-blueprint.yaml)

---

## 🎉 Squad Pronto!

O **Licita Preços Squad** está completo e pronto para turbinar o desenvolvimento.

**Próxima ação recomendada:**

```bash
@dev "Continuar de onde paramos: implementar PNCPAdapter para integrar API PNCP"
```

ou

```bash
@data-engineer "Analisar endpoints da API PNCP e criar tipos TypeScript"
```

---

*Squad criado por **Craft (Squad Creator Agent)** em 2026-02-03*
*Blueprint: `licita-precos-squad-blueprint.yaml`*
