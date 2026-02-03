import { FileSpreadsheet, Clock } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Licita Preços</span>
          </Link>
          <nav className="flex gap-4">
            <span className="text-sm font-medium">Histórico</span>
          </nav>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">Histórico de Pesquisas</h1>

          <div className="text-center py-16 border rounded-lg bg-slate-50">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Funcionalidade em desenvolvimento (Epic 3)
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Em breve suas pesquisas serão salvas automaticamente aqui.
            </p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              Fazer uma pesquisa
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>Licita Preços - Pesquisa de preços para licitações públicas</p>
      </footer>
    </main>
  );
}
