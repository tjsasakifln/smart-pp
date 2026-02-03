// Excel Service - Licita Precos
// Generates Excel spreadsheets with ExcelJS

import * as ExcelJS from 'exceljs';
import type { PriceResult, SearchStats } from '../../types/search';

interface ExcelGenerationOptions {
  term: string;
  results: PriceResult[];
  stats: SearchStats;
}

/**
 * Generate an Excel file from search results
 * @param term Search term
 * @param results Array of price results
 * @param stats Search statistics
 * @returns Excel file as Buffer
 */
export async function generateExcel(
  term: string,
  results: PriceResult[],
  stats: SearchStats
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Licita Precos';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Pesquisa de Precos', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });

  // Header Section
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'PESQUISA DE PRECOS';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }, // Blue
  };
  titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).height = 30;

  // Search Info Section
  sheet.getCell('A3').value = 'Termo pesquisado:';
  sheet.getCell('A3').font = { bold: true };
  sheet.getCell('B3').value = term;

  sheet.getCell('A4').value = 'Data da pesquisa:';
  sheet.getCell('A4').font = { bold: true };
  sheet.getCell('B4').value = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Statistics Section
  sheet.getCell('A6').value = 'ESTATISTICAS';
  sheet.getCell('A6').font = { bold: true, size: 12 };
  sheet.getCell('A6').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }, // Gray-200
  };

  sheet.mergeCells('A6:B6');

  const statsData: [string, string][] = [
    ['Quantidade de resultados', stats.count.toString()],
    ['Media', formatCurrency(stats.average)],
    ['Mediana', formatCurrency(stats.median)],
    ['Menor valor', formatCurrency(stats.min)],
    ['Maior valor', formatCurrency(stats.max)],
  ];

  statsData.forEach((row, index) => {
    const rowNumber = 7 + index;
    sheet.getCell(rowNumber, 1).value = row[0];
    sheet.getCell(rowNumber, 1).font = { bold: true };
    sheet.getCell(rowNumber, 2).value = row[1];
  });

  // Results Table
  const tableStartRow = 14;

  // Table Headers
  const headers = ['Descricao', 'Preco', 'Unidade', 'Fonte', 'Data', 'Link'];
  const headerRow = sheet.getRow(tableStartRow);

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6B7280' }, // Gray-500
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
  });

  headerRow.height = 25;

  // Data Rows
  results.forEach((result, rowIndex) => {
    const rowNumber = tableStartRow + 1 + rowIndex;
    const row = sheet.getRow(rowNumber);

    // Description
    const descCell = row.getCell(1);
    descCell.value = result.description;
    descCell.alignment = { wrapText: true, vertical: 'top' };

    // Price
    const priceCell = row.getCell(2);
    priceCell.value = result.price;
    priceCell.numFmt = 'R$ #,##0.00';
    priceCell.alignment = { horizontal: 'right' };

    // Unit
    const unitCell = row.getCell(3);
    unitCell.value = result.unit;
    unitCell.alignment = { horizontal: 'center' };

    // Source
    const sourceCell = row.getCell(4);
    sourceCell.value = result.source;

    // Date
    const dateCell = row.getCell(5);
    const quotationDate = new Date(result.quotationDate);
    dateCell.value = quotationDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    dateCell.alignment = { horizontal: 'center' };

    // Link (Hyperlink)
    const linkCell = row.getCell(6);
    linkCell.value = {
      text: 'Abrir fonte',
      hyperlink: result.sourceUrl,
    };
    linkCell.font = {
      color: { argb: 'FF2563EB' }, // Blue
      underline: true
    };
    linkCell.alignment = { horizontal: 'center' };

    // Row styling
    row.height = 30;

    // Alternate row coloring
    if (rowIndex % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 6) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }, // Gray-50
          };
        }
      });
    }

    // Add borders
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 6) {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      }
    });
  });

  // Auto-fit columns
  sheet.columns = [
    { width: 50 }, // Description
    { width: 15 }, // Price
    { width: 12 }, // Unit
    { width: 25 }, // Source
    { width: 12 }, // Date
    { width: 15 }, // Link
  ];

  // Footer
  const footerRow = tableStartRow + results.length + 2;
  sheet.getCell(footerRow, 1).value =
    `Gerado pelo sistema Licita Precos em ${new Date().toLocaleString('pt-BR')}`;
  sheet.getCell(footerRow, 1).font = { italic: true, size: 9 };
  sheet.getCell(footerRow, 1).alignment = { horizontal: 'left' };
  sheet.mergeCells(footerRow, 1, footerRow, 6);

  // Generate buffer
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Generate filename for the Excel export
 * @param term Search term
 * @returns Filename string
 */
export function generateExcelFilename(term: string): string {
  const date = new Date().toISOString().split('T')[0];
  const normalizedTerm = term
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  return `pesquisa-precos-${normalizedTerm}-${date}.xlsx`;
}

/**
 * Format number as Brazilian Real currency
 * @param value Number to format
 * @returns Formatted currency string
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
