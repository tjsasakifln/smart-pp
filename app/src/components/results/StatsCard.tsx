"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { SearchStats } from "@/types/search";

interface StatsCardProps {
  stats: SearchStats;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function StatsCard({ stats }: StatsCardProps) {
  if (stats.count === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Resultados</p>
            <p className="text-2xl font-bold">{stats.count}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Media</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.average)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Mediana</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.median)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Menor</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.min)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Maior</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.max)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
