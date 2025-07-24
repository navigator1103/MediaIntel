import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'sov-';

// Field mapping for ShareOfVoice table - supports both TV and Digital SOV
const FIELD_MAPPING = {
  'Category': 'category',
  'Company': 'company',
  'Total TV Investment': 'totalTvInvestment',
  'Total TV TRPs': 'totalTvTrps',
  'Total Digital Spend': 'totalTvInvestment', // Map to same field as TV Investment
  'Total Digital Impressions': 'totalTvTrps' // Map to same field as TV TRPs
};

function parseNumber(value: any): number | null {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

async function transformRecord(record: any, sessionData: any): Promise<any> {
  const transformed: any = {};
  
  // Set the IDs from session data
  transformed.countryId = sessionData.countryId;
  transformed.businessUnitId = sessionData.businessUnitId;
  
  console.log('Transforming record:', record); // Debug log
  
  // Map CSV fields to database fields
  for (const [csvField, dbField] of Object.entries(FIELD_MAPPING)) {
    const value = record[csvField];
    console.log(`Mapping ${csvField} -> ${dbField}:`, value); // Debug log
    
    if (dbField === 'totalTvInvestment' || dbField === 'totalTvTrps') {
      // Parse numeric fields
      const parsed = parseNumber(value);
      console.log(`Parsed ${csvField}:`, value, '->', parsed); // Debug log
      transformed[dbField] = parsed;
    } else {
      // String fields
      transformed[dbField] = value || null;
    }
  }
  
  // Add system fields
  transformed.uploadedBy = 'admin'; // This should come from user context
  transformed.uploadSession = sessionData.sessionId;
  
  console.log('Transformed record:', transformed); // Debug log
  return transformed;
}

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/admin/share-of-voice/import');
  
  try {
    const { sessionId, uploadedBy } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    if (!sessionId.startsWith(SESSION_PREFIX)) {
      return NextResponse.json({ error: 'Invalid SOV session ID' }, { status: 400 });
    }
    
    // Load session data
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    
    // Check if validation passed
    if (!sessionData.canImport) {
      return NextResponse.json({ 
        error: 'Cannot import data with validation errors. Please fix critical issues first.' 
      }, { status: 400 });
    }
    
    console.log('Starting import for session:', sessionId);
    
    // Get all records for import
    const allRecordsFile = path.join(SESSIONS_DIR, `${sessionId}-full-records.json`);
    let allRecords = sessionData.records;
    
    if (fs.existsSync(allRecordsFile)) {
      const fullData = JSON.parse(fs.readFileSync(allRecordsFile, 'utf8'));
      allRecords = fullData.records || sessionData.records;
    }
    
    console.log(`Importing ${allRecords.length} records...`);
    
    // Clear existing data for this country/business unit combination
    console.log('Clearing existing SOV data for country/business unit...');
    const deleteResult = await prisma.shareOfVoice.deleteMany({
      where: {
        countryId: sessionData.countryId,
        businessUnitId: sessionData.businessUnitId
      }
    });
    console.log(`Deleted ${deleteResult.count} existing records`);
    
    // Transform and import records
    const transformedRecords = [];
    
    for (let i = 0; i < allRecords.length; i++) {
      const record = allRecords[i];
      try {
        const transformed = await transformRecord(record, sessionData);
        transformedRecords.push(transformed);
      } catch (error) {
        console.error(`Error transforming record ${i}:`, error);
        return NextResponse.json({
          error: `Failed to transform record ${i + 1}`,
          details: error.message
        }, { status: 500 });
      }
    }
    
    console.log(`Inserting ${transformedRecords.length} transformed records...`);
    
    // Import in batches of 100
    const batchSize = 100;
    let importedCount = 0;
    
    for (let i = 0; i < transformedRecords.length; i += batchSize) {
      const batch = transformedRecords.slice(i, i + batchSize);
      
      try {
        console.log(`Attempting to import batch ${i / batchSize + 1}:`, batch.slice(0, 2)); // Log first 2 records for debugging
        await prisma.shareOfVoice.createMany({
          data: batch
        });
        importedCount += batch.length;
        console.log(`Imported batch: ${importedCount}/${transformedRecords.length}`);
      } catch (error) {
        console.error(`Error importing batch starting at ${i}:`, error);
        console.error(`Problematic batch data:`, JSON.stringify(batch, null, 2));
        return NextResponse.json({
          error: `Failed to import batch starting at record ${i + 1}`,
          details: error.message
        }, { status: 500 });
      }
    }
    
    // Update session status
    const finalSessionData = {
      ...sessionData,
      status: 'imported',
      importedAt: new Date().toISOString(),
      importedRecords: importedCount,
      uploadedBy: uploadedBy || 'admin'
    };
    
    fs.writeFileSync(sessionFile, JSON.stringify(finalSessionData, null, 2));
    
    console.log(`Import completed: ${importedCount} records imported successfully`);
    
    return NextResponse.json({
      success: true,
      importedRecords: importedCount,
      totalRecords: allRecords.length,
      sessionId,
      message: `Successfully imported ${importedCount} Share of Voice records`
    });
    
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({
      error: 'Failed to import data',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}