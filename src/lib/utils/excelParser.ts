import * as XLSX from 'xlsx';

interface ExcelParseOptions {
  sheetName?: string;
  fallbackToFirstSheet?: boolean;
}

interface ParsedData {
  records: any[];
  sheetUsed: string;
  availableSheets: string[];
}

/**
 * Format a Date object to DD-MMM-YYYY format (e.g., 31-Mar-2026)
 */
function formatExcelDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Parse Excel file and return data in same format as CSV parser
 * @param fileBuffer - Excel file buffer
 * @param options - Parsing options including target sheet name
 * @returns Parsed data with records array matching CSV parser output
 */
export function parseExcelFile(fileBuffer: Buffer, options: ExcelParseOptions = {}): ParsedData {
  const { sheetName, fallbackToFirstSheet = true } = options;

  try {
    // Read the workbook
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const availableSheets = workbook.SheetNames;

    if (availableSheets.length === 0) {
      throw new Error('No worksheets found in Excel file');
    }

    let targetSheetName: string | null = null;
    let worksheet: XLSX.WorkSheet | null = null;

    // Try to find the specific sheet by name
    if (sheetName) {
      const foundSheet = availableSheets.find(name => 
        name.toLowerCase().includes(sheetName.toLowerCase()) || 
        sheetName.toLowerCase().includes(name.toLowerCase())
      );
      
      if (foundSheet) {
        targetSheetName = foundSheet;
        worksheet = workbook.Sheets[foundSheet];
      }
    }

    // Fallback to first sheet if target sheet not found
    if (!worksheet && fallbackToFirstSheet) {
      targetSheetName = availableSheets[0];
      worksheet = workbook.Sheets[targetSheetName];
    }

    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${availableSheets.join(', ')}`);
    }

    // Convert worksheet to JSON with formatted values (good for dates)
    const formattedData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use first row as headers
      defval: '', // Default value for empty cells
      raw: false, // Use formatted values for dates
      dateNF: 'dd-mmm-yyyy' // Format dates as DD-MMM-YYYY
    });

    // Convert worksheet to JSON with raw values (good for budget precision)
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use first row as headers
      defval: '', // Default value for empty cells
      raw: true // Keep raw numeric values for budget fields
    });

    if (formattedData.length === 0) {
      throw new Error('No data found in worksheet');
    }

    // Get headers from first row
    const headers = formattedData[0] as string[];
    if (!headers || headers.length === 0) {
      throw new Error('No headers found in first row');
    }

    // Identify budget/numeric fields that need precision preservation
    const budgetFields = headers.filter(header => {
      const trimmedHeader = header.trim();
      return trimmedHeader === 'Total Budget' ||
             trimmedHeader === 'Jan' || trimmedHeader === 'Feb' || trimmedHeader === 'Mar' ||
             trimmedHeader === 'Apr' || trimmedHeader === 'May' || trimmedHeader === 'Jun' ||
             trimmedHeader === 'Jul' || trimmedHeader === 'Aug' || trimmedHeader === 'Sep' ||
             trimmedHeader === 'Oct' || trimmedHeader === 'Nov' || trimmedHeader === 'Dec';
    });

    console.log(`Identified ${budgetFields.length} budget fields for precision preservation:`, budgetFields);

    // Convert to array of objects (same format as CSV parser)
    const records: any[] = [];
    for (let i = 1; i < formattedData.length; i++) {
      const formattedRow = formattedData[i] as any[];
      const rawRow = rawData[i] as any[];
      if (!formattedRow || formattedRow.length === 0) continue; // Skip empty rows
      
      const record: any = {};
      headers.forEach((header, index) => {
        // Use formatted value by default, raw value for budget fields
        const cellValue = budgetFields.includes(header) ? rawRow[index] : formattedRow[index];
        
        // Handle different data types
        if (cellValue === null || cellValue === undefined) {
          record[header] = '';
        } else if (typeof cellValue === 'number' && budgetFields.includes(header)) {
          // For budget fields, preserve full precision using raw values
          record[header] = cellValue.toFixed(10).replace(/\.?0+$/, '');
        } else if (typeof cellValue === 'number') {
          // Regular number conversion
          record[header] = cellValue.toString();
        } else {
          // For dates and other fields, use formatted values and convert to string
          record[header] = String(cellValue).trim();
        }
      });
      
      // Only add records that have at least one non-empty value
      const hasData = Object.values(record).some(value => value !== '');
      if (hasData) {
        records.push(record);
      }
    }

    return {
      records,
      sheetUsed: targetSheetName,
      availableSheets
    };

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse Excel file: Unknown error');
  }
}

/**
 * Parse Excel file for Game Plans upload
 * Looks for "NIVEA Game Plan Table" sheet
 */
export function parseGamePlansExcel(fileBuffer: Buffer): ParsedData {
  return parseExcelFile(fileBuffer, {
    sheetName: 'NIVEA Game Plan Table',
    fallbackToFirstSheet: true
  });
}

/**
 * Parse Excel file for Reach Planning upload  
 * Looks for "NIVEA Reach Sufficiency Table" sheet
 */
export function parseReachPlanningExcel(fileBuffer: Buffer): ParsedData {
  return parseExcelFile(fileBuffer, {
    sheetName: 'NIVEA Reach Sufficiency Table',
    fallbackToFirstSheet: true
  });
}

/**
 * Check if file is Excel format by extension
 */
export function isExcelFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');
}

/**
 * Check if file is CSV format by extension
 */
export function isCsvFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.csv');
}