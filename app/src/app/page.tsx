import { SearchBar } from "@/components/search/SearchBar";
import { FileSpreadsheet, Link2, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Licita Preços</span>
          </div>
          <nav className="flex gap-4">
            <a
              href="/historico"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Histórico
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Pesquisa de Preços para Licitações
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Consulte preços praticados em compras públicas com fontes
            verificáveis para fundamentar seus processos licitatórios.
          </p>
        </div>

        <SearchBar />

        <p className="mt-4 text-sm text-muted-foreground">
          Fontes: PNCP e API de Dados Abertos do Governo Federal
        </p>
      </section>

      {/* Features */}
      <section className="border-t bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Fontes Verificáveis</h3>
              <p className="text-sm text-muted-foreground">
                Cada preço inclui link para a fonte original, garantindo
                rastreabilidade.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Estatísticas Automáticas</h3>
              <p className="text-sm text-muted-foreground">
                Média, mediana, menor e maior valor calculados conforme IN
                65/2021.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Exportação Excel e PDF</h3>
              <p className="text-sm text-muted-foreground">
                Gere planilhas e relatórios prontos para anexar ao processo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          Licita Preços - Pesquisa de preços para licitações públicas
        </p>
        <p className="mt-1">
          Dados do{" "}
          <a
            href="https://compras.dados.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Portal de Compras do Governo Federal
          </a>
        </p>
      </footer>
    </main>
  );
}
