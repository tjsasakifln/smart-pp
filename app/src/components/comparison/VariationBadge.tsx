/**
 * Variation Badge Component - Story 3.5
 *
 * Displays percentage variation with color coding:
 * - Green: decrease (good for buyer)
 * - Red: increase (bad for buyer)
 * - Yellow: significant change (> 10%)
 */

import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface VariationBadgeProps {
  variation: string; // e.g. "+5.2%" or "-3.1%" or "N/A"
  className?: string;
}

export function VariationBadge({ variation, className = "" }: VariationBadgeProps) {
  // Handle N/A case
  if (variation === "N/A") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 ${className}`}
        title="Não foi possível calcular a variação"
      >
        <Minus className="h-3 w-3" />
        N/A
      </span>
    );
  }

  // Parse variation (e.g. "+5.2%" -> 5.2)
  const value = parseFloat(variation.replace("%", ""));
  const isPositive = value > 0;
  const isSignificant = Math.abs(value) > 10;

  // Determine color based on direction and significance
  let colorClasses = "";
  let Icon = Minus;

  if (isPositive) {
    // Increase (bad for buyer)
    Icon = ArrowUp;
    colorClasses = isSignificant
      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
      : "bg-red-50 text-red-700";
  } else if (value < 0) {
    // Decrease (good for buyer)
    Icon = ArrowDown;
    colorClasses = isSignificant
      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
      : "bg-green-50 text-green-700";
  } else {
    // No change
    colorClasses = "bg-gray-100 text-gray-600";
  }

  const tooltip = isSignificant
    ? `Variação significativa: ${variation} (> 10%)`
    : `Variação: ${variation}`;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${colorClasses} ${className}`}
      title={tooltip}
    >
      <Icon className="h-3 w-3" />
      {variation}
    </span>
  );
}
