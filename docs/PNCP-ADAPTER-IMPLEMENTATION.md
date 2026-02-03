# PNCPAdapter - Implementação Completa

**Data Engineer:** Dani
**Data:** 2026-02-03
**Status:** ✅ Concluído

## Visão Geral

Implementação completa do adapter para integração com a API PNCP (Portal Nacional de Contratações Públicas), conforme especificado no blueprint do projeto.

## Arquivos Implementados

### 1. `app/src/services/datasource/pncpAdapter.ts`

Adapter completo com integração aos principais endpoints da API PNCP:

#### Endpoints Integrados:

- **`/api/consulta/v1/contratos`**
  Busca contratos publicados com valores globais

- **`/api/consulta/v1/contratacoes/publicacao`**
  Busca contratações (licitações) por data de publicação
  Suporta filtros por modalidade (Pregão Eletrônico, Dispensa, etc.)

- **`/api/consulta/v1/contratacoes/{cnpj}/{ano}/{seq}/itens`**
  **CRÍTICO** - Endpoint prioritário com preços unitários detalhados
  Retorna `valorUnitarioEstimado` e `valorUnitarioHomologado`

- **`/api/consulta/v1/atas`**
  Busca atas de registro de preço com preços unitários vigentes

#### Funcionalidades Implementadas:

- ✅ Rate limiting (10 req/s - 100ms delay entre requests)
- ✅ Retry automático em erro 429 (rate limit) com exponential backoff
- ✅ Timeout de 30s por request
- ✅ Paginação: itera até 3 páginas por consulta ou 100 resultados
- ✅ Priorização de fontes: **Itens > Atas > Contratos**
- ✅ Tratamento de erros (404 é comum quando itens não estão disponíveis)
- ✅ Logs estruturados para debugging
- ✅ Date range padrão: últimos 12 meses

#### Priorização de Valores:

```typescript
// Sempre prioriza valor homologado sobre estimado
price: item.valorUnitarioHomologado || item.valorUnitarioEstimado
```

### 2. `app/src/services/datasource/types.ts`

Tipos TypeScript completos para a API PNCP:

```typescript
export interface PNCPContrato { ... }
export interface PNCPContratacao { ... }
export interface PNCPItemContratacao { ... }  // ⭐ Tipo crítico
export interface PNCPAta { ... }
export interface PNCPPaginatedResponse<T> { ... }
```

#### Campos Importantes:

- `codigoCatmat`: Código CATMAT para materiais
- `codigoCatser`: Código CATSER para serviços
- `valorUnitarioEstimado`: Preço unitário estimado
- `valorUnitarioHomologado`: Preço unitário homologado (prioridade)

### 3. `app/src/services/datasource/aggregator.ts`

Atualizado com prioridade correta:

```typescript
const SOURCE_PRIORITY = {
  "PNCP - Pregão Eletrônico": 1,      // Maior prioridade
  "PNCP - Dispensa": 2,
  "PNCP - Ata de Registro de Preco": 3,
  "PNCP - Contrato": 4,
  "Contratos - Compras.gov.br": 7,
  "CATMAT - Compras.gov.br": 10,      // Menor prioridade
};
```

#### Deduplicação:

- Por `codigoCatmat` quando disponível
- Por `codigoCatser` quando disponível
- Fallback: descrição normalizada

## Fluxo de Busca

```
1. Buscar contratações por modalidade (Pregão, Dispensa, etc.)
   ↓
2. Para cada contratação encontrada:
   - Buscar itens detalhados com preços unitários
   - Normalizar para PriceItem
   - Adicionar aos resultados
   ↓
3. Buscar atas de registro de preço
   ↓
4. Buscar contratos (valores globais)
   ↓
5. Aplicar filtros e retornar resultados
```

## Testes Realizados

### Teste 1: Busca por "serviços"

```
✓ 20 resultados encontrados
✓ Fontes: PNCP - Contrato
✓ Preços variando de R$ 136,00 a R$ 1.522.134,00
✓ Tempo de resposta: ~50s
```

### Teste 2: Busca agregada "material"

```
✓ 13 resultados após deduplicação
✓ Fontes: PNCP (prioridade)
✓ Tempo de resposta: ~39s
```

### Teste 3: Disponibilidade APIs

```
✓ PNCP API: ONLINE
✗ Compras.gov.br: OFFLINE (conhecido)
```

## Observações Importantes

### 404 em Itens de Contratação

É **normal** receber 404 ao buscar `/contratacoes/{cnpj}/{ano}/{seq}/itens`:

- Nem todas as contratações têm itens detalhados publicados
- API pode ter delay na publicação dos itens
- Alguns órgãos não publicam nível de detalhamento completo

**Solução:** O adapter trata 404 graciosamente e continua buscando em outras fontes.

### Performance

- Paginação limitada a 3 páginas por modalidade para evitar timeouts
- Rate limiting automático evita bloqueio por parte da API
- Cache recomendado: 15 minutos (implementar via Next.js)

### Date Range

- API PNCP requer range máximo de 365 dias
- Adapter ajusta automaticamente se range > 365 dias
- Padrão: últimos 12 meses

## Próximos Passos (QA)

- [ ] Testes unitários para cada método do adapter
- [ ] Testes de integração com mock da API
- [ ] Testes de edge cases:
  - API indisponível
  - Timeout
  - Rate limiting (429)
  - Dados inválidos
  - Date ranges extremos
- [ ] Validação de performance com load tests

## Exemplos de Uso

### Busca Simples

```typescript
import { pncpAdapter } from '@/services/datasource/pncpAdapter';

const results = await pncpAdapter.search('papel A4', {
  limit: 50,
  filters: {
    minPrice: 10,
    maxPrice: 1000,
  }
});
```

### Busca Agregada (Recomendado)

```typescript
import { dataSourceAggregator } from '@/services/datasource/aggregator';

// Busca em todas as fontes com deduplicação e priorização
const results = await dataSourceAggregator.search('notebook', {
  limit: 100,
});
```

### Check Availability

```typescript
const isAvailable = await pncpAdapter.isAvailable();
// true se API PNCP está respondendo
```

## Referências

- **API Swagger:** https://pncp.gov.br/api/consulta/swagger-ui/index.html
- **Portal PNCP:** https://www.gov.br/pncp/pt-br
- **Blueprint:** `squads/.designs/licita-precos-squad-blueprint.yaml`

## Conclusão

✅ **PNCPAdapter completo e funcional**
✅ **Integração com 4 endpoints principais**
✅ **Rate limiting e retry implementados**
✅ **Priorização de fontes configurada**
✅ **Deduplicação por CATMAT/CATSER**
✅ **Logs estruturados para debugging**

**Ready for QA testing!** 🚀
