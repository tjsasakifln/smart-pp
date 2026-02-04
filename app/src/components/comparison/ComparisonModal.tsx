/**
 * Comparison Modal Component - Story 3.5
 *
 * Modal for displaying search comparison with export functionality
 */

"use client";

import { useState, useEffect } from "react";
import { X, Download, AlertCircle, Loader2 } from "lucide-react";
import { ComparisonView } from "./ComparisonView";
import { Modal } from "../shared/Modal";
import type { ComparisonResponse, ComparisonError } from "@/types/comparison";

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchIds: string[];
}

export function ComparisonModal({
  isOpen,
  onClose,
  searchIds,
}: ComparisonModalProps) {
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch comparison data when modal opens
  useEffect(() => {
    if (isOpen && searchIds.length >= 2) {
      fetchComparison();
    }
  }, [isOpen, searchIds]);

  const fetchComparison = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/comparison", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchIds }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ComparisonError;
        throw new Error(errorData.error || "Erro ao comparar pesquisas");
      }

      const data = (await response.json()) as ComparisonResponse;
      setComparison(data);
    } catch (err: any) {
      console.error("Comparison error:", err);
      setError(err.message || "Erro ao carregar comparação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!comparison) return;

    setIsExporting(true);

    try {
      // TODO: Implement Excel export
      // For now, we'll create a simple CSV download
      const csv = generateCSV(comparison);
      downloadCSV(csv, `comparacao-${new Date().toISOString().split("T")[0]}.csv`);
    } catch (err: any) {
      console.error("Export error:", err);
      alert("Erro ao exportar comparação");
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (data: ComparisonResponse): string => {
    const lines: string[] = [];

    // Header
    lines.push("Comparação de Pesquisas de Preços");
    lines.push("");

    // Search details
    lines.push("PESQUISAS");
    data.searches.forEach((search, index) => {
      lines.push(`Pesquisa ${index + 1}`);
      lines.push(`Termo,${search.term}`);
      lines.push(
        `Data,${new Date(search.date).toLocaleDateString("pt-BR")}`
      );
      lines.push(`Resultados,${search.resultsCount}`);
      lines.push("");
    });

    // Statistics header
    lines.push("ESTATÍSTICAS");
    const header = ["Métrica", ...data.searches.map((_, i) => `Pesquisa ${i + 1}`)];
    if (data.searches.length === 2) {
      header.push("Variação");
    }
    lines.push(header.join(","));

    // Statistics rows
    const metrics = ["average", "median", "min", "max"];
    const metricLabels = {
      average: "Média",
      median: "Mediana",
      min: "Menor",
      max: "Maior",
    };

    metrics.forEach((metric) => {
      const row = [
        metricLabels[metric as keyof typeof metricLabels],
        ...data.searches.map(
          (s) => `R$ ${s.statistics[metric as keyof typeof s.statistics].toFixed(2)}`
        ),
      ];

      if (data.searches.length === 2) {
        const variation =
          data.variations[metric as keyof typeof data.variations][
            `${data.searches[0].id}_vs_${data.searches[1].id}`
          ];
        row.push(variation || "N/A");
      }

      lines.push(row.join(","));
    });

    // Significant changes
    if (data.significantChanges.length > 0) {
      lines.push("");
      lines.push("MUDANÇAS SIGNIFICATIVAS (> 10%)");
      lines.push("Métrica,De,Para,Variação");
      data.significantChanges.forEach((change) => {
        const fromIndex = data.searches.findIndex((s) => s.id === change.from);
        const toIndex = data.searches.findIndex((s) => s.id === change.to);
        lines.push(
          `${change.metric},Pesquisa ${fromIndex + 1},Pesquisa ${toIndex + 1},${change.change}`
        );
      });
    }

    return lines.join("\n");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-6xl">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Comparação de Pesquisas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Comparando {searchIds.length} pesquisa(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Carregando comparação...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 font-medium mb-2">Erro ao carregar comparação</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchComparison}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!isLoading && !error && comparison && (
            <ComparisonView
              searches={comparison.searches}
              variations={comparison.variations}
            />
          )}

          {!isLoading && !error && comparison && comparison.significantChanges.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Mudanças Significativas Detectadas ({">"} 10%)
              </h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                {comparison.significantChanges.slice(0, 5).map((change, index) => {
                  const fromIndex = comparison.searches.findIndex(
                    (s) => s.id === change.from
                  );
                  const toIndex = comparison.searches.findIndex(
                    (s) => s.id === change.to
                  );
                  return (
                    <li key={index}>
                      <strong>{change.metric}</strong>: Pesquisa {fromIndex + 1} →
                      Pesquisa {toIndex + 1} = {change.change}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleExport}
            disabled={!comparison || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar CSV
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
