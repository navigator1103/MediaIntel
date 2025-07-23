import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseDate, formatDateForStorage, areDatesEqual } from '@/lib/utils/dateUtils';

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

// Helper function to parse numeric values from strings
function parseNumeric(value: string | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  
  // If it's already a number, return it directly
  if (typeof value === 'number') return value;
  
  // Convert to string to ensure we're working with a string
  const valueStr = String(value).trim();
  if (valueStr === '') return null;
  
  try {
    // Remove commas, currency symbols, and other non-numeric characters except decimal point
    const cleanValue = valueStr.replace(/[^0-9.\-]/g, '');
    const parsed = parseFloat(cleanValue);
    
    // Log the parsing for debugging
    console.log(`Parsing numeric value: '${value}' -> '${cleanValue}' -> ${parsed}`);
    
    return isNaN(parsed) ? null : parsed;
  } catch (error) {
    console.error(`Error parsing numeric value: '${value}'`, error);
    return null;
  }
}

// Initialize Prisma client for SQLite operations
const prisma = new PrismaClient();

// Path to the sessions directory where session files are stored
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

// Enhanced import route with detailed error logging
export async function POST(request: NextRequest) {
  logWithTimestamp('Import to SQLite API called');
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
    
    // Check if session file exists
    const sessionFilePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    logWithTimestamp(`Looking for session file: ${sessionFilePath}`);
    
    if (!fs.existsSync(sessionFilePath)) {
      logErrorWithTimestamp(`Session file not found: ${sessionFilePath}`);
      return NextResponse.json(
        { error: 'Session file not found' },
        { status: 404 }
      );
    }
    
    // Read the session data from the file
    const sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    // The records are stored directly in the session data in the 'records' field
    const records = sessionData.records || [];
    
    if (!records || records.length === 0) {
      logErrorWithTimestamp('No records found in session data');
      return NextResponse.json(
        { error: 'No records found in session data' },
        { status: 400 }
      );
    }
    
    logWithTimestamp(`Found ${records.length} records in session data`);
    
    // Update the session file with initial progress information
    sessionData.importProgress = {
      current: 0,
      total: records.length,
      percentage: 0,
      stage: 'Starting import process'
    };
    sessionData.status = 'importing';
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
    logWithTimestamp(`Updated session file with initial progress information`);
    
    // Start the import process asynchronously
    (async () => {
      try {
        const results = await processImport(records, sessionData, sessionFilePath);
        
        // Update the session file with completion information
        sessionData.importProgress = {
          current: records.length,
          total: records.length,
          percentage: 100,
          stage: 'Import completed'
        };
        
        // Update the session file with completion information
        sessionData.status = 'imported';
        
        sessionData.importErrors = results.errors;
        sessionData.importResults = results.results;
        
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
  sessionFilePath: string
) {
  logWithTimestamp(`Starting import process for ${records.length} records to SQLite...`);
  
  // Track processed entities to avoid duplicates
  const processedEntities = {
    ranges: new Map<string, number>(),
    mediaSubTypes: new Map<string, number>(),
    pmTypes: new Map<string, number>(),
    campaigns: new Map<string, number>(),
    gamePlans: new Set<string>()
  };
  
  // Track results
  const importResults = {
    rangesCount: 0,
    mediaSubtypesCount: 0,
    pmTypesCount: 0,
    campaignsCount: 0,
    gamePlansCount: 0,
    successfulRows: [] as number[],  // Track successfully imported row indexes
    failedRows: [] as number[]       // Track failed row indexes
  };
  
  // Track errors
  const recordErrors: { index: number; error: string; campaign?: string; mediaSubtype?: string }[] = [];
  
  // First pass: collect all unique entities
  logWithTimestamp('First pass: collecting unique entities...');
  
  // Process ranges
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    try {
      // Process range
      if (record.Range && !processedEntities.ranges.has(record.Range)) {
        const existingRange = await prisma.range.findFirst({
          where: { name: record.Range }
        });
        
        if (existingRange) {
          processedEntities.ranges.set(record.Range, existingRange.id);
          logWithTimestamp(`Found existing range: ${record.Range} (ID: ${existingRange.id})`);
        } else {
          const newRange = await prisma.range.create({
            data: {
              name: record.Range,
              createdAt: new Date().toISOString() // Use ISO string with Z suffix
            }
          });
          processedEntities.ranges.set(record.Range, newRange.id);
          importResults.rangesCount++;
          logWithTimestamp(`Created new range: ${record.Range} (ID: ${newRange.id})`);
        }
      }
      
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
      
      // Process campaign
      if (record.Campaign && record.Range) {
        const campaignKey = `${record.Campaign}-${record.Range}`;
        
        if (!processedEntities.campaigns.has(campaignKey)) {
          const rangeId = processedEntities.ranges.get(record.Range);
          
          if (rangeId) {
            const existingCampaign = await prisma.campaign.findFirst({
              where: {
                name: record.Campaign,
                rangeId: rangeId
              }
            });
            
            if (existingCampaign) {
              processedEntities.campaigns.set(campaignKey, existingCampaign.id);
              logWithTimestamp(`Found existing campaign: ${record.Campaign} (ID: ${existingCampaign.id})`);
            } else {
              const newCampaign = await prisma.campaign.create({
                data: {
                  name: record.Campaign,
                  rangeId: rangeId,
                  createdAt: new Date().toISOString() // Use ISO string with Z suffix
                }
              });
              processedEntities.campaigns.set(campaignKey, newCampaign.id);
              importResults.campaignsCount++;
              logWithTimestamp(`Created new campaign: ${record.Campaign} (ID: ${newCampaign.id})`);
            }
          } else {
            logErrorWithTimestamp(`Range ID not found for ${record.Range}`);
          }
        }
      }
      
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
      // Log the record for debugging
      console.log(`Processing record ${i+1}:`, {
        Campaign: record.Campaign,
        Range: record.Range,
        'Media Subtype': record['Media Subtype'],
        'Start Date': record['Start Date'],
        'End Date': record['End Date']
      });
      
      // More flexible validation - try to process even if some fields might be missing
      // We'll handle missing fields gracefully inside the processing logic
      if ((record.Campaign || record.campaign) && 
          (record.Range || record.range) && 
          (record['Media Subtype'] || record['Media Subtype'.toLowerCase()] || record.mediaSubtype)) {
        const campaignKey = `${record.Campaign}-${record.Range}`;
        const gameplanKey = `${record.Campaign}-${record['Media Subtype']}-${record['Start Date']}-${record['End Date']}`;
        
        if (!processedEntities.gamePlans.has(gameplanKey)) {
          const campaignId = processedEntities.campaigns.get(campaignKey);
          const mediaSubtypeId = processedEntities.mediaSubTypes.get(record['Media Subtype']);
          const pmTypeId = record['PM Type'] ? processedEntities.pmTypes.get(record['PM Type']) : null;
          
          if (campaignId && mediaSubtypeId) {
            // Parse dates using the shared date utility and format for storage
            // Try different field names for dates in case of case sensitivity issues
            const startDateValue = record['Start Date'] || record['start date'] || record.startDate || record.start_date;
            const endDateValue = record['End Date'] || record['end date'] || record.endDate || record.end_date;
            
            console.log(`Date values for row ${i+1}:`, {
              'Start Date (original)': record['Start Date'],
              'End Date (original)': record['End Date'],
              'startDateValue': startDateValue,
              'endDateValue': endDateValue
            });
            
            // Parse the dates
            const startDate = startDateValue ? parseDate(startDateValue) : null;
            const endDate = endDateValue ? parseDate(endDateValue) : null;
            
            // Log the parsed dates
            console.log(`Parsed dates for row ${i+1}:`, {
              startDate: startDate ? startDate.toISOString() : null,
              endDate: endDate ? endDate.toISOString() : null
            });
            
            // Use default dates if missing
            const validStartDate = startDate || new Date();
            const validEndDate = endDate || new Date(new Date().setMonth(new Date().getMonth() + 3)); // Default to 3 months from now
            
            // Format dates as ISO strings with Z suffix for storage
            const startDateIso = formatDateForStorage(validStartDate);
            const endDateIso = formatDateForStorage(validEndDate);
            
            // Log the formatted dates
            console.log(`Formatted dates for row ${i+1}:`, {
              startDateIso,
              endDateIso
            });
            
            // Use fallback ISO strings if formatting fails
            const finalStartDateIso = startDateIso || validStartDate.toISOString();
            const finalEndDateIso = endDateIso || validEndDate.toISOString();
            
            // Log the original and parsed dates for debugging
            if (startDate) {
              logWithTimestamp(`Parsed start date: ${startDateValue} -> ${startDate.toISOString()}`);
            } else {
              logErrorWithTimestamp(`Failed to parse start date: ${startDateValue}`);
            }
            
            if (endDate) {
              logWithTimestamp(`Parsed end date: ${endDateValue} -> ${endDate.toISOString()}`);
            } else {
              logErrorWithTimestamp(`Failed to parse end date: ${endDateValue}`);
            }
            
            // Always proceed with valid dates (either parsed or default)
            // Parse budget values - check both Budget and totalBudget fields
            // Log the budget values for debugging
            console.log(`Budget values for row ${i+1}:`, {
                Budget: record.Budget,
                totalBudget: record.totalBudget,
                Q1Budget: record.Q1Budget,
                Q2Budget: record.Q2Budget,
                Q3Budget: record.Q3Budget,
                Q4Budget: record.Q4Budget
            });
              
            // Try to get the budget from either Budget or totalBudget field
            let totalBudget = parseNumeric(record.Budget);
            if (totalBudget === null) {
                totalBudget = parseNumeric(record.totalBudget);
            }
            // Default to 0 if still null
            totalBudget = totalBudget ?? 0;
            
            // Parse quarterly budgets
            const q1Budget = parseNumeric(record.Q1Budget);
            const q2Budget = parseNumeric(record.Q2Budget);
            const q3Budget = parseNumeric(record.Q3Budget);
            const q4Budget = parseNumeric(record.Q4Budget);
              
            // Parse reach values
            const targetReach = parseNumeric(record['Target Reach']);
            const currentReach = parseNumeric(record['Current Reach']);
              
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
                    AND start_date = '${finalStartDateIso}'
                    AND end_date = '${finalEndDateIso}';
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
                  
                  // Use direct SQL to update the game plan
                  const updateQuery = `
                    UPDATE game_plans SET
                      pm_type_id = ${pmTypeId || 'NULL'},
                      start_date = '${finalStartDateIso}',
                      end_date = '${finalEndDateIso}',
                      total_budget = ${totalBudget},
                      q1_budget = ${q1Budget || 'NULL'},
                      q2_budget = ${q2Budget || 'NULL'},
                      q3_budget = ${q3Budget || 'NULL'},
                      q4_budget = ${q4Budget || 'NULL'},
                      reach_1_plus = ${targetReach || 'NULL'},
                      reach_3_plus = ${currentReach || 'NULL'},
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
                  
                  // First create the game plan with raw SQL to ensure dates are stored as strings
                  const rawQuery = `
                    INSERT INTO game_plans (
                      campaign_id, media_sub_type_id, pm_type_id, 
                      start_date, end_date, 
                      total_budget, q1_budget, q2_budget, q3_budget, q4_budget,
                      reach_1_plus, reach_3_plus, created_at, updated_at
                    ) VALUES (
                      ${campaignId}, ${mediaSubtypeId}, ${pmTypeId || 'NULL'}, 
                      '${finalStartDateIso}', '${finalEndDateIso}', 
                      ${totalBudget}, ${q1Budget || 'NULL'}, ${q2Budget || 'NULL'}, ${q3Budget || 'NULL'}, ${q4Budget || 'NULL'},
                      ${targetReach || 'NULL'}, ${currentReach || 'NULL'}, '${dateNow}', '${dateNow}'
                    ) RETURNING id;
                  `;
                  
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
                    reach1Plus: targetReach || null,
                    reach3Plus: currentReach || null,
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
