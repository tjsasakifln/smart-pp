# PNCP API Analysis - Licita Precos Integration

**Data:** 2026-02-03
**Autor:** Ana (Business Analyst Agent)
**Status:** Draft - Awaiting Technical Review

---

## Executive Summary

O **PNCP (Portal Nacional de Contratacoes Publicas)** foi criado pela Lei 14.133/2021 (Nova Lei de Licitacoes) como portal centralizado para publicacao de todas as contratacoes publicas federais, estaduais e municipais.

**Entrou em operacao:** Janeiro de 2024

A integracao com a API do PNCP e **CRITICA** para o sistema Licita Precos, pois fornece:
- Valores praticados em contratos reais
- Precos unitarios de itens licitados
- Atas de registro de preco (precos vigentes)
- Cobertura nacional (federal, estadual, municipal)

---

## 1. API Overview

### Base URLs

| Ambiente | URL |
|----------|-----|
| **Producao** | `https://pncp.gov.br/api/consulta/v1` |
| **Swagger UI** | `https://pncp.gov.br/api/consulta/swagger-ui/index.html` |

### Autenticacao

| Tipo | Requisito |
|------|-----------|
| **API de Consulta** | Nenhum (acesso publico) |
| **API de Manutencao** | JWT Token (nao usaremos) |

### Formato de Resposta

- **Content-Type:** `application/json`
- **Encoding:** UTF-8
- **Paginacao:** Via parametro `pagina` (1-indexed)

---

## 2. Endpoints Criticos para Integracao

### 2.1 Contratos (`/contratos`)

**Prioridade:** CRITICA

**Endpoint:** `GET /api/consulta/v1/contratos`

**Descricao:** Retorna contratos publicados no PNCP com valores praticados.

**Parametros de Query:**

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `dataInicial` | string | Sim* | Data inicial (formato: YYYYMMDD) |
| `dataFinal` | string | Sim* | Data final (formato: YYYYMMDD) |
| `cnpjOrgao` | string | Nao | CNPJ do orgao (14 digitos) |
| `codigoUnidadeGestora` | string | Nao | Codigo da UG |
| `pagina` | integer | Nao | Numero da pagina (default: 1) |

*Pelo menos um parametro de filtro e obrigatorio.

**Exemplo de Requisicao:**
```bash
curl "https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20240101&dataFinal=20240131&pagina=1"
```

**Campos de Resposta Relevantes:**

```json
{
  "data": [
    {
      "numeroContrato": "001/2024",
      "anoContrato": 2024,
      "objetoContrato": "Aquisicao de papel A4",
      "valorInicial": 50000.00,
      "valorGlobal": 50000.00,
      "dataAssinatura": "2024-01-15",
      "dataVigenciaInicio": "2024-01-15",
      "dataVigenciaFim": "2025-01-14",
      "fornecedor": {
        "cnpjCpf": "12345678000199",
        "nomeRazaoSocial": "Papelaria XYZ Ltda"
      },
      "orgaoEntidade": {
        "cnpj": "00394460000141",
        "razaoSocial": "Ministerio da Gestao"
      },
      "unidadeGestora": {
        "codigo": "110001",
        "nome": "Secretaria de Gestao"
      },
      "linkContrato": "https://pncp.gov.br/app/contratos/..."
    }
  ],
  "paginacao": {
    "paginaAtual": 1,
    "totalPaginas": 15,
    "totalRegistros": 742
  }
}
```

**Mapeamento para PriceItem:**

| Campo PNCP | Campo PriceItem | Transformacao |
|------------|-----------------|---------------|
| `objetoContrato` | `description` | Direto |
| `valorGlobal` | `price` | Direto |
| `orgaoEntidade.razaoSocial` | `organ` | Direto |
| `linkContrato` | `sourceUrl` | Direto |
| `dataAssinatura` | `quotationDate` | Parse ISO date |
| - | `source` | "PNCP Contratos" |
| - | `unit` | Extrair do objeto ou "UN" |

