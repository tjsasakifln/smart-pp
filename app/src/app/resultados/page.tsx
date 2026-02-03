"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { SearchBar } from "@/components/search/SearchBar";
import {
  StatsCard,
  ResultsTable,
  LoadingState,
  FiltersPanel,
  type Filters,
} from "@/components/results";
import { ExportButton } from "@/components/export";
import { FileSpreadsheet, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { SearchResponse } from "@/types/search";
import {
  filterResults,
  sortResults,
  calculateStats,
  getUniqueSources,
  type SortField,
  type SortOrder,
} from "@/services/stats/statsService";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const term = searchParams.get("q") || "";

  const [rawData, setRawData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [filters, setFilters] = useState<Filters>({});
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Initialize filters from URL params
  useEffect(() => {
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sources = searchParams.get("sources");
    const sort = searchParams.get("sort");
    const order = searchParams.get("order");

    setFilters({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sources: sources ? sources.split(",") : undefined,
    });

    if (sort) setSortField(sort as SortField);
    if (order) setSortOrder(order as SortOrder);
  }, [searchParams]);

  // Fetch results
  useEffect(() => {
    if (!term) {
      setRawData(null);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ term }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao buscar resultados");
        }

        const result: SearchResponse = await response.json();
        setRawData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [term]);

  // Update URL with filters and sort
  const updateURL = useCallback(
    (newFilters: Filters, newSort?: SortField, newOrder?: SortOrder) => {
      const params = new URLSearchParams();
      params.set("q", term);

      if (newFilters.minPrice !== undefined)
        params.set("minPrice", newFilters.minPrice.toString());
      if (newFilters.maxPrice !== undefined)
        params.set("maxPrice", newFilters.maxPrice.toString());
      if (newFilters.startDate) params.set("startDate", newFilters.startDate);
      if (newFilters.endDate) params.set("endDate", newFilters.endDate);
      if (newFilters.sources && newFilters.sources.length > 0)
        params.set("sources", newFilters.sources.join(","));

      if (newSort) params.set("sort", newSort);
      if (newOrder) params.set("order", newOrder);

      router.push(`/resultados?${params.toString()}`, { scroll: false });
    },
    [term, router]
  );

  // Handle filters change
  const handleFiltersChange = useCallback(
    (newFilters: Filters) => {
      setFilters(newFilters);
      updateURL(newFilters, sortField, sortOrder);
    },
    [updateURL, sortField, sortOrder]
  );

  // Handle sort
  const handleSort = useCallback(
    (field: SortField) => {
      const newOrder =
        sortField === field && sortOrder === "asc" ? "desc" : "asc";
      setSortField(field);
      setSortOrder(newOrder);
      updateURL(filters, field, newOrder);
    },
    [sortField, sortOrder, filters, updateURL]
  );

  // Process results: filter, sort, and calculate stats
  const processedData = useMemo(() => {
    if (!rawData) return null;

    let processed = [...rawData.results];

    // Apply filters
    processed = filterResults(processed, filters);

    // Apply sorting
    processed = sortResults(processed, { field: sortField, order: sortOrder });

    // Recalculate stats
    const newStats = calculateStats(processed);

    return {
      ...rawData,
      results: processed,
      stats: newStats,
      pagination: {
        ...rawData.pagination,
        totalResults: processed.length,
        totalPages: Math.ceil(processed.length / rawData.pagination.pageSize),
      },
    };
  }, [rawData, filters, sortField, sortOrder]);

  // Get unique sources for filter
  const availableSources = useMemo(
    () => (rawData ? getUniqueSources(rawData.results) : []),
    [rawData]
  );

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Licita Precos</span>
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/historico"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Historico
            </Link>
          </nav>
        </div>
      </header>

      {/* Search Section */}
      <section className="border-b bg-slate-50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
          <SearchBar />
        </div>
      </section>

      {/* Results Section */}
      <section className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {!term && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                Digite um termo para pesquisar precos.
              </p>
            </div>
          )}

          {term && isLoading && <LoadingState />}

          {term && error && (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">Erro na busca</p>
              <p className="text-muted-foreground mt-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {term && !isLoading && !error && processedData && (
            <>
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">
                      Resultados para: &quot;{term}&quot;
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {processedData.pagination.totalResults} resultado(s)
                        encontrado(s)
                      </span>
                      <span className="text-muted-foreground/50">|</span>
                      <span>Fontes: {processedData.meta.sources.join(", ")}</span>
                      {processedData.meta.cached && (
                        <>
                          <span className="text-muted-foreground/50">|</span>
                          <span className="inline-flex items-center gap-1 text-blue-600">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            Cache
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ExportButton
                    searchId={processedData.id}
                    disabled={processedData.results.length === 0}
                  />
                </div>
              </div>

              <StatsCard stats={processedData.stats} />

              <div className="grid lg:grid-cols-[300px_1fr] gap-6">
                <div>
                  <FiltersPanel
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    availableSources={availableSources}
                    isOpen={isFiltersOpen}
                    onToggle={() => setIsFiltersOpen(!isFiltersOpen)}
                  />
                </div>

                <div>
                  <ResultsTable
                    results={processedData.results}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />

                  {processedData.pagination.totalPages > 1 && (
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                      Pagina {processedData.pagination.page} de{" "}
                      {processedData.pagination.totalPages}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {term &&
            !isLoading &&
            !error &&
            processedData &&
            processedData.results.length === 0 && (
              <div className="text-center py-16 bg-slate-50 rounded-lg">
                <p className="text-muted-foreground font-medium">
                  Nenhum resultado encontrado para &quot;{term}&quot;
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tente ajustar os filtros ou pesquisar com outros termos
                </p>
              </div>
            )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Licita Precos - Pesquisa de precos para licitacoes publicas</p>
        <p className="mt-1">
          Dados do{" "}
          <a
            href="https://pncp.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            PNCP
          </a>
          {" e "}
          <a
            href="https://compras.dados.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Compras.gov.br
          </a>
        </p>
      </footer>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingState />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
