import { NextRequest, NextResponse } from "next/server";
import { searchService } from "@/services/search/searchService";
import type { SearchRequest } from "@/types/search";

/**
 * POST /api/search
 *
 * Search for prices across government data sources:
 * - PNCP (Portal Nacional de Contratacoes Publicas)
 * - Compras.gov.br (API de Dados Abertos)
 *
 * Falls back to mock data if APIs are unavailable.
 */
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}`;

  try {
    const body: SearchRequest = await request.json();
    const { term, filters, page = 1, pageSize = 20 } = body;

    // Validate request
    if (!term || term.trim().length === 0) {
      console.warn(`[${requestId}] Empty search term`);
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "O termo de busca e obrigatorio",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    if (term.trim().length < 2) {
      console.warn(`[${requestId}] Search term too short: "${term}"`);
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: "O termo de busca deve ter pelo menos 2 caracteres",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Search request: "${term.trim()}"`);

    // Execute search
    const response = await searchService.search({
      term: term.trim(),
      filters,
      page,
      pageSize,
    });

    console.log(
      `[${requestId}] Search complete: ${response.pagination.totalResults} results`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error(`[${requestId}] Search API error:`, error);

    // Check if it's a known error type
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "INVALID_JSON",
          message: "Corpo da requisicao invalido",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Erro interno ao processar a busca. Tente novamente.",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search/status
 *
 * Check data source availability and cache stats
 */
export async function GET() {
  try {
    const [sources, cacheStats] = await Promise.all([
      searchService.checkSources(),
      Promise.resolve(searchService.getCacheStats()),
    ]);

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      sources,
      cache: cacheStats,
    });
  } catch (error) {
    console.error("[SearchStatus] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Erro ao verificar status das fontes",
      },
      { status: 500 }
    );
  }
}
