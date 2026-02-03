"use client";

import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Buscando precos...</p>
      <p className="text-sm text-muted-foreground mt-1">
        Consultando fontes governamentais
      </p>
    </div>
  );
}