---

### 2.2 Contratacoes (`/contratacoes`)

**Prioridade:** CRITICA

**Endpoint Publicacao:** `GET /api/consulta/v1/contratacoes/publicacao`

**Descricao:** Retorna licitacoes por data de publicacao.

**Parametros de Query:**

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `dataInicial` | string | Sim | Data inicial (YYYYMMDD) |
| `dataFinal` | string | Sim | Data final (YYYYMMDD) |
| `codigoModalidadeContratacao` | integer | Nao | Codigo da modalidade |
| `pagina` | integer | Nao | Numero da pagina |

**Codigos de Modalidade:**

| Codigo | Modalidade |
|--------|------------|
| 1 | Licitacao - Concorrencia |
| 2 | Licitacao - Concurso |
| 3 | Licitacao - Dialogo Competitivo |
| 4 | Licitacao - Leilao |
| 5 | Licitacao - Pregao |
| 6 | Contratacao Direta - Dispensa |
| 7 | Contratacao Direta - Dispensa (Emergencia) |
| 8 | Contratacao Direta - Inexigibilidade |
| 9 | Pre-qualificacao |
| 10 | Credenciamento |
| 11 | Manifestacao de Interesse |
| 12 | Registro de Precos |

**Exemplo de Requisicao:**
```bash
curl "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=20240101&dataFinal=20240131&codigoModalidadeContratacao=5&pagina=1"
```

**Campos de Resposta Relevantes:**

```json
{
  "data": [
    {
      "numeroCompra": "00001/2024",
      "anoCompra": 2024,
      "sequencialCompra": 1,
      "cnpjCompra": "00394460000141",
      "modalidadeId": 5,
      "modalidadeNome": "Pregao",
      "objetoCompra": "Aquisicao de material de expediente",
      "valorTotalEstimado": 150000.00,
      "valorTotalHomologado": 120000.00,
      "situacaoCompra": "Encerrada",
      "dataPublicacao": "2024-01-10",
      "dataEncerramentoProposta": "2024-01-25",
      "linkSistemaOrigem": "https://comprasnet.gov.br/...",
      "orgaoEntidade": {
        "cnpj": "00394460000141",
        "razaoSocial": "Ministerio da Gestao"
      }
    }
  ]
}
```

---

### 2.3 Itens de Contratacao (`/contratacoes/.../itens`)

**Prioridade:** ALTA

**Endpoint:** `GET /api/consulta/v1/contratacoes/{cnpj}/{ano}/{sequencial}/itens`

**Descricao:** Retorna itens detalhados de uma contratacao especifica COM PRECOS UNITARIOS.

**Path Parameters:**

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `cnpj` | string | CNPJ do orgao (14 digitos) |
| `ano` | integer | Ano da contratacao |
| `sequencial` | integer | Numero sequencial da contratacao |

**Exemplo de Requisicao:**
```bash
curl "https://pncp.gov.br/api/consulta/v1/contratacoes/00394460000141/2024/1/itens"
```

**Campos de Resposta Relevantes:**

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
      "valorTotalEstimado": 127500.00,
      "valorTotalHomologado": 110000.00,
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

**IMPORTANTE:** Este endpoint e a melhor fonte de precos unitarios reais!

**Mapeamento para PriceItem:**

| Campo PNCP | Campo PriceItem | Transformacao |
|------------|-----------------|---------------|
| `descricao` | `description` | Direto |
| `valorUnitarioHomologado` | `price` | Usar homologado (preco real) |
| `unidadeMedida` | `unit` | Direto |
| `codigoCatmat` | `codigoCatmat` | Direto (novo campo) |
| - | `source` | "PNCP Itens" |

---

### 2.4 Atas de Registro de Preco (`/atas`)

**Prioridade:** ALTA

**Endpoint:** `GET /api/consulta/v1/atas`

**Descricao:** Atas de Registro de Preco vigentes - excelente fonte de precos ja negociados.

