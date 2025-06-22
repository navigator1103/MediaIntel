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

// Use the standard Prisma client for SQLite operations
const prisma = new PrismaClient();

logWithTimestamp('Media Sufficiency API route loaded, Prisma client status: Initialized');

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
        gamePlansCount: 0
      };
      
      try {
        // Update progress - starting import
        updateProgress(0, 'Starting import process');
        
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
            updateProgress(batchEnd, `Processing batch ${i + 1} to ${batchEnd} of ${records.length}`);
            
            // Process each record in the batch
            for (let j = i; j < batchEnd; j++) {
              const record = records[j];
              
              try {
                // Process GamePlan record using Prisma
                const gamePlanData: any = {
                  startDate: record.startDate || new Date().toISOString().split('T')[0],
                  endDate: record.endDate || new Date().toISOString().split('T')[0],
                  totalBudget: parseFloat(record.totalBudget || record.budget || '0'),
                  q1Budget: parseFloat(record.q1Budget || '0') || null,
                  q2Budget: parseFloat(record.q2Budget || '0') || null,
                  q3Budget: parseFloat(record.q3Budget || '0') || null,
                  q4Budget: parseFloat(record.q4Budget || '0') || null,
                  trps: parseFloat(record.trps || '0') || null,
                  reach1Plus: parseFloat(record.reach1Plus || '0') || null,
                  reach3Plus: parseFloat(record.reach3Plus || '0') || null,
                  year: parseInt(record.year || new Date().getFullYear().toString()),
                };

                // Find or create related entities
                let campaign = null;
                if (record.campaign) {
                  campaign = await prisma.campaign.upsert({
                    where: { name: record.campaign },
                    update: {},
                    create: { name: record.campaign }
                  });
                  importResults.campaignsCount++;
                }

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
                      regionId: region?.id || 1 // Default to first region if not found
                    }
                  });
                  importResults.countriesCount++;
                }

                // Create the GamePlan
                if (campaign && mediaSubType) {
                  gamePlanData.campaignId = campaign.id;
                  gamePlanData.mediaSubTypeId = mediaSubType.id;
                  gamePlanData.pmTypeId = pmType?.id;
                  gamePlanData.countryId = country?.id;

                  await prisma.gamePlan.create({
                    data: gamePlanData
                  });
                  importResults.gamePlansCount++;
                  
                  logWithTimestamp(`Created GamePlan for campaign: ${record.campaign}`);
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
            logErrorWithTimestamp(`Error processing batch starting at index ${i}`, error);
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
      } finally {
        await prisma.$disconnect();
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