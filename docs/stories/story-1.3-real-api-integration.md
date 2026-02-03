# Story 1.3: Integracao com Fonte de Precos Real

**Status:** Complete
**Sprint:** 2
**Assigned:** Dex (Dev), Dani (Data Engineer)
**Started:** 2026-02-03

---

## User Story

> Como **usuario**,
> Eu quero **ver precos reais de fontes governamentais**,
> Para que **eu possa usar os dados em processos licitatorios**.

---

## Acceptance Criteria

| # | Criterio | Status |
|---|----------|--------|
| AC1 | Integracao funcional com PNCP API | [x] |
| AC1.1 | Endpoint /api/consulta/v1/contratos | [x] |
| AC1.2 | Endpoint /api/consulta/v1/contratacoes | [x] |
| AC1.3 | Endpoint /api/consulta/v1/contratacoes/{cnpj}/{ano}/{seq}/itens | [x] |
| AC1.4 | Endpoint /api/consulta/v1/atas | [x] |
| AC2 | Integracao funcional com Compras.gov.br | [x] |
| AC3 | Dados com descricao, preco, unidade, orgao, data, link | [x] |
| AC4 | Tratamento de erros com fallback para mock | [x] |
| AC5 | Rate limiting (10 req/s) | [x] |
| AC6 | Cache basico (10 min TTL) | [x] |
| AC7 | Logs estruturados | [x] |

---

## Implementation Details

### Files Created

| File | Description |
|------|-------------|
| `src/services/datasource/types.ts` | TypeScript interfaces for adapters |
| `src/services/datasource/pncpAdapter.ts` | PNCP API adapter |
| `src/services/datasource/comprasGovAdapter.ts` | Compras.gov.br adapter |
| `src/services/datasource/aggregator.ts` | Multi-source aggregator |
| `src/services/datasource/index.ts` | Barrel exports |
| `src/services/cache/cacheManager.ts` | LRU cache implementation |
| `src/services/cache/index.ts` | Barrel exports |
| `src/services/search/searchService.ts` | Search orchestration service |
| `src/services/search/index.ts` | Barrel exports |

### Files Modified

| File | Changes |
|------|---------|
| `src/app/api/search/route.ts` | Uses searchService with real APIs |
| `src/app/resultados/page.tsx` | Shows source and cache indicator |
| `.env.example` | Added USE_MOCK_DATA flag |

---

## Architecture

```
User Request
     |
     v
POST /api/search
     |
     v
SearchService
     |
     +-- Check Cache (LRU 10min TTL)
     |       |
     |       +-- HIT: Return cached response
     |       |
     |       +-- MISS: Continue
     |
     v
DataSourceAggregator
     |
     +-- PNCPAdapter (parallel)
     |       |
     |       +-- /contratacoes/publicacao
     |       +-- /contratacoes/{cnpj}/{ano}/{seq}/itens
     |       +-- /atas
     |
     +-- ComprasGovAdapter (parallel)
             |
             +-- /materiais/v1/materiais
             +-- /comprasContratos/v1/contratos
     |
     v
Deduplicate & Rank
     |
     v
Calculate Statistics
     |
     v
Cache Response
     |
     v
Return to User
```

---

## PNCP API Integration

### Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/contratacoes/publicacao` | GET | List contratacoes by date range |
| `/contratacoes/{cnpj}/{ano}/{seq}/itens` | GET | Get items with unit prices |
| `/atas` | GET | List atas de registro de preco |
| `/contratos` | GET | List contracts |

### Query Parameters

```
dataInicial: YYYYMMDD (required)
dataFinal: YYYYMMDD (required)
pagina: number (default: 1)
codigoModalidadeContratacao: number (optional)
```

### Rate Limiting

- 10 requests/second max
- 100ms delay between requests
- Automatic retry on 429 (rate limited)
- 2 max retries with exponential backoff

### Error Handling

1. Network errors: Retry 2x with 500ms delay
2. Timeout (30s): Abort and retry
3. Rate limited (429): Wait 1s and retry
4. API unavailable: Fallback to mock data

---

## Cache Strategy

### LRU Cache Configuration

```typescript
{
  max: 1000,        // Max entries
  ttl: 600000,      // 10 minutes
  updateAgeOnGet: true
}
```

### Cache Key Format

```
search:{normalized_term}:{filters_hash}
```

### Cache Behavior

- Full results cached (not paginated)
- Pagination applied on read
- Cache bypassed for mock data
- Stats tracked: hits, misses, hit rate

---

## Testing

### Manual Testing

1. Start dev server: `npm run dev`
2. Search for "papel" - check console for API calls
3. Search again - should see "Cache" indicator
4. Check `/api/search` (GET) for source status

### API Test Commands

```bash
# Test PNCP contratos
curl "https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20240101&dataFinal=20240131&pagina=1"

# Test PNCP contratacoes
curl "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=20240101&dataFinal=20240131&pagina=1"

# Test local search API
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"term": "papel"}'

# Test search status
curl http://localhost:3000/api/search
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_MOCK_DATA` | `false` | Force mock data mode |

---

## Known Issues

1. **PNCP sometimes slow**: First request may take 5-10s
2. **No item-level prices in catalog**: CATMAT/CATSER don't have prices
3. **Date range limited**: Default 12 months lookback
4. **CORS**: May need proxy in production for some endpoints

---

## Next Steps

- [ ] Add more specific error messages
- [ ] Implement circuit breaker pattern
- [ ] Add health indicators to UI
- [ ] Store search results in database
- [ ] Add filters UI (price, date, source)

---

## References

- [PNCP API Swagger](https://pncp.gov.br/api/consulta/swagger-ui/index.html)
- [Compras.gov.br Docs](https://compras.dados.gov.br/docs/home.html)
- [PNCP Analysis](../pncp-api-analysis.md)
