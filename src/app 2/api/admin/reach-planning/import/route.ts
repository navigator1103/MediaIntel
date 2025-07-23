import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

// Field mapping for MediaSufficiency table - supports both template format and actual CSV format
const FIELD_MAPPING = {
  'Last Update': 'lastUpdate',
  'Sub Region': 'subRegion', 
  'Country': 'country',
  'BU': 'bu',
  'Category': 'category',
  'Range': 'range',
  'Campaign': 'campaign',
  'Franchise NS (Actual or Projected)': 'franchiseNs',
  'Franchise NS': 'franchiseNs', // Support actual CSV header
  'Campaign Socio-Demo Target': 'campaignSocioDemoTarget',
  'Total Country Population On Target (Abs)': 'totalCountryPopulationOnTarget',
  'Total Country Population On Target': 'totalCountryPopulationOnTarget', // Support actual CSV header
  'TV Copy Length': 'tvCopyLength',
  'TV Target Size (Abs)': 'tvTargetSize',
  'TV Target Size': 'tvTargetSize', // Support actual CSV header
  'WOA Open TV': 'woaOpenTv',
  'WOA Paid TV': 'woaPaidTv',
  'Total TRPs': 'totalTrps',
  'TV R1+ (Total)': 'tvR1Plus',
  'TV R1+': 'tvR1Plus', // Support actual CSV header
  'TV R3+ (Total)': 'tvR3Plus',
  'TV R3+': 'tvR3Plus', // Support actual CSV header
  'TV IDEAL Reach': 'tvIdealReach',
  'TV Ideal Reach': 'tvIdealReach', // Support actual CSV header
  'CPP 2024': 'cpp2024',
  'CPP 2025': 'cpp2025',
  'Digital Target': 'digitalTarget',
  'Digital Target Size (Abs)': 'digitalTargetSize',
  'Digital Target Size': 'digitalTargetSize', // Support actual CSV header
  'WOA PM & FF': 'woaPmFf',
  'WOA PM FF': 'woaPmFf', // Support actual CSV header
  'WOA Influencers (Amplification)': 'woaInfluencersAmplification',
  'WOA Influencers Amplification': 'woaInfluencersAmplification', // Support actual CSV header
  'Digital R1+ (Total)': 'digitalR1Plus',
  'Digital R1+': 'digitalR1Plus', // Support actual CSV header
  'Digital IDEAL Reach': 'digitalIdealReach',
  'Digital Ideal Reach': 'digitalIdealReach', // Support actual CSV header
  'Planned Combined Reach': 'plannedCombinedReach',
  'Combined IDEAL Reach': 'combinedIdealReach',
  'Combined Ideal Reach': 'combinedIdealReach', // Support actual CSV header
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

async function transformRecord(record: any, sessionData: any): Promise<any> {
  const transformed: any = {};
  
  // Get the lastUpdateId and countryId from session data
  const lastUpdateId = sessionData.lastUpdateId;
  const countryId = sessionData.countryId;
  
  // Set the IDs directly
  transformed.lastUpdateId = lastUpdateId;
  transformed.countryId = countryId;
  
  // Look up sub region by name (case-insensitive using contains)
  if (record['Sub Region']) {
    const subRegion = await prisma.subRegion.findFirst({
      where: {
        name: {
          contains: record['Sub Region'],
        }
      }
    });
    transformed.subRegionId = subRegion?.id || null;
    transformed.subRegion = record['Sub Region']; // Keep the text value too
  }
  
  // Look up category by name (case-insensitive using contains)
  if (record['Category']) {
    const category = await prisma.category.findFirst({
      where: {
        name: {
          contains: record['Category'],
        }
      }
    });
    transformed.categoryId = category?.id || null;
    transformed.category = record['Category'];
  }
  
  // Look up range by name (case-insensitive using contains)
  if (record['Range']) {
    const range = await prisma.range.findFirst({
      where: {
        name: {
          contains: record['Range'],
        }
      }
    });
    transformed.rangeId = range?.id || null;
    transformed.range = record['Range'];
  }
  
  // Look up campaign by name (case-insensitive using contains)
  if (record['Campaign']) {
    const campaign = await prisma.campaign.findFirst({
      where: {
        name: {
          contains: record['Campaign'],
        }
      }
    });
    transformed.campaignId = campaign?.id || null;
    transformed.campaign = record['Campaign'];
  }
  
  // Look up BU by name (case-insensitive using contains)
  if (record['BU']) {
    const bu = await prisma.businessUnit.findFirst({
      where: {
        name: {
          contains: record['BU'],
        }
      }
    });
    transformed.buId = bu?.id || null;
    transformed.bu = record['BU'];
  }
  
  // Map other fields
  Object.entries(FIELD_MAPPING).forEach(([csvField, dbField]) => {
    // Skip fields we've already handled
    if (['lastUpdate', 'subRegion', 'country', 'category', 'range', 'campaign', 'bu'].includes(dbField)) {
      return;
    }
    
    const value = record[csvField];
    
    // Handle numeric fields
    if (['woaOpenTv', 'woaPaidTv', 'totalTrps', 'cpp2024', 'cpp2025', 'woaPmFf', 'woaInfluencersAmplification'].includes(dbField)) {
      transformed[dbField] = parseNumber(value);
    } else {
      // Handle string fields - convert empty strings to null
      transformed[dbField] = value && value.toString().trim() !== '' ? value.toString().trim() : null;
    }
  });
  
  // Handle percentage fields that should remain as strings (keep the % symbol)
  // All percentage fields in MediaSufficiency schema are defined as String
  const stringPercentageFields = ['tvR1Plus', 'tvR3Plus', 'tvIdealReach', 'digitalR1Plus', 
                                  'digitalIdealReach', 'plannedCombinedReach', 'combinedIdealReach',
                                  'digitalReachLevelCheck', 'tvReachLevelCheck', 'combinedReachLevelCheck'];
  
  stringPercentageFields.forEach(field => {
    const csvField = Object.entries(FIELD_MAPPING).find(([_, dbField]) => dbField === field)?.[0];
    if (csvField && record[csvField]) {
      // Keep as string with % symbol
      transformed[field] = record[csvField].toString();
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
          const transformedRecord = await transformRecord(record, sessionData);
          
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