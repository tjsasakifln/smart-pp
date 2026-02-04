/**
 * Comparison View Component - Story 3.5
 *
 * Displays side-by-side comparison of search statistics
 * - Desktop: Side-by-side columns
 * - Mobile: Stacked cards
 */

import { ComparisonSearch, Variations } from "@/types/comparison";
import { VariationBadge } from "./VariationBadge";
import { Calendar, FileText, TrendingUp } from "lucide-react";

interface ComparisonViewProps {
  searches: ComparisonSearch[];
  variations: Variations;
}

export function ComparisonView({ searches, variations }: ComparisonViewProps) {
  if (searches.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Selecione pelo menos 2 pesquisas para comparar
      </div>
    );
  }

  const metrics = [
    { key: "average" as const, label: "Média", icon: TrendingUp },
    { key: "median" as const, label: "Mediana", icon: TrendingUp },
    { key: "min" as const, label: "Menor", icon: TrendingUp },
    { key: "max" as const, label: "Maior", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Search Headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searches.map((search, index) => (
          <div
            key={search.id}
            className="bg-white border rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  Pesquisa {index + 1}
                </h3>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {search.term}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-3 w-3" />
                {new Date(search.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>

              <div className="text-gray-600">
                <span className="font-medium">{search.resultsCount}</span>{" "}
                resultado(s)
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Comparison Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Estatística
                </th>
                {searches.map((search, index) => (
                  <th
                    key={search.id}
                    className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    Pesquisa {index + 1}
                  </th>
                ))}
                {searches.length === 2 && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Variação
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.map((metric) => (
                <tr key={metric.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-4 w-4 text-gray-400" />
                      {metric.label}
                    </div>
                  </td>
                  {searches.map((search) => (
                    <td
                      key={search.id}
                      className="px-4 py-3 text-sm text-right text-gray-900 font-mono"
                    >
                      R$ {search.statistics[metric.key].toFixed(2)}
                    </td>
                  ))}
                  {searches.length === 2 && (
                    <td className="px-4 py-3 text-center">
                      <VariationBadge
                        variation={
                          variations[metric.key][
                            `${searches[0].id}_vs_${searches[1].id}`
                          ] || "N/A"
                        }
                      />
                    </td>
                  )}
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="px-4 py-3 text-sm text-gray-900">
                  Total de Resultados
                </td>
                {searches.map((search) => (
                  <td
                    key={search.id}
                    className="px-4 py-3 text-sm text-right text-gray-900"
                  >
                    {search.resultsCount}
                  </td>
                ))}
                {searches.length === 2 && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-way comparison variations */}
      {searches.length === 3 && (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4">
            Variações entre Pesquisas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric.key} className="space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  {metric.label}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pesq. 1 → Pesq. 2:</span>
                    <VariationBadge
                      variation={
                        variations[metric.key][
                          `${searches[0].id}_vs_${searches[1].id}`
                        ] || "N/A"
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pesq. 2 → Pesq. 3:</span>
                    <VariationBadge
                      variation={
                        variations[metric.key][
                          `${searches[1].id}_vs_${searches[2].id}`
                        ] || "N/A"
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pesq. 1 → Pesq. 3:</span>
                    <VariationBadge
                      variation={
                        variations[metric.key][
                          `${searches[0].id}_vs_${searches[2].id}`
                        ] || "N/A"
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          💡 Variações em verde indicam reduções (bom para comprador),
          variações em vermelho indicam aumentos.
        </p>
        <p className="mt-1">
          Variações superiores a 10% são destacadas em amarelo.
        </p>
      </div>
    </div>
  );
}
