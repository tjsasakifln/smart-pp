"use client";

import { ExternalLink } from "lucide-react";
import type { PriceResult } from "@/types/search";

interface ResultsTableProps {
  results: PriceResult[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
}

export function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Tente pesquisar com outros termos.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Descricao</th>
            <th className="px-4 py-3 text-right font-semibold">Preco</th>
            <th className="px-4 py-3 text-center font-semibold">Unidade</th>
            <th className="px-4 py-3 text-left font-semibold">Fonte</th>
            <th className="px-4 py-3 text-center font-semibold">Data</th>
            <th className="px-4 py-3 text-left font-semibold">Orgao</th>
            <th className="px-4 py-3 text-center font-semibold">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {results.map((result) => (
            <tr key={result.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <div className="max-w-xs">
                  <p className="font-medium truncate" title={result.description}>
                    {result.description}
                  </p>
                  {result.codigoCatmat && (
                    <p className="text-xs text-muted-foreground">
                      CATMAT: {result.codigoCatmat}
                    </p>
                  )}
                  {result.codigoCatser && (
                    <p className="text-xs text-muted-foreground">
                      CATSER: {result.codigoCatser}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">
                {formatCurrency(result.price)}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs">
                  {result.unit}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs">{result.source}</span>
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground">
                {formatDate(result.quotationDate)}
              </td>
              <td className="px-4 py-3">
                <p
                  className="max-w-[150px] truncate text-xs text-muted-foreground"
                  title={result.organ}
                >
                  {result.organ || "-"}
                </p>
              </td>
              <td className="px-4 py-3 text-center">
                <a
                  href={result.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                  title="Abrir fonte original"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
