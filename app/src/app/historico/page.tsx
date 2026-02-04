"use client";

import { useState } from "react";
import { FileSpreadsheet, AlertCircle } from "lucide-react";
import Link from "next/link";
import { HistoryList, SearchFilter } from "@/components/history";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import type { HistoryFilters } from "@/types/history";

export default function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [page] = useState(1);
  const pageSize = 20;

  const { data, isLoading, error, refetch, deleteSearch } = useSearchHistory(
    page,
    pageSize
  );

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
                    <div className="mb-4 text-sm text-muted-foreground">
                      {data.pagination.totalItems === 0
                        ? "Nenhuma pesquisa encontrada"
                        : `${data.pagination.totalItems} pesquisa(s) encontrada(s)`}
                    </div>

                    <HistoryList
                      searches={data.searches}
                      onDelete={deleteSearch}
                      onRefetch={refetch}
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
