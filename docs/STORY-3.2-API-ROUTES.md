# Story 3.2 - History API Routes Documentation

## Overview

REST API endpoints for managing search history with full CRUD operations and session isolation.

## Endpoints

### GET /api/history

**Description**: List all searches with pagination support.

**Headers**:
- x-session-id (optional): Filter searches by session

**Query Parameters**:
- limit (number, optional): Results per page (default: 20, max: 100)
- offset (number, optional): Pagination offset (default: 0)

**Response**: Returns array of search summaries with pagination metadata.

### GET /api/history/[id]

**Description**: Get a specific search with all results.

**Parameters**:
- id (path): Search ID

**Response**: Returns complete search record with all SearchResult records.

### DELETE /api/history/[id]

**Description**: Delete a search and all its results (cascade).

**Parameters**:
- id (path): Search ID

**Response**: Returns success message.

### PUT /api/history/[id]/refetch

**Description**: Re-execute a search with original parameters. Creates a new search record.

**Parameters**:
- id (path): Original search ID

**Response**: Returns new search ID and result count.

## Error Responses

- 404 Not Found: Search not found
- 500 Internal Error: Server error

## Session Isolation

All endpoints support session-based isolation via the x-session-id header.
Searches are filtered by session to maintain privacy and multi-user support.

## Implementation Notes

- FIFO cleanup keeps only the last 100 searches per session
- Results are ordered by price (ascending) by default
- DELETE cascades to all related SearchResult records
- Refetch creates a new search instead of updating

## Files Created

- app/src/app/api/history/route.ts - List searches (GET)
- app/src/app/api/history/[id]/route.ts - Get/Delete single search (GET, DELETE)
- app/src/app/api/history/[id]/refetch/route.ts - Refetch search (PUT)
- app/src/test/historyApi.test.ts - Unit tests
