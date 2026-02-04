import { NextRequest, NextResponse } from "next/server";
import { searchPersistence } from "@/services/search/searchPersistence";
import { searchService } from "@/services/search/searchService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/history/[id]/refetch
 *
 * Re-execute a search with its original parameters.
 * Creates a new search record with updated results.
 *
 * This is useful for refreshing stale data or checking for price changes.
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  const requestId = 'req_' + Date.now();

  try {
    const { id } = await context.params;

    console.log('[' + requestId + '] Refetching search: ' + id);

    // Get original search
    const originalSearch = await searchPersistence.getSearchById(id);

    if (!originalSearch) {
      console.warn('[' + requestId + '] Search not found: ' + id);
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          message: "Busca original nao encontrada",
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    console.log('[' + requestId + '] Re-executing search: "' + originalSearch.term + '"');

    // Re-execute the search with original parameters
    const response = await searchService.search({
      term: originalSearch.term,
      filters: originalSearch.filters as Record<string, unknown> | undefined,
      page: 1,
      pageSize: 20,
    });

    console.log(
      '[' + requestId + '] Refetch complete: ' + response.pagination.totalResults + ' results'
    );

    // Save as a new search (preserving original session if it exists)
    const sessionId = originalSearch.sessionId || undefined;
    const newSearchId = await searchPersistence.saveSearch(response, sessionId);

    console.log('[' + requestId + '] Saved new search: ' + newSearchId);

    return NextResponse.json({
      success: true,
      message: "Busca atualizada com sucesso",
      originalId: id,
      newId: newSearchId,
      results: response.pagination.totalResults,
    });
  } catch (error) {
    console.error('[' + requestId + '] Refetch search API error:', error);

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Erro ao atualizar pesquisa",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
