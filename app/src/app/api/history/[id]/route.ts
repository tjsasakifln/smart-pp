import { NextRequest, NextResponse } from "next/server";
import { searchPersistence } from "@/services/search/searchPersistence";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/history/[id]
 *
 * Get a specific search with all its results.
 * Returns the complete search record including all SearchResult records.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const requestId = 'req_' + Date.now();

  try {
    const { id } = await context.params;

    console.log('[' + requestId + '] Fetching search: ' + id);

    const search = await searchPersistence.getSearchById(id);

    if (!search) {
      console.warn('[' + requestId + '] Search not found: ' + id);
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Busca nao encontrada",
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    console.log(
      '[' + requestId + '] Found search "' + search.term + '" with ' + search.results.length + ' results'
    );

    return NextResponse.json({
      search,
    });
  } catch (error) {
    console.error('[' + requestId + '] Get search API error:', error);

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Erro ao buscar pesquisa",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/history/[id]
 *
 * Delete a search and all its results (cascade).
 * Returns success response.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const requestId = 'req_' + Date.now();

  try {
    const { id } = await context.params;

    console.log('[' + requestId + '] Deleting search: ' + id);

    const success = await searchPersistence.deleteSearch(id);

    if (!success) {
      console.warn('[' + requestId + '] Search not found or delete failed: ' + id);
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Busca nao encontrada ou erro ao excluir",
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    console.log('[' + requestId + '] Successfully deleted search: ' + id);

    return NextResponse.json({
      success: true,
      message: "Busca excluida com sucesso",
      id,
    });
  } catch (error) {
    console.error('[' + requestId + '] Delete search API error:', error);

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Erro ao excluir pesquisa",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
