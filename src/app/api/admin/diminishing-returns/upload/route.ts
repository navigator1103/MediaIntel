import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Expected field mapping for Diminishing Returns data
const DIMINISHING_RETURNS_FIELD_MAPPING = {
  'Gender': 'gender',
  'Min. Age': 'minAge',
  'Min Age': 'minAge',
  'MIN. AGE': 'minAge',
  'Max. Age': 'maxAge',
  'Max Age': 'maxAge',
  'MAX. AGE': 'maxAge',
  'SEL': 'sel',
  'Final': 'finalTarget',
  'Final Target': 'finalTarget',
  'FINAL': 'finalTarget',
  'Sat Point': 'saturationPoint',
  'Saturation Point': 'saturationPoint',
  'TRPs': 'inputValue',
  'TRPS': 'inputValue',
  'Budget': 'inputValue',
  'R1+': 'reach1Plus',
  'Reach': 'reach1Plus',
  'Frequency': 'frequency'
};

function parseNumber(value: any): number | null {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

function processDiminishingReturnsData(records: any[], countryId: number, mediaType: string): any[] {
  const processedRecords: any[] = [];
  
  // Determine input type based on media type
  const inputType = mediaType === 'TV' ? 'TRP' : 'Budget';
  
  records.forEach((record, index) => {
    // Skip header rows or empty rows
    if (!record.Gender || record.Gender === 'Gender' || record.Gender === 'GENDER') {
      return;
    }
    
    const transformedRecord: any = {
      countryId,
      mediaType,
      inputType,
    };
    
    // Map fields - only process fields that exist in the CSV
    Object.entries(DIMINISHING_RETURNS_FIELD_MAPPING).forEach(([csvField, dbField]) => {
      const value = record[csvField];
      
      // Only map if the field exists in the CSV and we haven't already set this dbField
      if (value !== undefined && !transformedRecord.hasOwnProperty(dbField)) {
        if (['minAge', 'maxAge', 'saturationPoint', 'inputValue', 'reach1Plus', 'frequency'].includes(dbField)) {
          transformedRecord[dbField] = parseNumber(value);
        } else {
          transformedRecord[dbField] = value && value.toString().trim() !== '' ? value.toString().trim() : null;
        }
      }
    });
    
    // Ensure required fields are present
    if (transformedRecord.gender && 
        transformedRecord.minAge !== null && 
        transformedRecord.maxAge !== null &&
        transformedRecord.saturationPoint !== null &&
        transformedRecord.inputValue !== null &&
        transformedRecord.reach1Plus !== null) {
      
      // Generate final target if not provided
      if (!transformedRecord.finalTarget) {
        transformedRecord.finalTarget = `${transformedRecord.gender} ${transformedRecord.minAge}-${transformedRecord.maxAge}`;
      }
      
      processedRecords.push(transformedRecord);
    }
  });
  
  return processedRecords;
}

async function parseFile(file: File, mediaType: string): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  const filename = file.name.toLowerCase();
  
  if (filename.endsWith('.csv')) {
    // Parse CSV
    const text = new TextDecoder().decode(buffer);
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        records.push(record);
      }
    }
    return records;
  } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    // Parse Excel
    const workbook = XLSX.read(buffer);
    let allRecords: any[] = [];
    
    // Find the appropriate diminishing returns sheet
    const targetSheets = workbook.SheetNames.filter(name => {
      const nameLower = name.toLowerCase();
      return nameLower.includes('diminishing') && 
             (mediaType === 'Combined' || nameLower.includes(mediaType.toLowerCase()));
    });
    
    for (const sheetName of targetSheets) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find the header row (usually contains "GENDER" or "Gender")
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i] as any[];
        if (row && row.some(cell => 
          cell && cell.toString().toLowerCase().includes('gender'))) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex >= 0) {
        const headers = jsonData[headerRowIndex] as string[];
        
        // Convert to objects, starting from the data rows
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (row && row.some(cell => cell !== undefined && cell !== '')) {
            const record: any = {};
            headers.forEach((header, index) => {
              if (header && header.toString().trim()) {
                record[header.toString().trim()] = row[index] || '';
              }
            });
            
            // Only add records that have gender data
            if (record.Gender || record.GENDER) {
              allRecords.push(record);
            }
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
  console.log('POST request received at /api/admin/diminishing-returns/upload');
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const countryId = formData.get('countryId') as string;
    const mediaType = formData.get('mediaType') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!countryId) {
      return NextResponse.json({ error: 'Country is required' }, { status: 400 });
    }
    
    if (!mediaType || !['TV', 'Digital', 'Combined'].includes(mediaType)) {
      return NextResponse.json({ error: 'Valid media type is required (TV, Digital, or Combined)' }, { status: 400 });
    }
    
    console.log(`Processing Diminishing Returns file: ${file.name}, Media Type: ${mediaType}, Country ID: ${countryId}`);
    
    // Parse the file
    const records = await parseFile(file, mediaType);
    console.log(`Parsed ${records.length} raw records`);
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'No valid records found in file' }, { status: 400 });
    }
    
    // Process and transform the data
    const processedRecords = processDiminishingReturnsData(records, parseInt(countryId), mediaType);
    console.log(`Processed ${processedRecords.length} valid records`);
    
    if (processedRecords.length === 0) {
      return NextResponse.json({ error: 'No valid diminishing returns records found after processing' }, { status: 400 });
    }
    
    // Import to database
    const importResults = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const record of processedRecords) {
      try {
        const result = await prisma.mediaDiminishingReturns.create({
          data: record
        });
        
        importResults.push({
          status: 'success',
          id: result.id,
          mediaType: record.mediaType,
          finalTarget: record.finalTarget
        });
        successCount++;
      } catch (error: any) {
        console.error(`Error importing diminishing returns record:`, error);
        importResults.push({
          status: 'error',
          error: error.message,
          record
        });
        errorCount++;
      }
    }
    
    console.log(`Diminishing Returns import completed: ${successCount} success, ${errorCount} errors`);
    
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
    console.error('Diminishing Returns upload error:', error);
    return NextResponse.json({
      error: 'Failed to process Diminishing Returns upload',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Diminishing Returns Upload API - Use POST to upload files',
    supportedFormats: ['CSV', 'Excel (.xlsx, .xls)'],
    supportedMediaTypes: ['TV', 'Digital', 'Combined'],
    expectedFields: Object.keys(DIMINISHING_RETURNS_FIELD_MAPPING)
  });
}