import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { AutoCreateValidator } from '@/lib/validation/autoCreateValidator';

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

const prisma = new PrismaClient();

logWithTimestamp('Media Sufficiency Import with Governance API route loaded');

// Enhanced import route with auto-creation governance
export async function POST(request: NextRequest) {
  logWithTimestamp('Import with Governance API called');
  let sessionId: string = '';
  let autoCreateValidator: AutoCreateValidator | null = null;
  
  try {
    // Get the session ID from the request body
    logWithTimestamp('Parsing request body...');
    const body = await request.json();
    sessionId = body.sessionId;
    const importSource = body.importSource || 'unknown'; // Track import source for governance
    logWithTimestamp(`Session ID: ${sessionId}, Import Source: ${importSource}`);
    
    if (!sessionId) {
      logErrorWithTimestamp('No session ID provided');
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }
    
    // Initialize auto-create validator
    autoCreateValidator = new AutoCreateValidator();
    
    // Read session data
    logWithTimestamp('Reading session data...');
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFilePath = path.join(sessionsDir, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFilePath)) {
      logErrorWithTimestamp(`Session file not found: ${sessionFilePath}`);
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, 'utf8'));
    logWithTimestamp('Session data loaded successfully', { 
      recordCount: sessionData.records?.length || 0,
      hasValidationResults: !!sessionData.validationResults 
    });
    
    if (!sessionData.validationResults || !sessionData.records) {
      logErrorWithTimestamp('Invalid session data - missing validation results or records');
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 400 }
      );
    }
    
    const { records, validationResults } = sessionData;
    logWithTimestamp(`Import starting for ${records.length} records`);
    
    // Check for critical errors in validation
    const criticalErrors = validationResults.issues?.filter((issue: any) => issue.severity === 'critical') || [];
    if (criticalErrors.length > 0) {
      logErrorWithTimestamp('Cannot import - critical validation errors exist', { criticalErrorCount: criticalErrors.length });
      return NextResponse.json(
        { error: 'Cannot import data with critical validation errors', criticalErrors },
        { status: 400 }
      );
    }
    
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
      logWithTimestamp(`Starting import process with governance for ${records.length} records...`);
      
      // Track import results including governance
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
        gamePlansCount: 0,
        autoCreated: {
          campaigns: 0,
          ranges: 0
        }
      };
      
      try {
        // Update progress - starting import
        updateProgress(0, 'Starting import process with auto-creation');
        
        // Process records with detailed logging
        logWithTimestamp(`Beginning to process ${records.length} records...`);
        const recordErrors: Array<{index: number, error: string}> = [];
        
        // Process records in smaller batches for better reliability
        const BATCH_SIZE = 10;
        
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          try {
            const batchEnd = Math.min(i + BATCH_SIZE, records.length);
            logWithTimestamp(`Processing batch ${i + 1} to ${batchEnd} of ${records.length}`);
            
            // Update progress for this batch
            updateProgress(i, `Processing batch ${i + 1} to ${batchEnd}`);
            
            // Process each record in the batch
            for (let recordIndex = i; recordIndex < batchEnd; recordIndex++) {
              try {
                const record = records[recordIndex];
                logWithTimestamp(`Processing record ${recordIndex + 1}: ${JSON.stringify(record).substring(0, 100)}...`);
                
                // Validate required fields
                if (!record.campaign) {
                  throw new Error(`Missing campaign for record ${recordIndex + 1}`);
                }
                
                // AUTO-CREATE CAMPAIGNS WITH GOVERNANCE
                const campaignResult = await autoCreateValidator!.validateOrCreateCampaign(
                  record.campaign, 
                  importSource
                );
                if (campaignResult.created) {
                  importResults.autoCreated.campaigns++;
                }
                
                // AUTO-CREATE RANGES WITH GOVERNANCE (if present)
                let rangeResult = null;
                if (record.range) {
                  rangeResult = await autoCreateValidator!.validateOrCreateRange(
                    record.range, 
                    importSource
                  );
                  if (rangeResult.created) {
                    importResults.autoCreated.ranges++;
                  }
                }
                
                // Create other entities (existing logic)
                let mediaSubType = null;
                if (record.mediaSubtype) {
                  mediaSubType = await prisma.mediaSubType.upsert({
                    where: { name: record.mediaSubtype },
                    update: {},
                    create: { name: record.mediaSubtype }
                  });
                  importResults.mediaSubtypesCount++;
                }

                let pmType = null;
                if (record.pmType) {
                  pmType = await prisma.pMType.upsert({
                    where: { name: record.pmType },
                    update: {},
                    create: { name: record.pmType }
                  });
                  importResults.pmTypesCount++;
                }

                let country = null;
                if (record.country) {
                  // Find or create region first
                  let region = null;
                  if (record.region) {
                    region = await prisma.region.upsert({
                      where: { name: record.region },
                      update: {},
                      create: { name: record.region }
                    });
                  }

                  country = await prisma.country.upsert({
                    where: { name: record.country },
                    update: {},
                    create: { 
                      name: record.country,
                      regionId: region?.id
                    }
                  });
                  importResults.countriesCount++;
                }

                // Create the game plan with auto-created entities
                const gamePlanData: any = {
                  campaignId: campaignResult.id,
                  mediaSubTypeId: mediaSubType?.id,
                  pmTypeId: pmType?.id,
                  countryId: country?.id,
                  burst: parseInt(record.burst) || 1,
                  startDate: record.startDate,
                  endDate: record.endDate,
                  budgetQ1: parseFloat(record.budgetQ1) || 0,
                  budgetQ2: parseFloat(record.budgetQ2) || 0,
                  budgetQ3: parseFloat(record.budgetQ3) || 0,
                  budgetQ4: parseFloat(record.budgetQ4) || 0,
                  lastUpdateId: 1, // Default for now
                  categoryId: null // Will be set if category exists
                };

                // Add range relationship if created
                if (rangeResult) {
                  // Update the campaign to link to the range
                  await prisma.campaign.update({
                    where: { id: campaignResult.id },
                    data: { rangeId: rangeResult.id }
                  });
                }

                // Create the game plan
                const gamePlan = await prisma.gamePlan.create({
                  data: gamePlanData
                });
                
                importResults.gamePlansCount++;
                logWithTimestamp(`Successfully created game plan ${recordIndex + 1} with ID ${gamePlan.id}`);
                
              } catch (recordError) {
                logErrorWithTimestamp(`Error processing record ${recordIndex + 1}`, recordError);
                recordErrors.push({
                  index: recordIndex + 1,
                  error: recordError instanceof Error ? recordError.message : String(recordError)
                });
              }
            }
            
          } catch (batchError) {
            logErrorWithTimestamp(`Error processing batch ${i + 1} to ${batchEnd}`, batchError);
            // Continue with next batch
          }
        }
        
        // Get auto-creation summary
        const autoCreateSummary = autoCreateValidator!.getAutoCreatedSummary();
        
        // Update final progress
        updateProgress(records.length, 'Import completed successfully');
        
        // Update session with final results including governance info
        sessionData.importResults = {
          ...importResults,
          autoCreateSummary,
          errors: recordErrors,
          completed: true,
          completedAt: new Date()
        };
        
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));
        
        logWithTimestamp('Import process completed successfully', {
          ...importResults,
          autoCreateSummary,
          errors: recordErrors.length
        });
        
      } catch (importError) {
        logErrorWithTimestamp('Import process failed', importError);
        
        // Update session with error
        sessionData.importResults = {
          error: importError instanceof Error ? importError.message : String(importError),
          completed: false,
          completedAt: new Date()
        };
        
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2));
      } finally {
        // Clean up auto-create validator
        if (autoCreateValidator) {
          await autoCreateValidator.disconnect();
        }
      }
    })();
    
    // Return immediate response
    logWithTimestamp('Import process started in background');
    return NextResponse.json({ 
      success: true, 
      message: 'Import with governance started',
      sessionId 
    });
    
  } catch (error) {
    logErrorWithTimestamp('Import API error', error);
    
    // Clean up auto-create validator on error
    if (autoCreateValidator) {
      try {
        await autoCreateValidator.disconnect();
      } catch (cleanupError) {
        logErrorWithTimestamp('Error cleaning up validator', cleanupError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Import failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}