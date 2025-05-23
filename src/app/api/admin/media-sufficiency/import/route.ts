import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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

// Get PostgreSQL connection URL
let postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl && fs.existsSync('.postgres-url')) {
  postgresUrl = fs.readFileSync('.postgres-url', 'utf8').trim();
  // Remove quotes if present
  postgresUrl = postgresUrl.replace(/^"|"$/g, '');
  logWithTimestamp(`Using PostgreSQL URL from .postgres-url file: ${postgresUrl}`);
}

// Create a PostgreSQL connection pool
const pgPool = new Pool({
  connectionString: postgresUrl
});

// Test PostgreSQL connection
pgPool.connect()
  .then((client: any) => {
    logWithTimestamp('Successfully connected to PostgreSQL');
    client.release();
  })
  .catch((error: Error) => {
    logErrorWithTimestamp('Failed to connect to PostgreSQL', error);
  });

// Use the standard Prisma client for SQLite operations
const prisma = new PrismaClient();

// Enhanced import route with detailed error logging
export async function POST(request: NextRequest) {
  logWithTimestamp('Import API called');
  let sessionId: string = '';
  
  try {
    // Get the session ID from the request body
    logWithTimestamp('Parsing request body...');
    const body = await request.json();
    sessionId = body.sessionId;
    logWithTimestamp(`Session ID: ${sessionId}`);
    
    if (!sessionId) {
      logErrorWithTimestamp('No session ID provided');
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }
    
    // Get the session data
    logWithTimestamp(`Getting session data for ID: ${sessionId}`);
    const sessionDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(sessionDir, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFilePath)) {
      logErrorWithTimestamp(`Session file not found: ${sessionFilePath}`);
      return NextResponse.json(
        { error: 'Session not found. Please upload and validate a file first.' },
        { status: 404 }
      );
    }
    
    // Read the session data
    logWithTimestamp(`Reading session file: ${sessionFilePath}`);
    const sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    // Check if the session has been validated
    logWithTimestamp(`Checking if session has been validated...`);
    if (sessionData.status !== 'validated') {
      logErrorWithTimestamp(`Session not validated: ${sessionId}`);
      return NextResponse.json(
        { error: 'Session not validated. Please validate the file first.' },
        { status: 400 }
      );
    }
    
    // Check if there are records to import
    logWithTimestamp(`Checking if there are records to import...`);
    const records = sessionData.records || [];
    if (records.length === 0) {
      logErrorWithTimestamp(`No records to import: ${sessionId}`);
      return NextResponse.json(
        { error: 'No records to import.' },
        { status: 400 }
      );
    }
    
    // Update session status to importing
    logWithTimestamp(`Updating session status to importing...`);
    sessionData.status = 'importing';
    sessionData.progress = 0;
    sessionData.importErrors = [];
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));
    
    // Return a response immediately to prevent timeout
    logWithTimestamp('Returning initial response to client');
    
    // Function to update progress
    function updateProgress(recordIndex: number, message: string = '') {
      const progress = Math.round((recordIndex / records.length) * 100);
      logWithTimestamp(`Updating progress: ${recordIndex}/${records.length} (${progress}%) - ${message}`);
      
      // Update session data with progress
      sessionData.progress = progress;
      sessionData.currentRecord = recordIndex;
      sessionData.lastMessage = message;
      sessionData.lastUpdated = new Date();
      
      // Write updated session data to file
      fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));
    }
    
    // Start the import process in the background
    (async () => {
      logWithTimestamp(`Starting import process for ${records.length} records...`);
      
      // Track import results
      const importResults = {
        subRegionsCount: 0,
        countriesCount: 0,
        categoriesCount: 0,
        rangesCount: 0,
        mediaTypesCount: 0,
        mediaSubtypesCount: 0,
        businessUnitsCount: 0,
        pmTypesCount: 0,
        campaignsCount: 0,
        campaignMediaCount: 0
      };
      
      try {
        // Update progress - starting import
        updateProgress(0, 'Starting import process');
        
        // Process records with detailed logging
        logWithTimestamp(`Beginning to process ${records.length} records...`);
        const recordErrors: Array<{index: number, error: string}> = [];
        
        // Track unique entities to avoid duplicates
        const processedEntities = {
          subRegions: new Map<string, number>(),
          countries: new Map<string, number>(),
          categories: new Map<string, number>(),
          ranges: new Map<string, number>(),
          mediaTypes: new Map<string, number>(),
          mediaSubtypes: new Map<string, number>(),
          businessUnits: new Map<string, number>(),
          pmTypes: new Map<string, number>(),
          campaigns: new Map<string, number>(),
        };
        
        // Process records in smaller batches for better reliability
        const BATCH_SIZE = 10;
        
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          try {
            const batchEnd = Math.min(i + BATCH_SIZE, records.length);
            logWithTimestamp(`Processing batch ${i + 1} to ${batchEnd} of ${records.length}`);
            
            // Update progress for this batch
            updateProgress(batchEnd, `Processing batch ${i + 1} to ${batchEnd} of ${records.length}`);
            
            // Process each record in the batch
            for (let j = i; j < batchEnd; j++) {
              const record = records[j];
              
              try {
                // 1. Process Sub Region
                let subRegionId: number | undefined;
                if (record.subRegion) {
                  if (!processedEntities.subRegions.has(record.subRegion)) {
                    try {
                      // Check if sub-region exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_sub_regions WHERE name = $1',
                        [record.subRegion || '']
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // Sub region exists, use its ID
                        subRegionId = checkResult.rows[0].id;
                        if (subRegionId !== undefined) {
                          processedEntities.subRegions.set(record.subRegion || '', subRegionId);
                        }
                        logWithTimestamp(`Found existing sub region: ${record.subRegion} (ID: ${subRegionId})`);
                      } else {
                        // Create new sub region
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_sub_regions (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                          [record.subRegion || '']
                        );
                        subRegionId = insertResult.rows[0].id;
                        if (subRegionId !== undefined) {
                          processedEntities.subRegions.set(record.subRegion || '', subRegionId);
                        }
                        importResults.subRegionsCount++;
                        logWithTimestamp(`Created new sub region: ${record.subRegion} (ID: ${subRegionId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing sub region: ${record.subRegion}`, error);
                      throw new Error(`Error processing sub region: ${error.message}`);
                    }
                  } else {
                    subRegionId = processedEntities.subRegions.get(record.subRegion) || 0;
                  }
                }
                
                // 2. Process Country
                let countryId: number | undefined;
                if (record.country) {
                  if (!processedEntities.countries.has(record.country)) {
                    try {
                      // Check if country exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_countries WHERE name = $1',
                        [record.country || '']
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // Country exists, use its ID
                        countryId = checkResult.rows[0].id;
                        if (countryId !== undefined) {
                          processedEntities.countries.set(record.country || '', countryId);
                        }
                        
                        // Update sub_region_id if provided
                        if (subRegionId && countryId) {
                          await pgPool.query(
                            'UPDATE ms_countries SET sub_region_id = $1, updated_at = NOW() WHERE id = $2',
                            [subRegionId, countryId]
                          );
                        }
                        
                        logWithTimestamp(`Found existing country: ${record.country} (ID: ${countryId})`);
                      } else {
                        // Create new country
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_countries (name, sub_region_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id',
                          [record.country || '', subRegionId || null]
                        );
                        countryId = insertResult.rows[0].id;
                        if (countryId !== undefined) {
                          processedEntities.countries.set(record.country || '', countryId);
                        }
                        importResults.countriesCount++;
                        logWithTimestamp(`Created new country: ${record.country} (ID: ${countryId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing country: ${record.country}`, error);
                      throw new Error(`Error processing country: ${error.message}`);
                    }
                  } else {
                    countryId = processedEntities.countries.get(record.country) || 0;
                  }
                }
                
                // 3. Process Category
                let categoryId: number | undefined;
                if (record.category) {
                  if (!processedEntities.categories.has(record.category)) {
                    try {
                      // Check if category exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_categories WHERE name = $1',
                        [record.category || '']
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // Category exists, use its ID
                        categoryId = checkResult.rows[0].id;
                        if (categoryId !== undefined) {
                          processedEntities.categories.set(record.category || '', categoryId);
                        }
                        logWithTimestamp(`Found existing category: ${record.category} (ID: ${categoryId})`);
                      } else {
                        // Create new category
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_categories (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                          [record.category || '']
                        );
                        categoryId = insertResult.rows[0].id;
                        if (categoryId !== undefined) {
                          processedEntities.categories.set(record.category || '', categoryId);
                        }
                        importResults.categoriesCount++;
                        logWithTimestamp(`Created new category: ${record.category} (ID: ${categoryId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing category: ${record.category}`, error);
                      throw new Error(`Error processing category: ${error.message}`);
                    }
                  } else {
                    categoryId = processedEntities.categories.get(record.category) || 0;
                  }
                }
                
                // 4. Process Range
                let rangeId: number | undefined;
                if (record.range) {
                  const rangeKey = `${record.range || ''}-${categoryId || 0}`;
                  if (!processedEntities.ranges.has(rangeKey)) {
                    try {
                      // Check if range exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_ranges WHERE name = $1',
                        [record.range || '']
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // Range exists, use its ID
                        rangeId = checkResult.rows[0].id;
                        if (rangeId !== undefined) {
                          processedEntities.ranges.set(rangeKey, rangeId);
                        }
                        
                        // Link range to category if both exist
                        if (categoryId && rangeId) {
                          try {
                            await pgPool.query(
                              'INSERT INTO ms_category_to_range (category_id, range_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING',
                              [categoryId, rangeId]
                            );
                          } catch (linkError: any) {
                            logErrorWithTimestamp(`Error linking category to range: ${categoryId} -> ${rangeId}`, linkError);
                            // Continue even if linking fails
                          }
                        }
                        
                        logWithTimestamp(`Found existing range: ${record.range} (ID: ${rangeId})`);
                      } else {
                        // Create new range
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_ranges (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                          [record.range || '']
                        );
                        rangeId = insertResult.rows[0].id;
                        if (rangeId !== undefined) {
                          processedEntities.ranges.set(rangeKey, rangeId);
                        }
                        
                        // Link range to category if both exist
                        if (categoryId && rangeId) {
                          try {
                            await pgPool.query(
                              'INSERT INTO ms_category_to_range (category_id, range_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT DO NOTHING',
                              [categoryId, rangeId]
                            );
                          } catch (linkError: any) {
                            logErrorWithTimestamp(`Error linking category to range: ${categoryId} -> ${rangeId}`, linkError);
                            // Continue even if linking fails
                          }
                        }
                        
                        importResults.rangesCount++;
                        logWithTimestamp(`Created new range: ${record.range} (ID: ${rangeId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing range: ${record.range}`, error);
                      throw new Error(`Error processing range: ${error.message}`);
                    }
                  } else {
                    rangeId = processedEntities.ranges.get(rangeKey) || 0;
                  }
                }
                
                // 5. Process Media Type
                let mediaTypeId: number | undefined;
                if (record.media) {
                  if (!processedEntities.mediaTypes.has(record.media)) {
                    try {
                      // Check if media type exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_media_types WHERE name = $1',
                        [record.media || '']
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // Media type exists, use its ID
                        mediaTypeId = checkResult.rows[0].id;
                        if (mediaTypeId !== undefined) {
                          processedEntities.mediaTypes.set(record.media || '', mediaTypeId);
                        }
                        logWithTimestamp(`Found existing media type: ${record.media} (ID: ${mediaTypeId})`);
                      } else {
                        // Create new media type
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_media_types (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                          [record.media || '']
                        );
                        mediaTypeId = insertResult.rows[0].id;
                        if (mediaTypeId !== undefined) {
                          processedEntities.mediaTypes.set(record.media || '', mediaTypeId);
                        }
                        importResults.mediaTypesCount++;
                        logWithTimestamp(`Created new media type: ${record.media} (ID: ${mediaTypeId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing media type: ${record.media}`, error);
                      throw new Error(`Error processing media type: ${error.message}`);
                    }
                  } else {
                    mediaTypeId = processedEntities.mediaTypes.get(record.media) || 0;
                  }
                }
                
                // 6. Process Media Subtype
                let mediaSubtypeId: number | undefined;
                if (record.mediaSubtype && mediaTypeId) {
                  const subtypeKey = `${record.mediaSubtype || ''}-${mediaTypeId || 0}`;
                  if (!processedEntities.mediaSubtypes.has(subtypeKey)) {
                    try {
                      // Check if media subtype exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_media_subtypes WHERE name = $1 AND media_type_id = $2',
                        [record.mediaSubtype, mediaTypeId || 0]
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // Media subtype exists, use its ID
                        mediaSubtypeId = checkResult.rows[0].id;
                        if (mediaSubtypeId !== undefined) {
                          processedEntities.mediaSubtypes.set(subtypeKey, mediaSubtypeId);
                        }
                        logWithTimestamp(`Found existing media subtype: ${record.mediaSubtype} (ID: ${mediaSubtypeId})`);
                      } else {
                        // Create new media subtype
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_media_subtypes (name, media_type_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id',
                          [record.mediaSubtype, mediaTypeId || 0]
                        );
                        mediaSubtypeId = insertResult.rows[0].id;
                        if (mediaSubtypeId !== undefined) {
                          processedEntities.mediaSubtypes.set(subtypeKey, mediaSubtypeId);
                        }
                        importResults.mediaSubtypesCount++;
                        logWithTimestamp(`Created new media subtype: ${record.mediaSubtype} (ID: ${mediaSubtypeId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing media subtype: ${record.mediaSubtype}`, error);
                      throw new Error(`Error processing media subtype: ${error.message}`);
                    }
                  } else {
                    const storedValue = processedEntities.mediaSubtypes.get(subtypeKey);
                    mediaSubtypeId = typeof storedValue === 'number' ? storedValue : Number(storedValue) || 0;
                  }
                }
                
                // 7. Process Business Unit
                let businessUnitId: number | undefined;
                if (record.businessUnit) {
                  if (!processedEntities.businessUnits.has(record.businessUnit)) {
                    try {
                      // Check if business unit exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_business_units WHERE name = $1',
                        [record.businessUnit || '']
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // Business unit exists, use its ID
                        businessUnitId = checkResult.rows[0].id;
                        if (businessUnitId !== undefined) {
                          processedEntities.businessUnits.set(record.businessUnit || '', businessUnitId);
                        }
                        logWithTimestamp(`Found existing business unit: ${record.businessUnit} (ID: ${businessUnitId})`);
                      } else {
                        // Create new business unit
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_business_units (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                          [record.businessUnit || '']
                        );
                        businessUnitId = insertResult.rows[0].id;
                        if (businessUnitId !== undefined) {
                          processedEntities.businessUnits.set(record.businessUnit || '', businessUnitId);
                        }
                        importResults.businessUnitsCount++;
                        logWithTimestamp(`Created new business unit: ${record.businessUnit} (ID: ${businessUnitId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing business unit: ${record.businessUnit}`, error);
                      throw new Error(`Error processing business unit: ${error.message}`);
                    }
                  } else {
                    businessUnitId = processedEntities.businessUnits.get(record.businessUnit) || 0;
                  }
                }
                
                // 8. Process PM Type
                let pmTypeId: number | undefined;
                if (record.pmType) {
                  if (!processedEntities.pmTypes.has(record.pmType)) {
                    try {
                      // Check if PM type exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_pm_types WHERE name = $1',
                        [record.pmType || '']
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // PM type exists, use its ID
                        pmTypeId = checkResult.rows[0].id;
                        if (pmTypeId !== undefined) {
                          processedEntities.pmTypes.set(record.pmType || '', pmTypeId);
                        }
                        logWithTimestamp(`Found existing PM type: ${record.pmType} (ID: ${pmTypeId})`);
                      } else {
                        // Create new PM type
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_pm_types (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
                          [record.pmType || '']
                        );
                        pmTypeId = insertResult.rows[0].id;
                        if (pmTypeId !== undefined) {
                          processedEntities.pmTypes.set(record.pmType || '', pmTypeId);
                        }
                        importResults.pmTypesCount++;
                        logWithTimestamp(`Created new PM type: ${record.pmType} (ID: ${pmTypeId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing PM type: ${record.pmType}`, error);
                      throw new Error(`Error processing PM type: ${error.message}`);
                    }
                  } else {
                    pmTypeId = processedEntities.pmTypes.get(record.pmType) || 0;
                  }
                }
                
                // 9. Process Campaign
                let campaignId: number | undefined;
                if (record.campaign && rangeId && countryId) {
                  const campaignKey = `${record.campaign || ''}-${rangeId || 0}-${countryId || 0}`;
                  if (!processedEntities.campaigns.has(campaignKey)) {
                    try {
                      // Check if campaign exists
                      const checkResult = await pgPool.query(
                        'SELECT id FROM ms_campaigns WHERE name = $1 AND range_id = $2 AND country_id = $3',
                        [record.campaign, rangeId || 0, countryId || 0]
                      );
                      
                      if (checkResult.rows.length > 0) {
                        // Campaign exists, update it
                        campaignId = checkResult.rows[0].id;
                        
                        // Update business unit and year if provided
                        if (businessUnitId || record.year) {
                          const updateFields = [];
                          const updateValues = [];
                          let paramIndex = 1;
                          
                          if (businessUnitId) {
                            updateFields.push(`business_unit_id = $${paramIndex}`);
                            updateValues.push(businessUnitId);
                            paramIndex++;
                          }
                          
                          if (record.year) {
                            updateFields.push(`year = $${paramIndex}`);
                            updateValues.push(record.year);
                            paramIndex++;
                          }
                          
                          updateFields.push(`updated_at = NOW()`);
                          
                          if (updateFields.length > 1) { // At least one field to update plus updated_at
                            await pgPool.query(
                              `UPDATE ms_campaigns SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
                              [...updateValues, campaignId]
                            );
                          }
                        }
                        
                        if (campaignId !== undefined) {
                          processedEntities.campaigns.set(campaignKey, campaignId);
                        }
                        logWithTimestamp(`Found existing campaign: ${record.campaign} (ID: ${campaignId})`);
                      } else {
                        // Create new campaign
                        const insertResult = await pgPool.query(
                          'INSERT INTO ms_campaigns (name, range_id, country_id, business_unit_id, year, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id',
                          [record.campaign, rangeId || 0, countryId || 0, businessUnitId || null, record.year || new Date().getFullYear()]
                        );
                        campaignId = insertResult.rows[0].id;
                        if (campaignId !== undefined) {
                          processedEntities.campaigns.set(campaignKey, campaignId);
                        }
                        importResults.campaignsCount++;
                        logWithTimestamp(`Created new campaign: ${record.campaign} (ID: ${campaignId})`);
                      }
                    } catch (error: any) {
                      logErrorWithTimestamp(`Error processing campaign: ${record.campaign}`, error);
                      throw new Error(`Error processing campaign: ${error.message}`);
                    }
                  } else {
                    campaignId = processedEntities.campaigns.get(campaignKey) || 0;
                  }
                }
                
                // 10. Process Campaign Media
                if (campaignId && mediaSubtypeId) {
                  try {
                    // Parse dates and numbers
                    let startDate: Date | null = null;
                    let endDate: Date | null = null;
                    
                    if (record.startDate) {
                      try {
                        startDate = new Date(record.startDate);
                        if (isNaN(startDate.getTime())) startDate = null;
                      } catch (e) {
                        logErrorWithTimestamp(`Invalid start date format: ${record.startDate}`);
                      }
                    }
                    
                    if (record.endDate) {
                      try {
                        endDate = new Date(record.endDate);
                        if (isNaN(endDate.getTime())) endDate = null;
                      } catch (e) {
                        logErrorWithTimestamp(`Invalid end date format: ${record.endDate}`);
                      }
                    }
                    
                    // Parse budget and reach values
                    const budget = typeof record.totalBudget === 'number' ? record.totalBudget : 
                                  typeof record.budget === 'number' ? record.budget : 
                                  parseFloat(record.totalBudget || record.budget || '0');
                    
                    const targetReach = typeof record.targetReach === 'number' ? record.targetReach : 
                                      parseFloat(record.targetReach || '0');
                    
                    const currentReach = typeof record.currentReach === 'number' ? record.currentReach : 
                                       parseFloat(record.currentReach || '0');
                    
                    // Check for existing campaign media entry
                    const checkResult = await pgPool.query(
                      'SELECT id FROM ms_campaign_media WHERE campaign_id = $1 AND media_subtype_id = $2',
                      [campaignId || 0, mediaSubtypeId || 0]
                    );
                    
                    if (checkResult.rows.length > 0) {
                      // Update existing campaign media
                      const campaignMediaId = checkResult.rows[0].id;
                      
                      // Build update query dynamically
                      const updateFields = [];
                      const updateValues = [];
                      let paramIndex = 1;
                      
                      // Add PM type if provided
                      if (pmTypeId) {
                        updateFields.push(`pm_type_id = $${paramIndex}`);
                        updateValues.push(pmTypeId);
                        paramIndex++;
                      }
                      
                      // Add start date if valid
                      if (startDate) {
                        updateFields.push(`start_date = $${paramIndex}`);
                        updateValues.push(startDate);
                        paramIndex++;
                      }
                      
                      // Add end date if valid
                      if (endDate) {
                        updateFields.push(`end_date = $${paramIndex}`);
                        updateValues.push(endDate);
                        paramIndex++;
                      }
                      
                      // Add budget if valid
                      if (!isNaN(budget)) {
                        updateFields.push(`budget = $${paramIndex}`);
                        updateValues.push(budget);
                        paramIndex++;
                      }
                      
                      // Add target reach if valid
                      if (!isNaN(targetReach)) {
                        updateFields.push(`target_reach = $${paramIndex}`);
                        updateValues.push(targetReach);
                        paramIndex++;
                      }
                      
                      // Add current reach if valid
                      if (!isNaN(currentReach)) {
                        updateFields.push(`current_reach = $${paramIndex}`);
                        updateValues.push(currentReach);
                        paramIndex++;
                      }
                      
                      // Add updated_at timestamp
                      updateFields.push(`updated_at = NOW()`);
                      
                      // Execute update if there are fields to update
                      if (updateFields.length > 0) {
                        await pgPool.query(
                          `UPDATE ms_campaign_media SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
                          [...updateValues, campaignMediaId]
                        );
                        logWithTimestamp(`Updated campaign media for campaign ID: ${campaignId} and media subtype ID: ${mediaSubtypeId}`);
                      }
                    } else {
                      // Create new campaign media entry
                      await pgPool.query(
                        'INSERT INTO ms_campaign_media (campaign_id, media_subtype_id, pm_type_id, start_date, end_date, budget, target_reach, current_reach, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())',
                        [
                          campaignId || 0,
                          mediaSubtypeId || 0,
                          pmTypeId || null,
                          startDate,
                          endDate,
                          isNaN(budget) ? 0 : budget,
                          isNaN(targetReach) ? 0 : targetReach,
                          isNaN(currentReach) ? 0 : currentReach
                        ]
                      );
                      importResults.campaignMediaCount++;
                      logWithTimestamp(`Created campaign media for campaign ID: ${campaignId} and media subtype ID: ${mediaSubtypeId}`);
                    }
                  } catch (error: any) {
                    logErrorWithTimestamp(`Error processing campaign media for campaign ID: ${campaignId}`, error);
                    throw new Error(`Error processing campaign media: ${error.message}`);
                  }
                }
                
              } catch (recordError: any) {
                // Log individual record errors but continue processing
                logErrorWithTimestamp(`Error processing record at index ${j}`, recordError);
                recordErrors.push({
                  index: j,
                  error: recordError.message || 'Unknown error'
                });
                
                // Add to session errors
                sessionData.importErrors.push({
                  timestamp: new Date(),
                  recordIndex: j,
                  message: recordError.message || 'Unknown error',
                  stack: recordError.stack || 'No stack trace available'
                });
              }
            }
          } catch (error: any) {
            // Log and track errors for individual records but continue processing
            logErrorWithTimestamp(`Error processing record at index ${i}`, error);
            recordErrors.push({
              index: i,
              error: error.message || 'Unknown error'
            });
            
            // Add to session errors
            sessionData.importErrors.push({
              timestamp: new Date(),
              recordIndex: i,
              message: error.message || 'Unknown error',
              stack: error.stack || 'No stack trace available'
            });
          }
        }
        
        // Log any record processing errors
        if (recordErrors.length > 0) {
          logWithTimestamp(`Completed with ${recordErrors.length} record errors`);
        }
        
        // Mark import as completed
        logWithTimestamp('Import process completed');
        sessionData.status = 'completed';
        sessionData.progress = 100;
        sessionData.importResults = importResults;
        sessionData.completedAt = new Date();
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));
      } catch (error: any) {
        // Handle any errors during the import process
        logErrorWithTimestamp('Error during import process', error);
        sessionData.status = 'error';
        sessionData.error = error.message || 'Unknown error';
        sessionData.errorStack = error.stack || 'No stack trace available';
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));
      }
    })();
    
    // Return a success response
    return NextResponse.json({ success: true, message: 'Import process started' });
  } catch (error: any) {
    // Handle any errors during the request processing
    logErrorWithTimestamp('Error processing import request', error);
    return NextResponse.json(
      { 
        error: 'Import failed', 
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