**Parametros de Query:**

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `dataInicial` | string | Sim* | Data inicial (YYYYMMDD) |
| `dataFinal` | string | Sim* | Data final (YYYYMMDD) |
| `cnpjOrgao` | string | Nao | CNPJ do orgao |
| `pagina` | integer | Nao | Numero da pagina |

**Campos de Resposta Relevantes:**

```json
{
  "data": [
    {
      "numeroAta": "001/2024",
      "anoAta": 2024,
      "dataAssinatura": "2024-01-20",
      "dataVigenciaInicio": "2024-01-20",
      "dataVigenciaFim": "2025-01-19",
      "situacao": "Vigente",
      "orgaoEntidade": {
        "cnpj": "00394460000141",
        "razaoSocial": "Ministerio da Gestao"
      },
      "fornecedor": {
        "cnpjCpf": "12345678000199",
        "nomeRazaoSocial": "Papelaria XYZ Ltda"
      },
      "itensAta": [
        {
          "numeroItem": 1,
          "descricao": "Papel A4 75g",
          "quantidade": 10000,
          "unidadeMedida": "RESMA",
          "valorUnitario": 22.00,
          "saldoQuantidade": 8500
        }
      ]
    }
  ]
}
```

**Vantagens das Atas:**
- Precos ja negociados e vigentes
- Disponivel para adesao (carona)
- Referencia de mercado confiavel

---

### 2.5 Plano de Contratacoes Anual (`/pca`)

**Prioridade:** MEDIA

**Endpoint:** `GET /api/consulta/v1/pca`

**Descricao:** Plano de contratacoes anuais dos orgaos.

**Parametros de Query:**

| Parametro | Tipo | Descricao |
|-----------|------|-----------|
| `anoPca` | integer | Ano do PCA |
| `codigoClassificacaoSuperior` | integer | Codigo de classificacao |
| `pagina` | integer | Numero da pagina |

**Uso:** Util para entender demandas futuras e justificar precos de referencia.

---

## 3. Estrategia de Integracao Recomendada

### 3.1 Arquitetura do Adapter

```typescript
// src/services/datasource/pncpAdapter.ts

interface PNCPAdapterConfig {
  baseUrl: string;
  defaultTimeout: number;
  maxRetries: number;
  rateLimitPerSecond: number;
}

class PNCPAdapter implements DataSourceAdapter {
  name = 'PNCP - Portal Nacional de Contratacoes Publicas';

  async search(term: string, options?: SearchOptions): Promise<PriceItem[]> {
    const results: PriceItem[] = [];

    // 1. Buscar contratacoes por termo
    const contratacoes = await this.searchContratacoes(term, options);

    // 2. Para cada contratacao, buscar itens detalhados
    for (const contratacao of contratacoes) {
      const itens = await this.getItensContratacao(
        contratacao.cnpj,
        contratacao.ano,
        contratacao.sequencial
      );
      results.push(...this.normalizeItens(itens, contratacao));
    }

    // 3. Buscar em atas de registro de preco
    const atas = await this.searchAtas(term, options);
    results.push(...this.normalizeAtas(atas));

    return results;
  }
}
```

### 3.2 Fluxo de Busca

```
Usuario digita: "papel A4"
           |
           v
+---------------------+
| DataSourceAggregator|
+---------------------+
           |
     +-----+-----+-----+
     |           |     |
     v           v     v
+--------+  +------+  +----+
|ComprasGov| |PNCP |  |Atas|
+--------+  +------+  +----+
     |           |     |
     v           v     v
+---------------------+
|   Normalize & Merge  |
|   Deduplicate by     |
|   CATMAT/CATSER code |
+---------------------+
           |
           v
+---------------------+
|    Cache (LRU)      |
+---------------------+
           |
           v
+---------------------+
|   Return Results    |
+---------------------+
```

### 3.3 Prioridade de Fontes

Quando houver dados duplicados (mesmo item em multiplas fontes):

