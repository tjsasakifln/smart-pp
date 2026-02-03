// Excel Export API Route - Licita Precos
// POST /api/export/excel

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateExcel, generateExcelFilename } from '../../../../services/export/excelService';
import type { PriceResult, SearchStats } from '../../../../types/search';

const prisma = new PrismaClient();

interface ExcelExportRequest {
  searchId: string;
  includeStats?: boolean;
  filteredOnly?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExcelExportRequest = await request.json();

    // Validate request
    if (!body.searchId) {
      return NextResponse.json(
        { error: 'searchId is required', message: 'ID da pesquisa nao fornecido' },
        { status: 400 }
      );
    }

    // Fetch search from database with results
    const search = await prisma.search.findUnique({
      where: { id: body.searchId },
      include: {
        results: {
          orderBy: { quotationDate: 'desc' },
        },
      },
    });

    if (!search) {
      return NextResponse.json(
        { error: 'Search not found', message: 'Pesquisa nao encontrada' },
        { status: 404 }
      );
    }

    // Convert results to PriceResult format
    const results: PriceResult[] = search.results.map((result) => ({
      id: result.id,
      description: result.description,
      price: Number(result.price),
      unit: result.unit,
      source: result.source,
      sourceUrl: result.sourceUrl,
      quotationDate: result.quotationDate.toISOString(),
      organ: result.organ || undefined,
    }));

    if (results.length === 0) {
      return NextResponse.json(
        {
          error: 'No results',
          message: 'Nenhum resultado disponivel para exportacao',
        },
        { status: 400 }
      );
    }

    // Calculate statistics
    const prices = results.map((r) => r.price).filter((p) => p > 0);

    if (prices.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid prices',
          message: 'Nenhum preco valido encontrado',
        },
        { status: 400 }
      );
    }

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const stats: SearchStats = {
      count: results.length,
      average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      median:
        sortedPrices.length % 2 === 0
          ? (sortedPrices[sortedPrices.length / 2 - 1] +
              sortedPrices[sortedPrices.length / 2]) /
            2
          : sortedPrices[Math.floor(sortedPrices.length / 2)],
      min: sortedPrices[0],
      max: sortedPrices[sortedPrices.length - 1],
    };

    // Generate Excel file
    const buffer = await generateExcel(search.term, results, stats);

    // Generate filename
    const filename = generateExcelFilename(search.term);

    // Return file as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error generating Excel export:', error);

    return NextResponse.json(
      {
        error: 'Export failed',
        message:
          error instanceof Error
            ? error.message
            : 'Erro ao gerar planilha Excel',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
