"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Hash, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  tooltip: string;
}

function StatItem({ icon, label, value, color, tooltip }: StatItemProps) {
  return (
    <div className="flex flex-col items-center p-4 hover:bg-slate-50 rounded-lg transition-colors group relative">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>

      {/* Tooltip */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-48 p-2 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

export function StatsCard({ stats }: StatsCardProps) {
  if (stats.count === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Estatisticas de Precos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <StatItem
            icon={<Hash className="h-6 w-6" />}
            label="Resultados"
            value={stats.count.toString()}
            color="text-slate-700"
            tooltip="Total de precos encontrados para sua busca"
          />
          <StatItem
            icon={<DollarSign className="h-6 w-6" />}
            label="Media"
            value={formatCurrency(stats.average)}
            color="text-blue-600"
            tooltip="Media aritmetica de todos os precos encontrados"
          />
          <StatItem
            icon={<TrendingUp className="h-6 w-6" />}
            label="Mediana"
            value={formatCurrency(stats.median)}
            color="text-green-600"
            tooltip="Valor central quando os precos sao ordenados (recomendado pela IN 65/2021)"
          />
          <StatItem
            icon={<TrendingDown className="h-6 w-6" />}
            label="Menor"
            value={formatCurrency(stats.min)}
            color="text-emerald-600"
            tooltip="Menor preco encontrado nas fontes consultadas"
          />
          <StatItem
            icon={<TrendingUp className="h-6 w-6" />}
            label="Maior"
            value={formatCurrency(stats.max)}
            color="text-orange-600"
            tooltip="Maior preco encontrado nas fontes consultadas"
          />
        </div>
      </CardContent>
    </Card>
  );
}
