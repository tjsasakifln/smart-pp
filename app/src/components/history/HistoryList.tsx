"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  RefreshCw,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import type { SearchHistoryItem } from "@/types/history";

interface HistoryListProps {
  searches: SearchHistoryItem[];
  onDelete: (id: string) => Promise<void>;
  onRefetch?: () => void;
  // Story 3.5: Multi-select for comparison
  selectedSearches?: string[];
  onToggleSelection?: (id: string) => void;
}

export function HistoryList({
  searches,
  onDelete,
  onRefetch,
  selectedSearches = [],
  onToggleSelection,
}: HistoryListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refetchingId, setRefetchingId] = useState<string | null>(null);

  const isSelected = (id: string) => selectedSearches.includes(id);
  const isSelectionEnabled = !!onToggleSelection;
  const canSelectMore = selectedSearches.length < 3;

  const handleView = (search: SearchHistoryItem) => {
    // Navigate to results page with the search term
    router.push(`/resultados?q=${encodeURIComponent(search.term)}`);
  };

  const handleRefetch = async (search: SearchHistoryItem) => {
    setRefetchingId(search.id);
    try {
      // Navigate to results page to trigger a fresh search
      router.push(`/resultados?q=${encodeURIComponent(search.term)}`);
    } finally {
      setRefetchingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pesquisa?")) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
      onRefetch?.();
    } catch {
      alert("Erro ao excluir pesquisa. Tente novamente.");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (searches.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-slate-50">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">
          Nenhuma pesquisa encontrada
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Suas pesquisas aparecerão aqui automaticamente
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searches.map((search) => {
        const selected = isSelected(search.id);
        const canSelect = canSelectMore || selected;

        return (
          <Card
            key={search.id}
            className={`transition-all ${
              selected ? "ring-2 ring-blue-500 bg-blue-50/50" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                {/* Story 3.5: Checkbox for comparison */}
                {isSelectionEnabled && (
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelection(search.id)}
                      disabled={!canSelect}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Selecionar pesquisa: ${search.term}`}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate mb-2">
                    {search.term}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(search.createdAt)}
                    </span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{search.resultsCount} resultados</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleView(search)}
                className="flex-1 sm:flex-none"
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRefetch(search)}
                disabled={refetchingId === search.id}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refetchingId === search.id ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(search.id)}
                disabled={deletingId === search.id}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
