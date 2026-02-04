"use client";

import { useState } from "react";
import { FileSpreadsheet, AlertCircle, GitCompare } from "lucide-react";
import Link from "next/link";
import { HistoryList, SearchFilter } from "@/components/history";
import { ComparisonModal } from "@/components/comparison";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import type { HistoryFilters } from "@/types/history";

export default function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [page] = useState(1);
  const pageSize = 20;

  // Story 3.5: Comparison state
  const [selectedSearches, setSelectedSearches] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const { data, isLoading, error, refetch, deleteSearch } = useSearchHistory(
    page,
    pageSize
  );

  const handleToggleSelection = (searchId: string) => {
    setSelectedSearches((prev) => {
      if (prev.includes(searchId)) {
        return prev.filter((id) => id !== searchId);
      } else if (prev.length < 3) {
        return [...prev, searchId];
      }
      return prev;
    });
  };

  const handleSelectAll = () => {
    if (!data?.searches) return;
    const allIds = data.searches.slice(0, 3).map((s) => s.id);
    setSelectedSearches(allIds);
  };

  const handleClearSelection = () => {
    setSelectedSearches([]);
  };

  const handleCompare = () => {
    if (selectedSearches.length >= 2) {
      setShowComparisonModal(true);
    }
  };

  const handleCloseComparison = () => {
    setShowComparisonModal(false);
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Licita Preços</span>
          </Link>
          <nav className="flex gap-4">
            <span className="text-sm font-medium">Histórico</span>
          </nav>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Histórico de Pesquisas</h1>
            <p className="text-muted-foreground">
              Acesse suas pesquisas anteriores e refaça buscas rapidamente
            </p>
          </div>

          {error && (
            <div className="flex flex-col items-center justify-center py-16 mb-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium">Erro ao carregar histórico</p>
              <p className="text-muted-foreground mt-2">{error}</p>
              <button
                onClick={refetch}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!error && (
            <div className="grid lg:grid-cols-[300px_1fr] gap-6">
              {/* Filters Sidebar */}
              <div>
                <SearchFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>

              {/* History List */}
              <div>
                {isLoading && (
                  <div className="text-center py-16">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="text-muted-foreground mt-4">
                      Carregando histórico...
                    </p>
                  </div>
                )}

                {!isLoading && data && (
                  <>
                    {/* Comparison Controls - Story 3.5 */}
                    {data.searches.length > 0 && (
                      <div className="mb-4 flex items-center justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            {selectedSearches.length === 0
                              ? "Selecione 2-3 pesquisas para comparar"
                              : `${selectedSearches.length} pesquisa(s) selecionada(s)`}
                          </p>
                          {selectedSearches.length > 0 && selectedSearches.length < 2 && (
                            <p className="text-xs text-blue-700 mt-1">
                              Selecione pelo menos mais 1 pesquisa
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {selectedSearches.length > 0 && (
                            <button
                              onClick={handleClearSelection}
                              className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                            >
                              Limpar
                            </button>
                          )}
                          {selectedSearches.length === 0 && data.searches.length >= 2 && (
                            <button
                              onClick={handleSelectAll}
                              className="px-3 py-1.5 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                            >
                              Selecionar 3 primeiras
                            </button>
                          )}
                          <button
                            onClick={handleCompare}
                            disabled={selectedSearches.length < 2}
                            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <GitCompare className="h-4 w-4" />
                            Comparar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mb-4 text-sm text-muted-foreground">
                      {data.pagination.totalItems === 0
                        ? "Nenhuma pesquisa encontrada"
                        : `${data.pagination.totalItems} pesquisa(s) encontrada(s)`}
                    </div>

                    <HistoryList
                      searches={data.searches}
                      onDelete={deleteSearch}
                      onRefetch={refetch}
                      selectedSearches={selectedSearches}
                      onToggleSelection={handleToggleSelection}
                    />

                    {data.pagination.totalPages > 1 && (
                      <div className="mt-6 text-center text-sm text-muted-foreground">
                        Página {data.pagination.page} de {data.pagination.totalPages}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Comparison Modal - Story 3.5 */}
          <ComparisonModal
            isOpen={showComparisonModal}
            onClose={handleCloseComparison}
            searchIds={selectedSearches}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Licita Preços - Pesquisa de preços para licitações públicas</p>
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
