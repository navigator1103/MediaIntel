import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Expected field mapping for SOV data
const SOV_FIELD_MAPPING = {
  'Brand': 'brand',
  'Category': 'category',
  'Company': 'company',
  'Indication': 'category', // For Eucerin sheets
  'TV Investment': 'tvInvestment',
  'Total TV Investment': 'tvInvestment',
  'TV TRPs': 'tvTrps',
  'Total TV TRPs': 'tvTrps',
  'Digital Investment': 'digitalInvestment',
  'Total Digital Investment': 'digitalInvestment',
  'Digital Impressions': 'digitalImpressions',
  'Total Digital Impressions': 'digitalImpressions'
};

function parseNumber(value: any): number | null {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

function processSOVData(records: any[], countryId: number): any[] {
  const processedRecords: any[] = [];
  
  console.log('Processing SOV data with', records.length, 'records');
  console.log('First record sample:', records[0]);
  
  records.forEach((record, index) => {
    console.log(`Processing record ${index}:`, record);
    
    // Skip header rows or empty rows
    if (!record.Company || record.Company === 'Company') {
      console.log(`Skipping record ${index} - no company or header row`);
      return;
    }
    
    const transformedRecord: any = {
      countryId,
      matPeriod: 'Last 12 months', // Default value
    };
    
    // Map fields - only process fields that exist in the CSV
    Object.entries(SOV_FIELD_MAPPING).forEach(([csvField, dbField]) => {
      const value = record[csvField];
      console.log(`Mapping ${csvField} -> ${dbField}:`, value);
      
      // Only map if the field exists in the CSV and we haven't already set this dbField
      if (value !== undefined && !transformedRecord.hasOwnProperty(dbField)) {
        if (['tvInvestment', 'tvTrps', 'digitalInvestment', 'digitalImpressions'].includes(dbField)) {
          transformedRecord[dbField] = parseNumber(value);
        } else {
          transformedRecord[dbField] = value && value.toString().trim() !== '' ? value.toString().trim() : null;
        }
      }
    });
    
    console.log('Transformed record:', transformedRecord);
    
    // Ensure required fields are present
    if (transformedRecord.brand && transformedRecord.category && transformedRecord.company) {
      console.log('Record passed validation, adding to processed records');
      processedRecords.push(transformedRecord);
    } else {
      console.log('Record failed validation:', {
        brand: transformedRecord.brand,
        category: transformedRecord.category,
        company: transformedRecord.company
      });
    }
  });
  
  console.log('Total processed records:', processedRecords.length);
  return processedRecords;
}

async function parseFile(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  const filename = file.name.toLowerCase();
  
  if (filename.endsWith('.csv')) {
    // Parse CSV
    const text = new TextDecoder().decode(buffer);
    console.log('CSV content:', text);
    
    const lines = text.split('\n').filter(line => line.trim() !== '');
    console.log('CSV lines:', lines);
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log('CSV headers:', headers);
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        console.log(`Row ${i} values:`, values);
        
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        console.log(`Row ${i} record:`, record);
        records.push(record);
      }
    }
    console.log('Total parsed records:', records.length);
    return records;
  } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    // Parse Excel
    const workbook = XLSX.read(buffer);
    let allRecords: any[] = [];
    
    // Process SOV sheets (Nivea and Eucerin)
    const sovSheets = workbook.SheetNames.filter(name => 
      name.toLowerCase().includes('sov') || 
      name.toLowerCase().includes('nivea') || 
      name.toLowerCase().includes('eucerin')
    );
    
    for (const sheetName of sovSheets) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find the header row (usually contains "Company" or "Brand")
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(5, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (row && (row.includes('Company') || row.includes('Brand') || row.includes('Category'))) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex >= 0) {
        const headers = jsonData[headerRowIndex] as string[];
        const brandName = sheetName.toLowerCase().includes('eucerin') ? 'Eucerin' : 'Nivea';
        
        // Convert to objects
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.some(cell => cell !== undefined && cell !== '')) {
            const record: any = { Brand: brandName }; // Add brand based on sheet name
            headers.forEach((header, index) => {
              if (header) {
                record[header] = row[index] || '';
              }
            });
            allRecords.push(record);
          }
        }
      }
    }
    
    return allRecords;
  } else {
    throw new Error('Unsupported file format');
  }
}

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/admin/sov/upload');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const countryId = formData.get('countryId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!countryId) {
      return NextResponse.json({ error: 'Country is required' }, { status: 400 });
    }
    
    console.log(`Processing SOV file: ${file.name}, Country ID: ${countryId}`);
    
    // Parse the file
    const records = await parseFile(file);
    console.log(`Parsed ${records.length} raw records`);
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid records found in file' }, { status: 400 });
    }
    
    // Process and transform the data
    const processedRecords = processSOVData(records, parseInt(countryId));
    console.log(`Processed ${processedRecords.length} valid records`);
    
    if (processedRecords.length === 0) {
      console.error('No processed records found. Raw records:', JSON.stringify(records, null, 2));
      console.error('Field mapping:', JSON.stringify(SOV_FIELD_MAPPING, null, 2));
      return NextResponse.json({ 
        error: 'No valid SOV records found after processing',
        debug: {
          rawRecordCount: records.length,
          firstRawRecord: records[0],
          fieldMapping: SOV_FIELD_MAPPING
        }
      }, { status: 400 });
    }
    
    // Import to database
    const importResults = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of processedRecords) {
      try {
        const result = await prisma.competitorShareOfVoice.create({
          data: record
        });
        
        importResults.push({
          status: 'success',
          id: result.id,
          brand: record.brand,
          company: record.company
        });
        successCount++;
      } catch (error: any) {
        console.error(`Error importing SOV record:`, error);
        importResults.push({
          status: 'error',
          error: error.message,
          record
        });
        errorCount++;
      }
    }
    
    console.log(`SOV import completed: ${successCount} success, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      totalRecords: processedRecords.length,
      importResults: {
        successCount,
        errorCount,
        totalRecords: processedRecords.length,
        details: importResults.slice(0, 10) // Return first 10 for review
      }
    });
    
  } catch (error: any) {
    console.error('SOV upload error:', error);
    return NextResponse.json({
      error: 'Failed to process SOV upload',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'SOV Upload API - Use POST to upload files',
    supportedFormats: ['CSV', 'Excel (.xlsx, .xls)'],
    expectedFields: Object.keys(SOV_FIELD_MAPPING)
  });
}