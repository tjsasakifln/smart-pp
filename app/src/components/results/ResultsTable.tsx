"use client";

import { ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import type { PriceResult } from "@/types/search";
import type { SortField, SortOrder } from "@/services/stats/statsService";

interface ResultsTableProps {
  results: PriceResult[];
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
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

interface SortableHeaderProps {
  field: SortField;
  label: string;
  currentField?: SortField;
  currentOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  align?: "left" | "right" | "center";
}

function SortableHeader({
  field,
  label,
  currentField,
  currentOrder,
  onSort,
  align = "left",
}: SortableHeaderProps) {
  const isActive = currentField === field;
  const alignClass =
    align === "right"
      ? "justify-end"
      : align === "center"
      ? "justify-center"
      : "justify-start";

  return (
    <th
      className={`px-4 py-3 font-semibold ${
        onSort ? "cursor-pointer hover:bg-slate-100 transition-colors" : ""
      }`}
      onClick={() => onSort && onSort(field)}
    >
      <div className={`flex items-center gap-2 ${alignClass}`}>
        <span>{label}</span>
        {onSort && (
          <div className="flex flex-col">
            <ArrowUp
              className={`h-3 w-3 -mb-1 ${
                isActive && currentOrder === "asc"
                  ? "text-blue-600"
                  : "text-gray-300"
              }`}
            />
            <ArrowDown
              className={`h-3 w-3 ${
                isActive && currentOrder === "desc"
                  ? "text-blue-600"
                  : "text-gray-300"
              }`}
            />
          </div>
        )}
      </div>
    </th>
  );
}

export function ResultsTable({
  results,
  sortField,
  sortOrder,
  onSort,
}: ResultsTableProps) {
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
            <SortableHeader
              field="description"
              label="Descricao"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              align="left"
            />
            <SortableHeader
              field="price"
              label="Preco"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              align="right"
            />
            <th className="px-4 py-3 text-center font-semibold">Unidade</th>
            <SortableHeader
              field="source"
              label="Fonte"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              align="left"
            />
            <SortableHeader
              field="date"
              label="Data"
              currentField={sortField}
              currentOrder={sortOrder}
              onSort={onSort}
              align="center"
            />
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
