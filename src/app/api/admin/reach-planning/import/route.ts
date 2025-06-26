import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

// Field mapping for MediaSufficiency table
const FIELD_MAPPING = {
  'Last Update': 'lastUpdate',
  'Sub Region': 'subRegion', 
  'Country': 'country',
  'BU': 'bu',
  'Category': 'category',
  'Range': 'range',
  'Campaign': 'campaign',
  'Franchise NS (Actual or Projected)': 'franchiseNs',
  'Campaign Socio-Demo Target': 'campaignSocioDemoTarget',
  'Total Country Population On Target (Abs)': 'totalCountryPopulationOnTarget',
  'TV Copy Length': 'tvCopyLength',
  'TV Target Size (Abs)': 'tvTargetSize',
  'WOA Open TV': 'woaOpenTv',
  'WOA Paid TV': 'woaPaidTv',
  'Total TRPs': 'totalTrps',
  'TV R1+ (Total)': 'tvR1Plus',
  'TV R3+ (Total)': 'tvR3Plus',
  'TV IDEAL Reach': 'tvIdealReach',
  'CPP 2024': 'cpp2024',
  'CPP 2025': 'cpp2025',
  'Digital Target': 'digitalTarget',
  'Digital Target Size (Abs)': 'digitalTargetSize',
  'WOA PM & FF': 'woaPmFf',
  'WOA Influencers (Amplification)': 'woaInfluencersAmplification',
  'Digital R1+ (Total)': 'digitalR1Plus',
  'Digital IDEAL Reach': 'digitalIdealReach',
  'Planned Combined Reach': 'plannedCombinedReach',
  'Combined IDEAL Reach': 'combinedIdealReach',
  'Digital Reach Level Check': 'digitalReachLevelCheck',
  'TV Reach Level Check': 'tvReachLevelCheck',
  'Combined Reach Level Check': 'combinedReachLevelCheck'
};

function parseNumber(value: any): number | null {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

function transformRecord(record: any): any {
  const transformed: any = {};
  
  Object.entries(FIELD_MAPPING).forEach(([csvField, dbField]) => {
    const value = record[csvField];
    
    // Handle numeric fields
    if (['woaOpenTv', 'woaPaidTv', 'totalTrps', 'cpp2024', 'cpp2025', 'woaPmFf', 'woaInfluencersAmplification'].includes(dbField)) {
      transformed[dbField] = parseNumber(value);
    } else {
      // Handle string fields - convert empty strings to null
      transformed[dbField] = value && value.toString().trim() !== '' ? value.toString().trim() : null;
    }
  });
  
  return transformed;
}

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/admin/reach-planning/import');
  
  try {
    const { sessionId, uploadedBy } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Validate session ID format
    if (!sessionId.startsWith(SESSION_PREFIX)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }
    
    console.log(`Importing session: ${sessionId}`);
    
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    
    // Check if validation passed
    if (sessionData.validationSummary?.critical > 0) {
      return NextResponse.json({ 
        error: 'Cannot import data with critical validation errors',
        criticalIssues: sessionData.validationSummary.critical
      }, { status: 400 });
    }
    
    const records = sessionData.records || [];
    console.log(`Importing ${records.length} records to MediaSufficiency table`);
    
    const importResults = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Process records in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      for (const record of batch) {
        try {
          const transformedRecord = transformRecord(record);
          
          // Add metadata
          transformedRecord.uploadedBy = uploadedBy || 'system';
          transformedRecord.uploadSession = sessionId;
          
          const result = await prisma.mediaSufficiency.create({
            data: transformedRecord
          });
          
          importResults.push({
            rowIndex: successCount,
            status: 'success',
            id: result.id
          });
          
          successCount++;
        } catch (error: any) {
          console.error(`Error importing record ${i + successCount + errorCount}:`, error);
          importResults.push({
            rowIndex: i + successCount + errorCount,
            status: 'error',
            error: error.message
          });
          errorCount++;
        }
      }
    }
    
    // Update session with import results
    sessionData.importResults = {
      totalRecords: records.length,
      successCount,
      errorCount,
      importedAt: new Date().toISOString(),
      importedBy: uploadedBy || 'system'
    };
    sessionData.status = 'imported';
    
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
    
    console.log(`Import completed: ${successCount} success, ${errorCount} errors`);
    
    return NextResponse.json({
      success: true,
      sessionId,
      importResults: {
        totalRecords: records.length,
        successCount,
        errorCount,
        details: importResults.slice(0, 20) // Return first 20 for review
      }
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