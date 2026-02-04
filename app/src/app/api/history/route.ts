import { NextRequest, NextResponse } from "next/server";
import { searchPersistence } from "@/services/search/searchPersistence";

/**
 * GET /api/history
 *
 * List all searches with pagination support.
 * Supports session isolation via x-session-id header.
 *
 * Query params:
 * - limit: number of results (default: 20, max: 100)
 * - offset: pagination offset (default: 0)
 *
 * Returns search summaries (id, term, resultsCount, createdAt, filters)
 */
export async function GET(request: NextRequest) {
  const requestId = 'req_' + Date.now();

  try {
    // Extract pagination params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get session ID for filtering
    const sessionId = request.headers.get("x-session-id") || undefined;

    console.log(
      '[' + requestId + '] Fetching history (limit: ' + limit + ', offset: ' + offset + ', session: ' + (sessionId || 'all') + ')'
    );

    // Get total count for pagination metadata
    const totalCount = await searchPersistence.getSearchCount(sessionId);

    // Get searches with pagination
    // Note: getRecentSearches returns most recent first, but doesn't support offset
    // We'll need to fetch all and slice, or add offset support to the service
    const allSearches = await searchPersistence.getRecentSearches(
      sessionId,
      limit + offset
    );
    const searches = allSearches.slice(offset, offset + limit);

    console.log(
      '[' + requestId + '] Fetched ' + searches.length + ' searches (total: ' + totalCount + ')'
    );

    return NextResponse.json({
      searches,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('[' + requestId + '] History API error:', error);

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Erro ao buscar historico de pesquisas",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
