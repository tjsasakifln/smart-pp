-- Add composite indexes to Search table for optimized queries
CREATE INDEX "Search_sessionId_createdAt_idx" ON "Search"("sessionId", "createdAt" DESC);
CREATE INDEX "Search_createdAt_sessionId_idx" ON "Search"("createdAt" DESC, "sessionId");

-- Add indexes to SearchResult table for optimized filtering and sorting
CREATE INDEX "SearchResult_searchId_price_idx" ON "SearchResult"("searchId", "price" ASC);
CREATE INDEX "SearchResult_searchId_createdAt_idx" ON "SearchResult"("searchId", "createdAt" DESC);
CREATE INDEX "SearchResult_source_idx" ON "SearchResult"("source");

-- Add indexes to Report table for optimized retrieval
CREATE INDEX "Report_generatedAt_idx" ON "Report"("generatedAt" DESC);
CREATE INDEX "Report_searchId_generatedAt_idx" ON "Report"("searchId", "generatedAt" DESC);
