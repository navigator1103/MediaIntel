import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

// Field mapping for MediaSufficiency table - supports both template format and actual CSV format
// Note: Last Update, Sub Region, Country, and BU are auto-populated during import, not from CSV
const FIELD_MAPPING = {
  'Category': 'category',
  'Range': 'range',
  'Campaign': 'campaign',
  // TV Demographics & Targeting
  'TV Demo Gender': 'tvDemoGender',
  'TV Demo Min. Age': 'tvDemoMinAge',
  'TV Demo Max. Age': 'tvDemoMaxAge',
  'TV SEL': 'tvSel',
  'Final TV Target (don\'t fill)': 'finalTvTarget',
  'TV Target Size': 'tvTargetSize',
  'TV Copy Length': 'tvCopyLength',
  // TV Performance Metrics
  'Total TV Planned R1+ (%)': 'tvPlannedR1Plus',
  'Total TV Planned R3+ (%)': 'tvPlannedR3Plus',
  'TV Potential R1+': 'tvPotentialR1Plus',
  'CPP 2024': 'cpp2024',
  'CPP 2025': 'cpp2025',
  'CPP 2026': 'cpp2026',
  'Reported Currency': 'reportedCurrency',
  // Digital Demographics & Targeting
  'Is Digital target the same than TV?': 'isDigitalTargetSameAsTv',
  'Digital Demo Gender': 'digitalDemoGender',
  'Digital Demo Min. Age': 'digitalDemoMinAge',
  'Digital Demo Max. Age': 'digitalDemoMaxAge',
  'Digital SEL': 'digitalSel',
  'Final Digital Target (don\'t fill)': 'finalDigitalTarget',
  'Digital Target Size (Abs)': 'digitalTargetSizeAbs',
  // Digital Performance Metrics
  'Total Digital Planned R1+': 'digitalPlannedR1Plus',
  'Total Digital Potential R1+': 'digitalPotentialR1Plus',
  // Combined Metrics
  'Planned Combined Reach': 'plannedCombinedReach',
  'Combined Potential Reach': 'combinedPotentialReach'
};

function parseNumber(value: any): number | null {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  
  if (typeof value === 'number') return value;
  
  const parsed = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

function parseBoolean(value: any): boolean | null {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  
  if (typeof value === 'boolean') return value;
  
  const stringValue = value.toString().toLowerCase().trim();
  if (stringValue === 'yes' || stringValue === 'true' || stringValue === '1') return true;
  if (stringValue === 'no' || stringValue === 'false' || stringValue === '0') return false;
  
  return null;
}

async function transformRecord(record: any, sessionData: any): Promise<any> {
  const transformed: any = {};
  
  // Get the lastUpdateId and countryId from session data
  const lastUpdateId = sessionData.lastUpdateId;
  const countryId = sessionData.countryId;
  
  // Set the IDs directly
  transformed.lastUpdateId = lastUpdateId;
  transformed.countryId = countryId;
  
  // Look up and set the actual string values
  if (lastUpdateId) {
    const lastUpdate = await prisma.lastUpdate.findUnique({
      where: { id: lastUpdateId }
    });
    transformed.lastUpdate = lastUpdate?.name || null;
  }
  
  if (countryId) {
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    });
    transformed.country = country?.name || null;
  }
  
  // Auto-populate sub region from country relationship
  if (countryId) {
    const countryWithRegion = await prisma.country.findUnique({
      where: { id: countryId },
      include: { subRegion: true }
    });
    if (countryWithRegion?.subRegion) {
      transformed.subRegionId = countryWithRegion.subRegion.id;
      transformed.subRegion = countryWithRegion.subRegion.name;
    }
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
  
  // Set business unit from session data
  const businessUnitId = sessionData.businessUnitId;
  transformed.buId = businessUnitId;
  
  // Look up business unit name
  if (businessUnitId) {
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId }
    });
    transformed.bu = businessUnit?.name || null;
  } else {
    transformed.bu = null;
  }
  
  // Map other fields
  Object.entries(FIELD_MAPPING).forEach(([csvField, dbField]) => {
    // Skip fields we've already handled (now only category, range, campaign as others are auto-populated)
    if (['category', 'range', 'campaign'].includes(dbField)) {
      return;
    }
    
    const value = record[csvField];
    
    // Handle numeric fields
    if (['woaOpenTv', 'woaPaidTv', 'totalTrps', 'cpp2024', 'cpp2025', 'cpp2026', 'woaPmFf', 'woaInfluencersAmplification', 'tvDemoMinAge', 'tvDemoMaxAge', 'digitalDemoMinAge', 'digitalDemoMaxAge'].includes(dbField)) {
      transformed[dbField] = parseNumber(value);
    }
    // Handle boolean fields
    else if (['isDigitalTargetSameAsTv'].includes(dbField)) {
      transformed[dbField] = parseBoolean(value);
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
    
    // DELETE EXISTING DATA for this country/lastUpdate/businessUnit combination
    // This ensures complete replacement rather than addition while preserving other business units
    const countryId = sessionData.countryId;
    const lastUpdateId = sessionData.lastUpdateId;
    const businessUnitId = sessionData.businessUnitId;
    
    if (countryId && lastUpdateId && businessUnitId) {
      console.log(`Deleting existing MediaSufficiency records for countryId: ${countryId}, lastUpdateId: ${lastUpdateId}, businessUnitId: ${businessUnitId}`);
      
      // Check how many records exist before deletion
      const existingCount = await prisma.mediaSufficiency.count({
        where: {
          countryId: countryId,
          lastUpdateId: lastUpdateId,
          buId: businessUnitId
        }
      });
      console.log(`Found ${existingCount} existing MediaSufficiency records to delete for this business unit`);
      
      // Delete existing records for this specific country, financial cycle, and business unit
      const deleteResult = await prisma.mediaSufficiency.deleteMany({
        where: {
          countryId: countryId,
          lastUpdateId: lastUpdateId,
          buId: businessUnitId
        }
      });
      console.log(`Successfully deleted ${deleteResult.count} existing MediaSufficiency records for this business unit`);
    } else {
      console.log('Skipping deletion - missing countryId, lastUpdateId, or businessUnitId in session data');
    }
    
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