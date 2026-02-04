"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import type { HistoryFilters } from "@/types/history";

interface SearchFilterProps {
  filters: HistoryFilters;
  onFiltersChange: (filters: HistoryFilters) => void;
}

export function SearchFilter({ filters, onFiltersChange }: SearchFilterProps) {
  const [localFilters, setLocalFilters] = useState<HistoryFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const emptyFilters: HistoryFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = !!(
    localFilters.term ||
    localFilters.startDate ||
    localFilters.endDate
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" />
          Filtrar Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Term */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Termo Pesquisado
            </label>
            <Input
              type="text"
              placeholder="Ex: papel A4"
              value={localFilters.term || ""}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, term: e.target.value })
              }
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Período
            </label>
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="Data inicial"
                value={localFilters.startDate || ""}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, startDate: e.target.value })
                }
              />
              <Input
                type="date"
                placeholder="Data final"
                value={localFilters.endDate || ""}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, endDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApply}
              className="flex-1"
              size="sm"
            >
              Aplicar
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
