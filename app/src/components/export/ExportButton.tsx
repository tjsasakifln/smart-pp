"use client";

// ExportButton Component - Licita Precos
// Allows exporting search results to Excel

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileSpreadsheet, CheckCircle2 } from "lucide-react";

interface ExportButtonProps {
  searchId: string;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({ searchId, disabled = false, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setExportSuccess(false);

    try {
      const response = await fetch("/api/export/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao exportar");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || "pesquisa-precos.xlsx";

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success feedback
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error("Export error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao exportar planilha";
      setError(errorMessage);

      // Show error alert
      alert(`Erro na exportacao: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleExport}
        disabled={disabled || isExporting}
        variant={exportSuccess ? "outline" : "default"}
        className={className}
        title="Exportar resultados para Excel"
      >
        {isExporting && (
          <>
            <Loader2 className="animate-spin" />
            Gerando Excel...
          </>
        )}
        {!isExporting && exportSuccess && (
          <>
            <CheckCircle2 className="text-green-600" />
            Exportado!
          </>
        )}
        {!isExporting && !exportSuccess && (
          <>
            <Download />
            Exportar Excel
          </>
        )}
      </Button>

      {/* Success message */}
      {exportSuccess && (
        <span className="text-sm text-green-600 font-medium animate-fade-in">
          Download iniciado
        </span>
      )}
    </div>
  );
}

interface ExportInfoProps {
  resultsCount: number;
  className?: string;
}

export function ExportInfo({ resultsCount, className }: ExportInfoProps) {
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <FileSpreadsheet className="h-4 w-4" />
      <span>
        Exportar {resultsCount} resultado{resultsCount !== 1 ? "s" : ""} para Excel
      </span>
    </div>
  );
}
