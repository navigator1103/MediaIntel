import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseDate, formatDateForStorage, areDatesEqual } from '@/lib/utils/dateUtils';
import { createGamePlanBackup } from '@/lib/utils/backupUtils';
import { preValidateImportData } from '@/lib/utils/importValidation';

// Function to log with timestamp
function logWithTimestamp(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Function to log errors with timestamp
function logErrorWithTimestamp(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[${timestamp}] ERROR: ${message}`, error);
  } else {
    console.error(`[${timestamp}] ERROR: ${message}`);
  }
}

// Re-export the date utility functions for backward compatibility
export { parseDate, formatDateForStorage, areDatesEqual } from '@/lib/utils/dateUtils';

// Helper function to calculate weeks between two dates
function calculateWeeksLive(startDate: string, endDate: string): number | null {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }
    
    // Calculate the difference in milliseconds
    const diffMs = end.getTime() - start.getTime();
    
    // Convert to weeks (1 week = 7 days = 7 * 24 * 60 * 60 * 1000 ms)
    const weeksLive = diffMs / (7 * 24 * 60 * 60 * 1000);
    
    // Round to 2 decimal places
    return Math.round(weeksLive * 100) / 100;
  } catch (error) {
    logErrorWithTimestamp(`Error calculating weeks live: ${error}`);
    return null;
  }
}

// Helper function to parse numeric values from strings with enhanced debugging
function parseNumeric(value: string | undefined | null, isReachValue: boolean = false): number | null {
  if (!value) {
    // logWithTimestamp(`parseNumeric: Null or undefined value`);
    return null;
  }
  
  try {
    // Log the original value for debugging
    logWithTimestamp(`parseNumeric: Original value: '${value}' (type: ${typeof value})`);
    
    // Handle different number formats
    let cleanValue = value;
    
    // If it's already a number, just return it
    if (typeof value === 'number') {
      logWithTimestamp(`parseNumeric: Already a number: ${value}`);
      // For reach values, ensure it's below 100%
      if (isReachValue && value > 1) {
        // If value is greater than 1 but less than or equal to 100, assume it's a percentage and convert to decimal
        if (value <= 100) {
          logWithTimestamp(`parseNumeric: Converting percentage ${value}% to decimal ${value/100}`);
          return value / 100;
        } else {
          logWithTimestamp(`parseNumeric: Reach value ${value} exceeds 100%, capping at 1.0`);
          return 1.0;
        }
      }
      return value;
    }
    
    // If it's a string that contains a number
    if (typeof value === 'string') {
      // Check if it's a percentage string
      const isPercentage = value.includes('%');
      
      // Remove currency symbols, commas, spaces, and other non-numeric characters except decimal point
      cleanValue = value.replace(/[^0-9.\-]/g, '');
      logWithTimestamp(`parseNumeric: Cleaned value: '${cleanValue}'`);
      
      // Handle empty string after cleaning
      if (!cleanValue) {
        logWithTimestamp(`parseNumeric: Empty string after cleaning`);
        return null;
      }
      
      let parsed = parseFloat(cleanValue);
      logWithTimestamp(`parseNumeric: Parsed value: ${parsed} (isNaN: ${isNaN(parsed)})`);
      
      // Handle percentage values
      if (!isNaN(parsed)) {
        if (isReachValue || isPercentage) {
          // If it's a reach value and greater than 1, assume it's a percentage and convert to decimal
          if (parsed > 1) {
            if (parsed <= 100) {
              logWithTimestamp(`parseNumeric: Converting percentage ${parsed}% to decimal ${parsed/100}`);
              parsed = parsed / 100;
            } else {
              logWithTimestamp(`parseNumeric: Reach value ${parsed} exceeds 100%, capping at 1.0`);
              parsed = 1.0;
            }
          }
        }
      }
      
      return isNaN(parsed) ? null : parsed;
    }
    
    // If it's some other type, try to convert to string first
    logWithTimestamp(`parseNumeric: Unexpected type, trying to convert to string`);
    return parseNumeric(String(value), isReachValue);
  } catch (error) {
    logErrorWithTimestamp(`parseNumeric: Error parsing value '${value}'`, error);
    return null;
  }
}

// Initialize Prisma client for SQLite operations
const prisma = new PrismaClient();

// Path to the sessions directory where session files are stored
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

// Enhanced import route with detailed error logging
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Log the request details
    logWithTimestamp(`Import request received for session: ${sessionId}`);
    
    // Read the session file
    const sessionFilePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFilePath)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf-8'));
    const records = sessionData.data?.records || [];
    const lastUpdateId = sessionData.lastUpdateId;
    const selectedCountry = sessionData.country;
    
    if (records.length === 0) {
      return NextResponse.json({ error: 'No records found in session' }, { status: 400 });
    }
    
    if (!lastUpdateId) {
      return NextResponse.json({ error: 'Last Update ID is required' }, { status: 400 });
    }
    
    if (!selectedCountry) {
      return NextResponse.json({ error: 'Selected country is required' }, { status: 400 });
    }
    
    // Log the session details
    logWithTimestamp(`Using Last Update ID: ${lastUpdateId}`);
    logWithTimestamp(`Using Selected Country: ${selectedCountry}`);
    
    // Start the import process asynchronously
    (async () => {
      try {
        const results = await processImport(records, sessionData, sessionFilePath, lastUpdateId, selectedCountry);
        
        // Update the session file with completion information
        sessionData.importProgress = {
          current: records.length,
          total: records.length,
          percentage: 100,
          stage: 'Import completed'
        };
        
        // Update the session file with completion information
        sessionData.status = 'imported';
        
        // Ensure results is defined before accessing its properties
        if (results) {
          sessionData.importErrors = results.errors || [];
          sessionData.importResults = results; // Store the complete results object
        } else {
          sessionData.importErrors = [];
          sessionData.importResults = null;
        }
        
        // Write the updated session data back to the file
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
        logWithTimestamp(`Import completed and status saved to session file`);
      } catch (error) {
        logErrorWithTimestamp('Error during import process:', error);
        
        // Update the session file with error information
        sessionData.importProgress = {
          current: 0,
          total: records.length,
          percentage: 0,
          stage: 'Error during import'
        };
        sessionData.status = 'error';
        sessionData.importErrors = [{ index: -1, error: error instanceof Error ? error.message : String(error) }];
        
        // Write the updated session data back to the file
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
        logWithTimestamp(`Import error saved to session file`);
      }
    })();
    
    // Return immediate response to the client
    return NextResponse.json({
      message: 'Import process started',
      sessionId: sessionId
    });
  } catch (error) {
    logErrorWithTimestamp('Unexpected error during import setup:', error);
    return NextResponse.json(
      { error: 'Unexpected error during import setup', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Main import processing function
async function processImport(
  records: any[],
  sessionData: any,
  sessionFilePath: string,
  lastUpdateId: number,
  selectedCountry: string
) {
  logWithTimestamp(`Processing import with Last Update ID: ${lastUpdateId}`);
  logWithTimestamp(`Processing import with Selected Country: ${selectedCountry}`);
  
  if (!lastUpdateId) {
    logErrorWithTimestamp('ERROR: lastUpdateId is missing');
    throw new Error('Last Update ID is required for import');
  }

  // Track processed entities to avoid duplicates
  const processedEntities = {
    ranges: new Map<string, number>(),
    mediaSubTypes: new Map<string, number>(),
    pmTypes: new Map<string, number>(),
    campaigns: new Map<string, number>(),
    countries: new Map<string, number>(),
    regions: new Map<string, number>(),
    subRegions: new Map<string, number>(),
    categories: new Map<string, number>(),
    businessUnits: new Map<string, number>(),
    lastUpdates: new Map<string, number>(),
    gamePlans: new Set<string>()
  };
  
  // Track results
  const importResults = {
    rangesCount: 0,
    mediaSubtypesCount: 0,
    pmTypesCount: 0,
    campaignsCount: 0,
    gamePlansCount: 0,
    countriesCount: 0,
    regionsCount: 0,
    subRegionsCount: 0,
    categoriesCount: 0,
    businessUnitsCount: 0,
    lastUpdatesCount: 0,
    successfulRows: [] as number[],
    failedRows: [] as number[]
  };
  
  // Track errors
  const recordErrors: { index: number; error: string; campaign?: string; mediaSubtype?: string }[] = [];
  
  // Log CSV headers and sample data for debugging
  if (records.length > 0) {
    const headers = Object.keys(records[0]);
    logWithTimestamp('CSV Headers:');
    logWithTimestamp(JSON.stringify(headers));
    
    // Log first record as sample
    logWithTimestamp('Sample Record (first row):');
    logWithTimestamp(JSON.stringify(records[0]));
    
    // Log column names for specific fields we're interested in
    const budgetColumns = headers.filter(h => h.toLowerCase().includes('budget'));
    logWithTimestamp('Budget-related columns:');
    logWithTimestamp(JSON.stringify(budgetColumns));
    
    const regionColumns = headers.filter(h => h.toLowerCase().includes('region'));
    logWithTimestamp('Region-related columns:');
    logWithTimestamp(JSON.stringify(regionColumns));
    
    const businessUnitColumns = headers.filter(h => h.toLowerCase().includes('business') || h.toLowerCase().includes('bu'));
    logWithTimestamp('Business Unit-related columns:');
    logWithTimestamp(JSON.stringify(businessUnitColumns));
    
    // Check for financial cycle related columns
    const financialCycleColumns = headers.filter(h => 
      h.toLowerCase().includes('financial') || 
      h.toLowerCase().includes('cycle') || 
      h.toLowerCase().includes('period') || 
      h.toLowerCase().includes('last update'));
    logWithTimestamp('Financial Cycle-related columns:');
    logWithTimestamp(JSON.stringify(financialCycleColumns));
  }
  
  // STEP 1: PRE-VALIDATE DATA BEFORE ANY DELETION
  logWithTimestamp('🔍 Step 1: Pre-validating import data...');
  sessionData.importProgress = {
    current: 0,
    total: records.length,
    percentage: 5,
    stage: 'Validating import data...'
  };
  fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
  
  try {
    const validationResult = await preValidateImportData(records, selectedCountry, lastUpdateId);
    
    if (!validationResult.isValid) {
      logErrorWithTimestamp(`❌ Pre-validation failed with ${validationResult.errors.length} errors:`);
      validationResult.errors.forEach(error => logErrorWithTimestamp(`   - ${error}`));
      
      // Update session with validation errors
      sessionData.importProgress = {
        current: 0,
        total: records.length,
        percentage: 0,
        stage: 'Validation failed'
      };
      sessionData.validationErrors = validationResult.errors;
      fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
      
      throw new Error(`Import validation failed: ${validationResult.errors.join('; ')}`);
    }
    
    logWithTimestamp(`✅ Pre-validation passed! ${records.length} records are valid for import.`);
    
  } catch (error) {
    logErrorWithTimestamp('Pre-validation error:', error);
    throw error;
  }
  
  // STEP 2: CREATE BACKUP BEFORE DELETION
  logWithTimestamp('💾 Step 2: Creating backup of existing game plans...');
  sessionData.importProgress = {
    current: 0,
    total: records.length,
    percentage: 10,
    stage: 'Creating backup...'
  };
  fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
  
  let backupFile: string | null = null;
  if (selectedCountry && lastUpdateId) {
    try {
      // Get country ID for the selected country
      const country = await prisma.country.findFirst({
        where: {
          name: selectedCountry
        },
        select: {
          id: true,
          name: true
        }
      });
      
      if (country) {
        logWithTimestamp(`Found matching country in database: ${country.name} (ID: ${country.id})`);
        
        // Check if there are existing game plans to backup
        const existingCount = await prisma.gamePlan.count({
          where: {
            countryId: country.id,
            last_update_id: lastUpdateId
          }
        });
        
        if (existingCount > 0) {
          backupFile = await createGamePlanBackup(country.id, lastUpdateId, 'pre-import-backup');
          logWithTimestamp(`✅ Backup created: ${existingCount} game plans backed up to ${path.basename(backupFile)}`);
        } else {
          logWithTimestamp('ℹ️ No existing game plans to backup');
        }
        
        // Store the country ID for later use
        processedEntities.countries.set(selectedCountry, country.id);
      } else {
        logWithTimestamp(`Selected country '${selectedCountry}' not found in database`);
        throw new Error(`Selected country '${selectedCountry}' not found in database`);
      }
    } catch (error) {
      logErrorWithTimestamp('Error creating backup:', error);
      throw error;
    }
  }
  
  // STEP 3: DELETE EXISTING DATA (SAFE NOW BECAUSE WE VALIDATED AND BACKED UP)
  logWithTimestamp('🗑️ Step 3: Deleting existing game plans...');
  sessionData.importProgress = {
    current: 0,
    total: records.length,
    percentage: 15,
    stage: 'Deleting existing data...'
  };
  fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
  
  if (selectedCountry && lastUpdateId) {
    try {
      const country = await prisma.country.findFirst({
        where: {
          name: selectedCountry
        },
        select: {
          id: true,
          name: true
        }
      });
      
      if (country) {
        // Delete existing game plans for this country and last update
        const deleteResult = await prisma.gamePlan.deleteMany({
          where: {
            countryId: country.id,
            last_update_id: lastUpdateId
          }
        });
        
        logWithTimestamp(`✅ Deleted ${deleteResult.count} existing game plans for country: ${country.name} and last update ID ${lastUpdateId}`);
        
        // Store backup info in session
        sessionData.backupInfo = {
          backupFile: backupFile ? path.basename(backupFile) : null,
          deletedCount: deleteResult.count,
          backupCreated: backupFile !== null
        };
        
        // Store the country ID for later use
        processedEntities.countries.set(selectedCountry, country.id);
      } else {
        logWithTimestamp(`Selected country '${selectedCountry}' not found in database`);
        throw new Error(`Selected country '${selectedCountry}' not found in database`);
      }
    } catch (error) {
      logErrorWithTimestamp('Error deleting existing game plans:', error);
      throw error;
    }
  }
  
  // Ensure the selected country is available for all game plans
  if (!processedEntities.countries.has(selectedCountry)) {
    try {
      const country = await prisma.country.findFirst({
        where: { name: selectedCountry }
      });
      
      if (country) {
        processedEntities.countries.set(selectedCountry, country.id);
        logWithTimestamp(`Pre-loaded selected country: ${selectedCountry} (ID: ${country.id})`);
      } else {
        logErrorWithTimestamp(`Selected country '${selectedCountry}' not found in database`);
        throw new Error(`Selected country '${selectedCountry}' not found in database`);
      }
    } catch (error) {
      logErrorWithTimestamp('Error looking up selected country:', error);
      throw error;
    }
  }
  
  // STEP 4: PRE-PROCESS ALL UNIQUE RANGES FIRST (needed for campaigns)
  logWithTimestamp('Step 4a: Pre-processing all unique ranges...');
  
  const uniqueRanges = new Set<string>();
  for (const record of records) {
    if (record.Range) {
      uniqueRanges.add(record.Range);
    }
  }
  
  for (const rangeName of uniqueRanges) {
    if (!processedEntities.ranges.has(rangeName)) {
      const existingRange = await prisma.range.findFirst({
        where: { name: rangeName }
      });
      
      if (existingRange) {
        // Mark existing range as auto-imported
        await prisma.range.update({
          where: { id: existingRange.id },
          data: {
            createdBy: 'auto-import',
            notes: 'Auto-created during game plans import',
            updatedAt: new Date().toISOString()
          }
        });
        processedEntities.ranges.set(rangeName, existingRange.id);
        logWithTimestamp(`Found and marked existing range: ${rangeName} (ID: ${existingRange.id})`);
      } else {
        const newRange = await prisma.range.create({
          data: {
            name: rangeName,
            status: 'active', // Keep active so they can be used immediately
            createdBy: 'auto-import', // Track that this was auto-created
            notes: 'Auto-created during game plans import',
            createdAt: new Date().toISOString()
          }
        });
        processedEntities.ranges.set(rangeName, newRange.id);
        importResults.rangesCount++;
        logWithTimestamp(`Created new range: ${rangeName} (ID: ${newRange.id})`);
      }
    }
  }
  
  // STEP 4b: PRE-CREATE ALL UNIQUE CAMPAIGNS TO AVOID DUPLICATES
  logWithTimestamp('Step 4b: Pre-creating unique campaigns...');
  
  // Collect all unique campaign+range combinations
  const uniqueCampaigns = new Map<string, {campaign: string, range: string}>();
  
  for (const record of records) {
    if (record.Campaign && record.Range) {
      const key = `${record.Campaign}-${record.Range}`;
      if (!uniqueCampaigns.has(key)) {
        uniqueCampaigns.set(key, {
          campaign: record.Campaign,
          range: record.Range
        });
      }
    }
  }
  
  logWithTimestamp(`Found ${uniqueCampaigns.size} unique campaigns to process`);
  
  // Create/find all campaigns upfront
  for (const [key, info] of uniqueCampaigns) {
    const rangeId = processedEntities.ranges.get(info.range);
    
    if (rangeId) {
      // Always do upsert to handle duplicates gracefully
      const campaign = await prisma.campaign.upsert({
        where: { 
          // Use a compound unique constraint or just name if that's what's unique
          name: info.campaign
        },
        update: {
          createdBy: 'auto-import', // Mark as auto-imported even if it existed
          notes: 'Auto-created during game plans import',
          updatedAt: new Date().toISOString()
        }, // Mark existing campaigns as auto-imported
        create: {
          name: info.campaign,
          rangeId: rangeId,
          status: 'active', // Keep active so they can be used immediately
          createdBy: 'auto-import', // Track that this was auto-created
          notes: 'Auto-created during game plans import',
          createdAt: new Date().toISOString()
        }
      });
      
      processedEntities.campaigns.set(key, campaign.id);
      logWithTimestamp(`Campaign processed: ${info.campaign} (ID: ${campaign.id})`);
      
      // Only count as created if it was actually created (not found)
      const wasCreated = !await prisma.campaign.findFirst({
        where: { id: campaign.id, createdAt: { lt: new Date(Date.now() - 1000).toISOString() } }
      });
      if (wasCreated) {
        importResults.campaignsCount++;
      }
    } else {
      logErrorWithTimestamp(`Cannot process campaign '${info.campaign}' - Range '${info.range}' not found`);
    }
  }

  // First pass: collect and create all other entities (except campaigns which are done)
  logWithTimestamp('First pass: collecting other entities...');
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    try {
      // Ranges are already processed in pre-processing step
      
      // Process media subtype
      if (record['Media Subtype'] && !processedEntities.mediaSubTypes.has(record['Media Subtype'])) {
        const existingMediaSubtype = await prisma.mediaSubType.findFirst({
          where: { name: record['Media Subtype'] }
        });
        
        if (existingMediaSubtype) {
          processedEntities.mediaSubTypes.set(record['Media Subtype'], existingMediaSubtype.id);
          logWithTimestamp(`Found existing media subtype: ${record['Media Subtype']} (ID: ${existingMediaSubtype.id})`);
        } else {
          const newMediaSubtype = await prisma.mediaSubType.create({
            data: {
              name: record['Media Subtype'],
              mediaTypeId: 1, // Default media type ID
              createdAt: new Date().toISOString() // Use ISO string with Z suffix
            }
          });
          processedEntities.mediaSubTypes.set(record['Media Subtype'], newMediaSubtype.id);
          importResults.mediaSubtypesCount++;
          logWithTimestamp(`Created new media subtype: ${record['Media Subtype']} (ID: ${newMediaSubtype.id})`);
        }
      }
      
      // Process PM type
      if (record['PM Type'] && !processedEntities.pmTypes.has(record['PM Type'])) {
        const existingPmType = await prisma.pMType.findFirst({
          where: { name: record['PM Type'] }
        });
        
        if (existingPmType) {
          processedEntities.pmTypes.set(record['PM Type'], existingPmType.id);
          logWithTimestamp(`Found existing PM type: ${record['PM Type']} (ID: ${existingPmType.id})`);
        } else {
          const newPmType = await prisma.pMType.create({
            data: {
              name: record['PM Type'],
              createdAt: new Date().toISOString() // Use ISO string with Z suffix
            }
          });
          processedEntities.pmTypes.set(record['PM Type'], newPmType.id);
          importResults.pmTypesCount++;
          logWithTimestamp(`Created new PM type: ${record['PM Type']} (ID: ${newPmType.id})`);
        }
      }
      
      // Process country
      if (record.Country && !processedEntities.countries.has(record.Country)) {
        try {
          const existingCountry = await prisma.country.findFirst({
            where: { name: record.Country }
          });
          
          if (existingCountry) {
            processedEntities.countries.set(record.Country, existingCountry.id);
            logWithTimestamp(`Found existing country: ${record.Country} (ID: ${existingCountry.id})`);
          } else {
            // Create a new country with default region ID 1
            const newCountry = await prisma.country.create({
              data: {
                name: record.Country,
                regionId: 1, // Default region ID
                createdAt: new Date().toISOString()
              }
            });
            processedEntities.countries.set(record.Country, newCountry.id);
            importResults.countriesCount = (importResults.countriesCount || 0) + 1;
            logWithTimestamp(`Created new country: ${record.Country} (ID: ${newCountry.id})`);
          }
        } catch (error) {
          logErrorWithTimestamp(`Error processing country: ${record.Country}`, error);
          // Continue processing even if country lookup fails
        }
      }
      
      // Process region with enhanced flexible column name handling
      // Log all possible region-related fields in the record for debugging
      logWithTimestamp('Checking for region values in record:');
      const possibleRegionKeys = ['Region', 'region', 'REGION', 'RegionName', 'regionName', 'region_name', 'Region Name', 'Global Region'];
      possibleRegionKeys.forEach(key => {
        if (record[key]) {
          logWithTimestamp(`Found region key '${key}' with value: '${record[key]}'`);
        }
      });
      
      // Try to find region value with more variations
      const regionValue = record.Region || record['Region'] || record.REGION || record['RegionName'] || 
                         record.region || record['region'] || record['region_name'] || record['Region Name'] || 
                         record['Global Region'] || record.regionName;
      
      logWithTimestamp(`Final region value determined: '${regionValue}'`);
      
      if (regionValue && !processedEntities.regions.has(regionValue)) {
        try {
          // First, try exact match
          let existingRegion = await prisma.region.findFirst({
            where: { name: regionValue }
          });
          
          // If not found, try case-insensitive match
          if (!existingRegion) {
            logWithTimestamp(`No exact match for region '${regionValue}', trying case-insensitive match...`);
            const allRegions = await prisma.region.findMany();
            const matchedRegion = allRegions.find(r => r.name.toLowerCase() === regionValue.toLowerCase());
            
            if (matchedRegion) {
              existingRegion = matchedRegion;
              logWithTimestamp(`Found case-insensitive match for region '${regionValue}': '${existingRegion.name}' (ID: ${existingRegion.id})`);
            }
          }
          
          if (existingRegion) {
            processedEntities.regions.set(regionValue, existingRegion.id);
            logWithTimestamp(`Using existing region: ${regionValue} (ID: ${existingRegion.id})`);
          } else {
            // Create a new region
            const newRegion = await prisma.region.create({
              data: {
                name: regionValue,
                createdAt: new Date().toISOString()
              }
            });
            processedEntities.regions.set(regionValue, newRegion.id);
            importResults.regionsCount = (importResults.regionsCount || 0) + 1;
            logWithTimestamp(`Created new region: ${regionValue} (ID: ${newRegion.id})`);
          }
        } catch (error) {
          logErrorWithTimestamp(`Error processing region: ${regionValue}`, error);
          // Continue processing even if region lookup fails
        }
      } else if (regionValue) {
        logWithTimestamp(`Using previously processed region: ${regionValue} (ID: ${processedEntities.regions.get(regionValue)})`);
      } else {
        logWithTimestamp('No region value found in record');
      }
      
      // Process sub-region with flexible column name handling
      const subRegionValue = record['Sub Region'] || record['Sub-Region'] || record.SUBREGION || record['Sub_Region'];
      if (subRegionValue && !processedEntities.subRegions.has(subRegionValue)) {
        try {
          const existingSubRegion = await prisma.subRegion.findFirst({
            where: { name: subRegionValue }
          });
          
          if (existingSubRegion) {
            processedEntities.subRegions.set(subRegionValue, existingSubRegion.id);
            logWithTimestamp(`Found existing sub-region: ${subRegionValue} (ID: ${existingSubRegion.id})`);
          } else {
            // Create a new sub-region
            // NOTE: This should only happen if pre-validation passes, which includes checking
            // that sub-regions belong to the correct country
            const newSubRegion = await prisma.subRegion.create({
              data: {
                name: subRegionValue,
                createdAt: new Date().toISOString()
              }
            });
            processedEntities.subRegions.set(subRegionValue, newSubRegion.id);
            importResults.subRegionsCount = (importResults.subRegionsCount || 0) + 1;
            logWithTimestamp(`Created new sub-region: ${subRegionValue} (ID: ${newSubRegion.id})`);
          }
        } catch (error) {
          logErrorWithTimestamp(`Error processing sub-region: ${subRegionValue}`, error);
          // Continue processing even if sub-region lookup fails
        }
      }
      
      // Cluster processing has been removed as it's no longer needed
      
      // Process business unit with flexible column name handling
      const businessUnitValue = record.BusinessUnit || record['Business Unit'] || record.BU || record['BU'] || record.BUSINESSUNIT;
      if (businessUnitValue && !processedEntities.businessUnits.has(businessUnitValue)) {
        try {
          const existingBusinessUnit = await prisma.businessUnit.findFirst({
            where: { name: businessUnitValue }
          });
          
          if (existingBusinessUnit) {
            processedEntities.businessUnits.set(businessUnitValue, existingBusinessUnit.id);
            logWithTimestamp(`Found existing business unit: ${businessUnitValue} (ID: ${existingBusinessUnit.id})`);
          } else {
            // Create a new business unit
            const newBusinessUnit = await prisma.businessUnit.create({
              data: {
                name: businessUnitValue,
                createdAt: new Date().toISOString()
              }
            });
            processedEntities.businessUnits.set(businessUnitValue, newBusinessUnit.id);
            importResults.businessUnitsCount = (importResults.businessUnitsCount || 0) + 1;
            logWithTimestamp(`Created new business unit: ${businessUnitValue} (ID: ${newBusinessUnit.id})`);
          }
        } catch (error) {
          logErrorWithTimestamp(`Error processing business unit: ${businessUnitValue}`, error);
          // Continue processing even if business unit lookup fails
        }
      }
      
      // Process category with flexible column name handling
      const categoryValue = record.Category || record['Category'] || record.CATEGORY || record['Product Category'];
      if (categoryValue && !processedEntities.categories.has(categoryValue)) {
        try {
          const existingCategory = await prisma.category.findFirst({
            where: { name: categoryValue }
          });
          
          if (existingCategory) {
            processedEntities.categories.set(categoryValue, existingCategory.id);
            logWithTimestamp(`Found existing category: ${categoryValue} (ID: ${existingCategory.id})`);
          } else {
            // Create a new category
            const newCategory = await prisma.category.create({
              data: {
                name: categoryValue,
                createdAt: new Date().toISOString()
              }
            });
            processedEntities.categories.set(categoryValue, newCategory.id);
            importResults.categoriesCount = (importResults.categoriesCount || 0) + 1;
            logWithTimestamp(`Created new category: ${categoryValue} (ID: ${newCategory.id})`);
          }
        } catch (error) {
          logErrorWithTimestamp(`Error processing category: ${categoryValue}`, error);
          // Continue processing even if category lookup fails
        }
      }
      
      // Process LastUpdate (financial cycle) with flexible column name handling
      const lastUpdateValue = record.FinancialCycle || record['Financial Cycle'] || record['Cycle'] || 
                             record['Period'] || record['Last Update'] || record.LastUpdate || 
                             record['Financial Period'] || record['Fiscal Period'] || record['Fiscal Cycle'];
      
      if (lastUpdateValue && !processedEntities.lastUpdates.has(lastUpdateValue)) {
        try {
          // Log the LastUpdate value for debugging
          logWithTimestamp(`Processing LastUpdate (financial cycle): ${lastUpdateValue}`);
          
          const existingLastUpdate = await prisma.lastUpdate.findFirst({
            where: { name: lastUpdateValue }
          });
          
          if (existingLastUpdate) {
            processedEntities.lastUpdates.set(lastUpdateValue, existingLastUpdate.id);
            logWithTimestamp(`Found existing LastUpdate (financial cycle): ${lastUpdateValue} (ID: ${existingLastUpdate.id})`);
          } else {
            // Create a new LastUpdate (financial cycle)
            const newLastUpdate = await prisma.lastUpdate.create({
              data: {
                name: lastUpdateValue,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            processedEntities.lastUpdates.set(lastUpdateValue, newLastUpdate.id);
            importResults.lastUpdatesCount = (importResults.lastUpdatesCount || 0) + 1;
            logWithTimestamp(`Created new LastUpdate (financial cycle): ${lastUpdateValue} (ID: ${newLastUpdate.id})`);
          }
        } catch (error) {
          logErrorWithTimestamp(`Error processing LastUpdate (financial cycle): ${lastUpdateValue}`, error);
          // Continue processing even if LastUpdate lookup fails
        }
      }
      
      // Campaigns are already created upfront, skip campaign processing here
      
      // Update progress
      if ((i + 1) % 5 === 0 || i === records.length - 1) {
        const percentage = Math.round(((i + 1) / records.length) * 50); // First pass is 50% of total
        sessionData.importProgress = {
          current: i + 1,
          total: records.length,
          percentage: percentage,
          stage: `Processing entities (${i + 1}/${records.length})`
        };
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
        logWithTimestamp(`Updated first pass progress: ${percentage}%`);
      }
    } catch (error) {
      logErrorWithTimestamp(`Error processing record ${i}:`, error);
      recordErrors.push({
        index: i,
        error: `Error processing record: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  
  logWithTimestamp('First pass completed. Collected entities:');
  logWithTimestamp(`- Ranges: ${processedEntities.ranges.size}`);
  logWithTimestamp(`- Media Subtypes: ${processedEntities.mediaSubTypes.size}`);
  logWithTimestamp(`- PM Types: ${processedEntities.pmTypes.size}`);
  logWithTimestamp(`- Campaigns: ${processedEntities.campaigns.size}`);
  
  // Validate date formats before creating game plans
  logWithTimestamp('Validating date formats...');
  const dateErrors = [];
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (record['Start Date'] && record['End Date']) {
      const startDateFormatted = formatDateForStorage(record['Start Date']);
      const endDateFormatted = formatDateForStorage(record['End Date']);
      
      if (!startDateFormatted) {
        dateErrors.push({
          index: i,
          field: 'Start Date',
          value: record['Start Date'],
          error: 'Invalid date format'
        });
        logErrorWithTimestamp(`Invalid start date format at row ${i+1}: ${record['Start Date']}`);
      }
      
      if (!endDateFormatted) {
        dateErrors.push({
          index: i,
          field: 'End Date',
          value: record['End Date'],
          error: 'Invalid date format'
        });
        logErrorWithTimestamp(`Invalid end date format at row ${i+1}: ${record['End Date']}`);
      }
    }
  }
  
  if (dateErrors.length > 0) {
    logErrorWithTimestamp(`Found ${dateErrors.length} date format errors. Please fix the CSV and try again.`);
    logErrorWithTimestamp('Sample errors:', dateErrors.slice(0, 5));
  } else {
    logWithTimestamp('All date formats are valid.');
  }
  
  // Second pass: create game plans
  logWithTimestamp('Second pass: creating game plans...');
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    try {
      if (record.Campaign && record.Range && record['Media Subtype'] && record['Start Date'] && record['End Date']) {
        const campaignKey = `${record.Campaign}-${record.Range}`;
        const gameplanKey = `${record.Campaign}-${record['Media Subtype']}-${record['Start Date']}-${record['End Date']}`;
        
        if (!processedEntities.gamePlans.has(gameplanKey)) {
          const campaignId = processedEntities.campaigns.get(campaignKey);
          const mediaSubtypeId = processedEntities.mediaSubTypes.get(record['Media Subtype']);
          const pmTypeId = record['PM Type'] ? processedEntities.pmTypes.get(record['PM Type']) : null;
          
          if (campaignId && mediaSubtypeId) {
            // Parse dates using the shared date utility and format for storage
            const startDate = parseDate(record['Start Date']);
            const endDate = parseDate(record['End Date']);
            
            // We need to ensure dates are properly formatted for storage as ISO strings with Z suffix
            if (!startDate || !endDate) {
              // Skip this record if dates are invalid
              throw new Error('Invalid start or end date');
            }
            
            // Format dates as ISO strings with Z suffix for storage
            const startDateIso = formatDateForStorage(startDate);
            const endDateIso = formatDateForStorage(endDate);
            
            // Calculate weeks live automatically
            const weeksLive = calculateWeeksLive(startDateIso, endDateIso);
            logWithTimestamp(`Calculated weeks live: ${weeksLive} weeks for campaign ${record.Campaign}`);
            
            if (!startDateIso || !endDateIso) {
              throw new Error('Failed to format dates for storage');
            }
            
            // Log the original and parsed dates for debugging
            if (startDate) {
              logWithTimestamp(`Parsed start date: ${record['Start Date']} -> ${startDate.toISOString()}`);
            } else {
              logErrorWithTimestamp(`Failed to parse start date: ${record['Start Date']}`);
            }
            
            if (endDate) {
              logWithTimestamp(`Parsed end date: ${record['End Date']} -> ${endDate.toISOString()}`);
            } else {
              logErrorWithTimestamp(`Failed to parse end date: ${record['End Date']}`);
            }
            
            if (startDate && endDate) {
              // Log all record keys for debugging
              logWithTimestamp(`Record keys for row ${i}:`);
              logWithTimestamp(JSON.stringify(Object.keys(record)));
              
              // Log raw budget values from record
              logWithTimestamp(`Raw budget values in record:`);
              logWithTimestamp(`Budget: ${record.Budget}, ${record['Budget']}, ${record['Total Budget']}, ${record.TotalBudget}, ${record['BUDGET']}`);
              logWithTimestamp(`Q1Budget: ${record.Q1Budget}, ${record['Q1 Budget']}, ${record['Q1']}, ${record['Q1_Budget']}, ${record['Q1BUDGET']}`);
              logWithTimestamp(`Q2Budget: ${record.Q2Budget}, ${record['Q2 Budget']}, ${record['Q2']}, ${record['Q2_Budget']}, ${record['Q2BUDGET']}`);
              logWithTimestamp(`Q3Budget: ${record.Q3Budget}, ${record['Q3 Budget']}, ${record['Q3']}, ${record['Q3_Budget']}, ${record['Q3BUDGET']}`);
              logWithTimestamp(`Q4Budget: ${record.Q4Budget}, ${record['Q4 Budget']}, ${record['Q4']}, ${record['Q4_Budget']}, ${record['Q4BUDGET']}`);
              
              // Parse budget values with flexible column name handling
              // Check for different possible column name formats for Budget
              const totalBudget = parseNumeric(record.Budget || record['Budget'] || record['Total Budget'] || record.TotalBudget || record['BUDGET']) || 0;
              
              // Check for different possible column name formats for quarterly budgets
              const q1Budget = parseNumeric(record.Q1Budget || record['Q1 Budget'] || record['Q1'] || record['Q1_Budget'] || record['Q1BUDGET']);
              const q2Budget = parseNumeric(record.Q2Budget || record['Q2 Budget'] || record['Q2'] || record['Q2_Budget'] || record['Q2BUDGET']);
              const q3Budget = parseNumeric(record.Q3Budget || record['Q3 Budget'] || record['Q3'] || record['Q3_Budget'] || record['Q3BUDGET']);
              const q4Budget = parseNumeric(record.Q4Budget || record['Q4 Budget'] || record['Q4'] || record['Q4_Budget'] || record['Q4BUDGET']);
              
              // Log parsed budget values for debugging
              logWithTimestamp(`Parsed budget values for ${record.Campaign} - ${record['Media Subtype']}:`);
              logWithTimestamp(`Total: ${totalBudget}, Q1: ${q1Budget}, Q2: ${q2Budget}, Q3: ${q3Budget}, Q4: ${q4Budget}`);
              
              // Parse reach and performance values
              const rawTotalR1Plus = record['Total R1+'] || record['Total R1 Plus'] || record['TotalR1+'] || 
                                    record['Total_R1_Plus'] || record['TOTALR1+'] || record['totalr1+'];
              const rawTotalR3Plus = record['Total R3+'] || record['Total R3 Plus'] || record['TotalR3+'] || 
                                    record['Total_R3_Plus'] || record['TOTALR3+'] || record['totalr3+'];
              const rawTotalTrps = record['Total TRPs'] || record['TotalTRPs'] || record['Total_TRPs'] || 
                                  record['TOTALTRPS'] || record['totaltrps'] || record['TRPs'];
              const rawNsVsWm = record['NS vs WM'] || record['NS_vs_WM'] || record['NSVSWM'] || 
                               record['ns_vs_wm'] || record['NS/WM'] || record['nsVsWm'];
              
              logWithTimestamp(`Processing reach values - Raw Total R1+: ${rawTotalR1Plus}, Raw Total R3+: ${rawTotalR3Plus}, Raw Total TRPs: ${rawTotalTrps}, Raw NS vs WM: ${rawNsVsWm}`);
              
              const totalR1Plus = parseNumeric(rawTotalR1Plus, true);
              const totalR3Plus = parseNumeric(rawTotalR3Plus, true);
              const totalTrps = parseNumeric(rawTotalTrps);
              const nsVsWm = rawNsVsWm ? rawNsVsWm.toString().trim() : null;
              
              logWithTimestamp(`Processed reach values - Total R1+: ${totalR1Plus}, Total R3+: ${totalR3Plus}, Total TRPs: ${totalTrps}, NS vs WM: ${nsVsWm}`);
              if (rawTotalR1Plus && totalR1Plus !== null && parseFloat(String(rawTotalR1Plus).replace(/[^0-9.\-]/g, '')) > 1) {
                logWithTimestamp(`✅ Total R1+ value normalized from ${rawTotalR1Plus} to ${totalR1Plus}`);
              }
              if (rawTotalR3Plus && totalR3Plus !== null && parseFloat(String(rawTotalR3Plus).replace(/[^0-9.\-]/g, '')) > 1) {
                logWithTimestamp(`✅ Total R3+ value normalized from ${rawTotalR3Plus} to ${totalR3Plus}`);
              }
              
              // Use the selected country for all game plans instead of CSV data
              let countryId = null;
              let regionId = null;
              let subRegionId = null;
              
              // Always use the selected country instead of CSV Country column
              if (processedEntities.countries.has(selectedCountry)) {
                countryId = processedEntities.countries.get(selectedCountry);
                logWithTimestamp(`Using selected country ID ${countryId} for ${selectedCountry} (ignoring CSV Country column)`);
              } else {
                logErrorWithTimestamp(`Selected country '${selectedCountry}' not found in processed entities`);
                throw new Error(`Selected country '${selectedCountry}' not available for game plan creation`);
              }
              
              // Get region ID if available with enhanced flexible column name handling
              // Try to find region value with more variations - same logic as in the first pass
              const regionValue = record.Region || record['Region'] || record.REGION || record['RegionName'] || 
                                record.region || record['region'] || record['region_name'] || record['Region Name'] || 
                                record['Global Region'] || record.regionName;
              
              logWithTimestamp(`Looking for region ID for value: '${regionValue}'`);
              
              if (regionValue) {
                if (processedEntities.regions.has(regionValue)) {
                  regionId = processedEntities.regions.get(regionValue);
                  logWithTimestamp(`Found region ID ${regionId} for exact match '${regionValue}'`);
                } else {
                  // Try to find a case-insensitive match in the processed entities
                  logWithTimestamp(`No exact match for region '${regionValue}' in processed entities, trying case-insensitive match...`);
                  
                  for (const [key, id] of processedEntities.regions.entries()) {
                    if (key.toLowerCase() === regionValue.toLowerCase()) {
                      regionId = id;
                      logWithTimestamp(`Found region ID ${regionId} for case-insensitive match '${key}'`);
                      break;
                    }
                  }
                  
                  if (!regionId) {
                    logWithTimestamp(`No region match found for '${regionValue}' in processed entities`);
                    
                    // If we still don't have a region ID, try to find it directly in the database
                    try {
                      const existingRegion = await prisma.region.findFirst({
                        where: { name: regionValue }
                      });
                      
                      if (existingRegion) {
                        regionId = existingRegion.id;
                        // Add to processed entities for future use
                        processedEntities.regions.set(regionValue, regionId);
                        logWithTimestamp(`Found region ID ${regionId} for '${regionValue}' directly from database`);
                      }
                    } catch (error) {
                      logErrorWithTimestamp(`Error finding region in database: ${error}`);
                    }
                  }
                }
              } else {
                logWithTimestamp('No region value found in record for game plan');
              }
              
              // Get sub-region ID if available with flexible column name handling
              const subRegionValue = record['Sub Region'] || record['Sub-Region'] || record.SUBREGION || record['Sub_Region'];
              if (subRegionValue && processedEntities.subRegions.has(subRegionValue)) {
                subRegionId = processedEntities.subRegions.get(subRegionValue);
                logWithTimestamp(`Using sub-region ID ${subRegionId} for ${subRegionValue}`);
              }
              
              // Get business unit ID if available with flexible column name handling
              let businessUnitId = null;
              const businessUnitValue = record.BusinessUnit || record['Business Unit'] || record.BU || record['BU'] || record.BUSINESSUNIT;
              if (businessUnitValue && processedEntities.businessUnits.has(businessUnitValue)) {
                businessUnitId = processedEntities.businessUnits.get(businessUnitValue);
                logWithTimestamp(`Using business unit ID ${businessUnitId} for ${businessUnitValue}`);
              }
              
              // Get Playbook ID if available with flexible column name handling
              let playbookId = null;
              const playbookIdValue = record.PlaybookID || record['Playbook ID'] || record['Playbook Id'] || record.PLAYBOOKID || record['Playbook_ID'];
              if (playbookIdValue) {
                playbookId = playbookIdValue.toString();
                logWithTimestamp(`Using Playbook ID: ${playbookId}`);
              }
              
              // Get Total WOA if available with flexible column name handling
              let totalWoa = null;
              const totalWoaValue = record['Total WOA'] || record['TotalWOA'] || record['TOTAL_WOA'] || record.TotalWOA || record['Total_WOA'];
              if (totalWoaValue) {
                totalWoa = parseNumeric(totalWoaValue);
                logWithTimestamp(`Using Total WOA: ${totalWoa}`);
              }
              
              // Get Weeks Off Air if available with flexible column name handling
              let weeksOffAir = null;
              const weeksOffAirValue = record['Weeks Off Air'] || record['WeeksOffAir'] || record['WEEKS_OFF_AIR'] || record.WeeksOffAir || record['Weeks_Off_Air'];
              if (weeksOffAirValue) {
                weeksOffAir = parseNumeric(weeksOffAirValue);
                logWithTimestamp(`Using Weeks Off Air: ${weeksOffAir}`);
              }
              
              // Use the lastUpdateId from user selection (passed as parameter)
              // No need to derive from CSV data since user selected it during upload
              logWithTimestamp(`Using LastUpdate (financial cycle) ID from user selection: ${lastUpdateId}`);
              
              // Get range ID if available (should already be set from campaign processing)
              let rangeId = null;
              if (record.Range && processedEntities.ranges.has(record.Range)) {
                rangeId = processedEntities.ranges.get(record.Range);
                logWithTimestamp(`Using range ID ${rangeId} for ${record.Range}`);
              }
              
              // Get category ID if available
              let categoryId = null;
              const categoryValue = record.Category || record['Category'] || record.CATEGORY || record['Product Category'];
              if (categoryValue && processedEntities.categories.has(categoryValue)) {
                categoryId = processedEntities.categories.get(categoryValue);
                logWithTimestamp(`Using category ID ${categoryId} for ${categoryValue}`);
              }
              
              try {
                // Check if a game plan with these parameters already exists
                // Define the GamePlan type for TypeScript
                type GamePlan = {
                  id: number;
                  startDate: Date;
                  endDate: Date;
                  campaignId: number;
                  mediaSubTypeId: number;
                };

                // Use a direct SQL query to find existing game plans with the same campaign, media subtype, and date range
                // This ensures we're comparing the exact string representations of dates
                const findDuplicateQuery = `
                  SELECT id, start_date, end_date, campaign_id, media_sub_type_id
                  FROM game_plans
                  WHERE campaign_id = ${campaignId}
                    AND media_sub_type_id = ${mediaSubtypeId}
                    AND start_date = '${startDateIso}'
                    AND end_date = '${endDateIso}';
                `;
                
                // Execute the query to find duplicates
                const existingGamePlans: any[] = await prisma.$queryRawUnsafe(findDuplicateQuery);
                
                // Log the duplicate check results
                logWithTimestamp(`Checking for duplicates with campaign_id=${campaignId}, media_sub_type_id=${mediaSubtypeId}, start_date='${startDateIso}', end_date='${endDateIso}'`);
                logWithTimestamp(`Found ${existingGamePlans.length} potential duplicates`);
                
                // Use the first match if any exists
                const existingGamePlan = existingGamePlans.length > 0 ? existingGamePlans[0] : null;
                
                if (existingGamePlan) {
                  // Update existing game plan using raw SQL query
                  const dateNow = new Date().toISOString();
                  
                  // Log the values we're about to use in the SQL query
                  logWithTimestamp('Values for SQL update:');
                  logWithTimestamp(`pmTypeId: ${pmTypeId}, totalBudget: ${totalBudget}`);
                  logWithTimestamp(`q1Budget: ${q1Budget}, q2Budget: ${q2Budget}, q3Budget: ${q3Budget}, q4Budget: ${q4Budget}`);
                  logWithTimestamp(`countryId: ${countryId}, regionId: ${regionId}, subRegionId: ${subRegionId}, businessUnitId: ${businessUnitId}`);
                  logWithTimestamp(`categoryId: ${categoryId}`);
                  logWithTimestamp(`playbookId: ${playbookId}`);
                  
                  // Update the existing game plan with raw SQL to ensure dates are stored as strings
                  const updateQuery = `
                    UPDATE game_plans SET
                      campaign_id = ${campaignId},
                      media_sub_type_id = ${mediaSubtypeId},
                      pm_type_id = ${pmTypeId !== null && pmTypeId !== undefined ? pmTypeId : 'NULL'},
                      start_date = '${startDateIso}',
                      end_date = '${endDateIso}',
                      total_budget = ${totalBudget !== null && totalBudget !== undefined ? totalBudget : 0},
                      q1_budget = ${q1Budget !== null && q1Budget !== undefined ? q1Budget : 'NULL'},
                      q2_budget = ${q2Budget !== null && q2Budget !== undefined ? q2Budget : 'NULL'},
                      q3_budget = ${q3Budget !== null && q3Budget !== undefined ? q3Budget : 'NULL'},
                      q4_budget = ${q4Budget !== null && q4Budget !== undefined ? q4Budget : 'NULL'},
                      total_r1_plus = ${totalR1Plus !== null && totalR1Plus !== undefined ? totalR1Plus : 'NULL'},
                      total_r3_plus = ${totalR3Plus !== null && totalR3Plus !== undefined ? totalR3Plus : 'NULL'},
                      total_trps = ${totalTrps !== null && totalTrps !== undefined ? totalTrps : 'NULL'},
                      ns_vs_wm = ${nsVsWm !== null && nsVsWm !== undefined ? `'${nsVsWm}'` : 'NULL'},
                      total_woa = ${totalWoa !== null && totalWoa !== undefined ? totalWoa : 'NULL'},
                      weeks_off_air = ${weeksOffAir !== null && weeksOffAir !== undefined ? weeksOffAir : 'NULL'},
                      weeks_live = ${weeksLive !== null && weeksLive !== undefined ? weeksLive : 'NULL'},
                      country_id = ${countryId !== null && countryId !== undefined ? countryId : 'NULL'},
                      region_id = ${regionId !== null && regionId !== undefined ? regionId : 'NULL'},
                      sub_region_id = ${subRegionId !== null && subRegionId !== undefined ? subRegionId : 'NULL'},
                      business_unit_id = ${businessUnitId !== null && businessUnitId !== undefined ? businessUnitId : 'NULL'},
                      range_id = ${rangeId !== null && rangeId !== undefined ? rangeId : 'NULL'},
                      category_id = ${categoryId !== null && categoryId !== undefined ? categoryId : 'NULL'},
                      last_update_id = ${lastUpdateId}, 
                      playbook_id = ${playbookId !== null && playbookId !== undefined ? `'${playbookId}'` : 'NULL'},
                      updated_at = '${dateNow}'
                    WHERE id = ${existingGamePlan.id || existingGamePlan.ID};
                  `;
                  
                  // Execute the raw update query
                  await prisma.$executeRawUnsafe(updateQuery);
                  
                  // Log the SQL query for debugging
                  logWithTimestamp(`Executed raw SQL query to update game plan with ID: ${existingGamePlan.id || existingGamePlan.ID}`);
                  importResults.gamePlansCount++;
                  importResults.successfulRows.push(i); // Track successful row
                  logWithTimestamp(`Updated existing game plan for ${record.Campaign} - ${record['Media Subtype']} (Row ${i+1})`);
                } else {
                  // Create new game plan - Use direct SQL query to ensure proper date format
                  // This bypasses Prisma's date handling which can be inconsistent with SQLite
                  const dateNow = new Date().toISOString();
                  
                  // Log the values we're about to use in the SQL query for INSERT
                  logWithTimestamp('Values for SQL insert:');
                  logWithTimestamp(`campaignId: ${campaignId}, mediaSubtypeId: ${mediaSubtypeId}, pmTypeId: ${pmTypeId}`);
                  logWithTimestamp(`totalBudget: ${totalBudget}`);
                  logWithTimestamp(`q1Budget: ${q1Budget}, q2Budget: ${q2Budget}, q3Budget: ${q3Budget}, q4Budget: ${q4Budget}`);
                  logWithTimestamp(`countryId: ${countryId}, regionId: ${regionId}, subRegionId: ${subRegionId}, businessUnitId: ${businessUnitId}`);
                  logWithTimestamp(`categoryId: ${categoryId}`);
                  logWithTimestamp(`playbookId: ${playbookId}`);
                  logWithTimestamp(`lastUpdateId: ${lastUpdateId} (from session data)`);
                  
                  // CRITICAL: Validate lastUpdateId before insertion
                  if (!lastUpdateId || lastUpdateId === null || lastUpdateId === undefined) {
                    logErrorWithTimestamp(`CRITICAL ERROR: lastUpdateId is invalid: ${lastUpdateId}`);
                    throw new Error(`lastUpdateId is required but got: ${lastUpdateId}`);
                  }
                  
                  logWithTimestamp(`✅ Validated lastUpdateId: ${lastUpdateId} (type: ${typeof lastUpdateId})`);
                  
                  // First create the game plan with raw SQL to ensure dates are stored as strings
                  // Use better null handling for all fields
                  const rawQuery = `
                    INSERT INTO game_plans (
                      campaign_id, media_sub_type_id, pm_type_id, 
                      start_date, end_date, 
                      total_budget, q1_budget, q2_budget, q3_budget, q4_budget,
                      total_r1_plus, total_r3_plus, total_trps, ns_vs_wm, total_woa, weeks_off_air, weeks_live, country_id, region_id, sub_region_id,
                      business_unit_id, range_id, category_id, last_update_id, playbook_id, created_at, updated_at
                    ) VALUES (
                      ${campaignId}, ${mediaSubtypeId}, ${pmTypeId !== null && pmTypeId !== undefined ? pmTypeId : 'NULL'}, 
                      '${startDateIso}', '${endDateIso}', 
                      ${totalBudget !== null && totalBudget !== undefined ? totalBudget : 0}, 
                      ${q1Budget !== null && q1Budget !== undefined ? q1Budget : 'NULL'}, 
                      ${q2Budget !== null && q2Budget !== undefined ? q2Budget : 'NULL'}, 
                      ${q3Budget !== null && q3Budget !== undefined ? q3Budget : 'NULL'}, 
                      ${q4Budget !== null && q4Budget !== undefined ? q4Budget : 'NULL'},
                      ${totalR1Plus !== null && totalR1Plus !== undefined ? totalR1Plus : 'NULL'}, 
                      ${totalR3Plus !== null && totalR3Plus !== undefined ? totalR3Plus : 'NULL'}, 
                      ${totalTrps !== null && totalTrps !== undefined ? totalTrps : 'NULL'},
                      ${nsVsWm !== null && nsVsWm !== undefined ? `'${nsVsWm}'` : 'NULL'},
                      ${totalWoa !== null && totalWoa !== undefined ? totalWoa : 'NULL'},
                      ${weeksOffAir !== null && weeksOffAir !== undefined ? weeksOffAir : 'NULL'},
                      ${weeksLive !== null && weeksLive !== undefined ? weeksLive : 'NULL'},
                      ${countryId !== null && countryId !== undefined ? countryId : 'NULL'}, 
                      ${regionId !== null && regionId !== undefined ? regionId : 'NULL'}, 
                      ${subRegionId !== null && subRegionId !== undefined ? subRegionId : 'NULL'},
                      ${businessUnitId !== null && businessUnitId !== undefined ? businessUnitId : 'NULL'}, 
                      ${rangeId !== null && rangeId !== undefined ? rangeId : 'NULL'}, 
                      ${categoryId !== null && categoryId !== undefined ? categoryId : 'NULL'}, 
                      ${lastUpdateId}, 
                      ${playbookId !== null && playbookId !== undefined ? `'${playbookId}'` : 'NULL'},
                      '${dateNow}', '${dateNow}'
                    ) RETURNING id;
                  `;
                  
                  // Log the complete SQL query for debugging
                  logWithTimestamp(`🔍 About to execute SQL query: ${rawQuery}`);
                  
                  // Execute the raw query
                  const result: any[] = await prisma.$queryRawUnsafe(rawQuery);
                  const newGamePlanId = result[0]?.id || 0;
                  
                  // Log the SQL query for debugging
                  logWithTimestamp(`Executed raw SQL query to create game plan with ID: ${newGamePlanId}`);
                  
                  // Create a mock game plan object for the rest of the code
                  const newGamePlan = {
                    id: newGamePlanId,
                    campaignId,
                    mediaSubTypeId: mediaSubtypeId,
                    pmTypeId: pmTypeId || null,
                    startDate: startDateIso,
                    endDate: endDateIso,
                    totalBudget,
                    q1Budget: q1Budget || null,
                    q2Budget: q2Budget || null,
                    q3Budget: q3Budget || null,
                    q4Budget: q4Budget || null,
                    totalR1Plus: totalR1Plus || null,
                    totalR3Plus: totalR3Plus || null,
                    totalTrps: totalTrps || null,
                    nsVsWm: nsVsWm || null,
                    totalWoa: totalWoa || null,
                    weeksOffAir: weeksOffAir || null,
                    weeksLive: weeksLive || null,
                    countryId: countryId || null,
                    regionId: regionId || null,
                    subRegionId: subRegionId || null,
                    businessUnitId: businessUnitId || null,
                    rangeId: rangeId || null,
                    playbookId: playbookId || null,
                    lastUpdateId: lastUpdateId || null,
                    createdAt: dateNow,
                    updatedAt: dateNow
                  };
                  importResults.gamePlansCount++;
                  importResults.successfulRows.push(i); // Track successful row
                  logWithTimestamp(`Created new game plan for ${record.Campaign} - ${record['Media Subtype']} (Row ${i+1})`);
                }
                processedEntities.gamePlans.add(gameplanKey);
              } catch (error: any) {
                const errorMessage = error?.message || 'Unknown error';
                logErrorWithTimestamp(`Error creating/updating game plan for record ${i}: ${errorMessage}`);
                recordErrors.push({
                  index: i,
                  error: `Error creating game plan: ${errorMessage}`,
                  campaign: record.Campaign,
                  mediaSubtype: record['Media Subtype']
                });
                importResults.failedRows.push(i); // Track failed row
              }
            } else {
              logErrorWithTimestamp(`Invalid date format for record ${i}: Start Date: ${record['Start Date']}, End Date: ${record['End Date']}`);
              recordErrors.push({
                index: i,
                error: `Invalid date format: Start Date: ${record['Start Date']}, End Date: ${record['End Date']}`,
                campaign: record.Campaign,
                mediaSubtype: record['Media Subtype']
              });
              importResults.failedRows.push(i); // Track failed row
            }
          } else {
            logErrorWithTimestamp(`Missing campaign ID or media subtype ID for record ${i}`);
            recordErrors.push({
              index: i,
              error: `Missing campaign ID or media subtype ID`,
              campaign: record.Campaign,
              mediaSubtype: record['Media Subtype']
            });
            importResults.failedRows.push(i); // Track failed row
          }
        }
      } else {
        logErrorWithTimestamp(`Missing required fields for game plan in record ${i}`);
        recordErrors.push({
          index: i,
          error: `Missing required fields for game plan`,
          campaign: record.Campaign || 'Unknown',
          mediaSubtype: record['Media Subtype'] || 'Unknown'
        });
        importResults.failedRows.push(i); // Track failed row
      }
      
      // Update progress
      if ((i + 1) % 5 === 0 || i === records.length - 1) {
        const percentage = 50 + Math.round(((i + 1) / records.length) * 50); // Second pass is remaining 50%
        sessionData.importProgress = {
          current: i + 1,
          total: records.length,
          percentage: percentage,
          stage: `Creating game plans (${i + 1}/${records.length})`
        };
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
        logWithTimestamp(`Updated second pass progress: ${percentage}%`);
      }
    } catch (error) {
      logErrorWithTimestamp(`Error creating game plan for record ${i}:`, error);
      recordErrors.push({
        index: i,
        error: `Error creating game plan: ${error instanceof Error ? error.message : String(error)}`,
        campaign: record.Campaign || 'Unknown',
        mediaSubtype: record['Media Subtype'] || 'Unknown'
      });
      importResults.failedRows.push(i); // Track failed row
    }
  }
  
  // Prepare detailed summary
  const successfulRowNumbers = importResults.successfulRows.map(i => i + 1).sort((a, b) => a - b);
  const failedRowNumbers = importResults.failedRows.map(i => i + 1).sort((a, b) => a - b);
  
  // Log detailed summary
  logWithTimestamp('Import process completed. Summary:');
  logWithTimestamp(`- Total Records: ${records.length}`);
  logWithTimestamp(`- Successfully Imported: ${importResults.successfulRows.length} (Rows: ${successfulRowNumbers.join(', ')})`);
  logWithTimestamp(`- Failed to Import: ${importResults.failedRows.length} (Rows: ${failedRowNumbers.join(', ')})`);
  logWithTimestamp(`- Game Plans Created/Updated: ${importResults.gamePlansCount}`);
  
  // Group errors by type for better analysis
  const errorsByType: Record<string, number> = {};
  recordErrors.forEach(error => {
    const errorType = error.error.includes('date') ? 'Date Format' : 
                     error.error.includes('campaign ID') ? 'Missing IDs' : 
                     error.error.includes('required fields') ? 'Missing Fields' : 'Other';
    errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
  });
  
  // Log error summary
  logWithTimestamp('Error summary by type:');
  Object.entries(errorsByType).forEach(([type, count]) => {
    logWithTimestamp(`- ${type}: ${count}`);
  });
  
  return {
    processed: records.length,
    successful: importResults.successfulRows.length,
    failed: importResults.failedRows.length,
    successfulRows: successfulRowNumbers,
    failedRows: failedRowNumbers,
    errors: recordErrors,
    errorsByType,
    results: importResults
  };
}