| Prioridade | Fonte | Justificativa |
|------------|-------|---------------|
| 1 | PNCP Itens (homologado) | Preco real pago |
| 2 | PNCP Atas (vigente) | Preco negociado |
| 3 | PNCP Contratos | Valor global |
| 4 | Compras.gov.br Contratos | Dados 2021+ |
| 5 | CATMAT/CATSER | Sem preco, so referencia |

### 3.4 Rate Limiting

**Recomendacao:** 10 requests/segundo

```typescript
const rateLimiter = {
  maxRequests: 10,
  windowMs: 1000,
  queue: [],
};
```

### 3.5 Cache Strategy

| Dados | TTL | Justificativa |
|-------|-----|---------------|
| Resultados de busca | 10 min | Dados mudam pouco |
| Itens de contratacao | 30 min | Detalhes estaticos |
| Atas vigentes | 1 hora | Vigencia longa |

---

## 4. Tratamento de Erros

### 4.1 Erros Esperados

| HTTP Status | Acao |
|-------------|------|
| 400 | Validar parametros |
| 404 | Retornar array vazio |
| 429 | Aguardar e retry |
| 500 | Fallback para cache |
| 503 | Circuit breaker |

### 4.2 Circuit Breaker

```typescript
const circuitBreaker = {
  failures: 0,
  threshold: 5,
  timeout: 60000, // 1 minuto
  state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
};
```

---

## 5. Campos Adicionais para Banco de Dados

### Prisma Schema Update

```prisma
model SearchResult {
  // ... campos existentes ...

  // Novos campos para PNCP
  codigoCatmat    String?  // Codigo CATMAT quando disponivel
  codigoCatser    String?  // Codigo CATSER quando disponivel
  pncpId          String?  // ID unico do PNCP
  modalidade      String?  // Modalidade de contratacao
  situacao        String?  // Situacao (Homologado, Vigente, etc.)
  valorEstimado   Decimal? @db.Decimal(15, 2) // Para comparacao

  @@index([codigoCatmat])
  @@index([codigoCatser])
}
```

---

## 6. Testes de Integracao

### 6.1 Casos de Teste

```typescript
describe('PNCPAdapter', () => {
  it('should fetch contratos by date range', async () => {
    const results = await adapter.searchContratos({
      dataInicial: '20240101',
      dataFinal: '20240131'
    });
    expect(results).toBeInstanceOf(Array);
  });

  it('should fetch itens de contratacao', async () => {
    const itens = await adapter.getItensContratacao(
      '00394460000141', // CNPJ MGI
      2024,
      1
    );
    expect(itens[0]).toHaveProperty('valorUnitarioHomologado');
  });

  it('should handle PNCP unavailable gracefully', async () => {
    // Mock 503 response
    const results = await adapter.search('papel');
    expect(results).toEqual([]); // Fallback to empty
  });
});
```

---

## 7. Proximos Passos

1. **[Analyst]** Validar endpoints com chamadas reais
2. **[Architect]** Revisar design do PNCPAdapter
3. **[Data Engineer]** Implementar adapter
4. **[QA]** Criar suite de testes de integracao
5. **[Dev]** Integrar no SearchService

---

## Referencias

- [PNCP Portal Principal](https://www.gov.br/pncp/pt-br)
- [PNCP API Swagger](https://pncp.gov.br/api/consulta/swagger-ui/index.html)
- [Manual API PNCP v1.0](https://www.gov.br/pncp/pt-br/central-de-conteudo/manuais/versoes-anteriores/ManualPNCPAPIConsultasVerso1.0.pdf)
- [Dados Abertos PNCP](https://www.gov.br/pncp/pt-br/acesso-a-informacao/dados-abertos)
- [Transparencia.org - Recomendacoes PNCP](https://www.transparencia.org.br/downloads/publicacoes/portalnacionaldecontratacoespublicas_recomendacoesedesafiostecnicos.pdf)

---

*Documento gerado pelo Synkra AIOS - Business Analyst Agent (Ana)*
