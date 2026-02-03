"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";

export interface Filters {
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sources?: string[];
}

interface FiltersPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableSources?: string[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  availableSources = [],
  isOpen = true,
  onToggle,
}: FiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // Apply filters in real-time
  useEffect(() => {
    onFiltersChange(localFilters);
  }, [localFilters, onFiltersChange]);

  const handleClearFilters = () => {
    const emptyFilters: Filters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters =
    localFilters.minPrice !== undefined ||
    localFilters.maxPrice !== undefined ||
    localFilters.startDate !== undefined ||
    localFilters.endDate !== undefined ||
    (localFilters.sources && localFilters.sources.length > 0);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="mb-4"
      >
        <Filter className="h-4 w-4 mr-2" />
        Mostrar Filtros
        {hasActiveFilters && (
          <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
            {Object.keys(localFilters).length}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Price Range Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Faixa de Preco
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Minimo</label>
                <Input
                  type="number"
                  placeholder="R$ 0,00"
                  value={localFilters.minPrice ?? ""}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      minPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Maximo</label>
                <Input
                  type="number"
                  placeholder="R$ 99999,99"
                  value={localFilters.maxPrice ?? ""}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      maxPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Periodo da Cotacao
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Data Inicial</label>
                <Input
                  type="date"
                  value={localFilters.startDate ?? ""}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      startDate: e.target.value || undefined,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Data Final</label>
                <Input
                  type="date"
                  value={localFilters.endDate ?? ""}
                  onChange={(e) =>
                    setLocalFilters({
                      ...localFilters,
                      endDate: e.target.value || undefined,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Sources Filter */}
          {availableSources.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Fontes
              </label>
              <div className="space-y-2">
                {availableSources.map((source) => (
                  <label
                    key={source}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={localFilters.sources?.includes(source) ?? false}
                      onChange={(e) => {
                        const currentSources = localFilters.sources ?? [];
                        const newSources = e.target.checked
                          ? [...currentSources, source]
                          : currentSources.filter((s) => s !== source);
                        setLocalFilters({
                          ...localFilters,
                          sources: newSources.length > 0 ? newSources : undefined,
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{source}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
