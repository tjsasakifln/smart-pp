/**
 * Comparison API - Story 3.5
 *
 * POST /api/comparison
 * Compare 2-3 searches and return statistics with variations
 */

import { NextRequest, NextResponse } from "next/server";
import { comparisonService } from "@/services/comparisonService";
import type { ComparisonRequest, ComparisonError } from "@/types/comparison";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ComparisonRequest;
    const { searchIds } = body;

    // Validate input
    if (!Array.isArray(searchIds)) {
      const error: ComparisonError = {
        error: "searchIds must be an array",
        code: "INVALID_INPUT",
      };
      return NextResponse.json(error, { status: 400 });
    }

    if (searchIds.length < 2 || searchIds.length > 3) {
      const error: ComparisonError = {
        error: "Must provide 2-3 search IDs",
        code: "INVALID_INPUT",
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate that all IDs are strings
    if (!searchIds.every((id) => typeof id === "string" && id.length > 0)) {
      const error: ComparisonError = {
        error: "All search IDs must be non-empty strings",
        code: "INVALID_INPUT",
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Check for duplicates
    const uniqueIds = new Set(searchIds);
    if (uniqueIds.size !== searchIds.length) {
      const error: ComparisonError = {
        error: "Cannot compare the same search multiple times",
        code: "INVALID_INPUT",
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Perform comparison
    const comparison = await comparisonService.compareSearches(searchIds);

    return NextResponse.json(comparison, { status: 200 });
  } catch (error: any) {
    console.error("Comparison API error:", error);

    // Handle "not found" errors
    if (error.message?.includes("not found")) {
      const errorResponse: ComparisonError = {
        error: error.message,
        code: "NOT_FOUND",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Handle other errors
    const errorResponse: ComparisonError = {
      error: "Failed to compare searches",
      code: "SERVER_ERROR",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
