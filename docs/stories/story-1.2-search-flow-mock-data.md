# Story 1.2: Fluxo de Pesquisa com Dados Mock

**Status:** In Progress
**Sprint:** 1
**Assigned:** Dex (Dev)
**Started:** 2026-02-03

---

## User Story

> Como **usuario**,
> Eu quero **digitar um termo e ver resultados de precos na tela**,
> Para que **eu possa validar o fluxo de busca antes da integracao com fontes reais**.

---

## Acceptance Criteria

| # | Criterio | Status |
|---|----------|--------|
| AC1 | Barra de pesquisa funcional que submete o termo para a API | [x] |
| AC2 | Endpoint `POST /api/search` recebe termo e retorna array de resultados | [x] |
| AC3 | Resultados mock retornados contendo: descricao, preco, fonte, data, link | [x] |
| AC4 | Tabela de resultados exibida na tela com todas as colunas | [x] |
| AC5 | Estado de loading exibido durante a busca | [x] |
| AC6 | Estado de "nenhum resultado" tratado adequadamente | [x] |

---

## Implementation Details

### Files Created

| File | Description |
|------|-------------|
| `src/types/search.ts` | TypeScript types for search functionality |
| `src/app/api/search/route.ts` | POST endpoint with mock data |
| `src/components/results/StatsCard.tsx` | Statistics display card |
| `src/components/results/ResultsTable.tsx` | Results table component |
| `src/components/results/LoadingState.tsx` | Loading spinner component |
| `src/components/results/index.ts` | Barrel export |

### Files Modified

| File | Changes |
|------|---------|
| `src/app/resultados/page.tsx` | Integrated API call and components |
| `src/app/page.tsx` | Updated source mention to include PNCP |

### Mock Data

Mock data includes 12 items representing typical government procurement:
- Papel A4 (3 variants)
- Canetas (2 variants)
- Computadores (2 variants)
- Notebook
- Servicos de limpeza (2 variants)
- Agua mineral
- Toner

Search terms that return results: `papel`, `caneta`, `computador`, `notebook`, `limpeza`, `agua`, `toner`

### API Response Structure

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
```

---

## Testing

### Manual Testing

1. Go to homepage (`/`)
2. Enter "papel" in search bar
3. Click "Pesquisar"
4. Verify:
   - Loading state appears
   - Results page shows statistics card
   - Results table displays 3 items
   - Links are clickable (open in new tab)
   - Prices formatted as R$ X,XX

### Test Cases

| Test | Expected | Status |
|------|----------|--------|
| Search "papel" | 3 results | [x] |
| Search "caneta" | 2 results | [x] |
| Search "xyz123" | 0 results | [x] |
| Empty search | Validation error | [x] |

---

## Notes

- Mock data simulates real PNCP and Compras.gov.br sources
- Statistics calculated correctly (average, median, min, max)
- Ready for real API integration in Story 1.3
