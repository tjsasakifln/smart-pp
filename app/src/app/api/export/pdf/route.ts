/**
 * PDF Export API Endpoint
 *
 * POST /api/export/pdf
 * Generates and downloads a PDF report for a search
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateOfficialReport,
  generatePDFFilename,
} from '@/services/reports/pdfGenerator';
import { searchPersistence } from '@/services/search/searchPersistence';
import type { ReportConfig } from '@/types/report';

export const runtime = 'nodejs';

interface ExportPDFRequest {
  searchId: string;
  config?: ReportConfig;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportPDFRequest = await request.json();

    if (!body.searchId) {
      return NextResponse.json(
        { error: 'searchId is required' },
        { status: 400 }
      );
    }

    // Verify search exists
    const search = await searchPersistence.getSearchById(body.searchId);
    if (!search) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = await generateOfficialReport(body.searchId, body.config);

    // Generate filename
    const filename = generatePDFFilename(search.term);

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[API] Error generating PDF:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
