import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Create a Prisma client
const prisma = new PrismaClient();

// Get PostgreSQL URL from environment or from setup-multi-db.ts output
const getPostgresUrl = () => {
  try {
    // Try to read from .postgres-url file if it exists
    const pgUrlPath = path.join(process.cwd(), '.postgres-url');
    if (fs.existsSync(pgUrlPath)) {
      return fs.readFileSync(pgUrlPath, 'utf8').trim();
    }
  } catch (error) {
    console.error('Error reading PostgreSQL URL from file:', error);
  }
  
  // Fall back to environment variable or default
  return process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/golden_rules';
};

// Main function to test the import process
async function testImportProcess() {
  console.log('=== TESTING IMPORT PROCESS ===');
  console.log('Current working directory:', process.cwd());
  
  try {
    // Step 1: Check if the sessions directory exists
    const dataDir = path.join(process.cwd(), 'data', 'sessions');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created directory: ${dataDir}`);
    } else {
      console.log(`Directory exists: ${dataDir}`);
    }
    
    // Step 2: Create a test session file with sample data
    const sessionId = `test-session-${Date.now()}`;
    const sessionFilePath = path.join(dataDir, `${sessionId}.json`);
    
    // Create sample data for testing
    const sampleData = {
      sessionId,
      sessionData: {
        fileName: 'test-import.csv',
        uploadedAt: new Date().toISOString(),
      },
      status: 'validated',
      validationResults: {
        isValid: true,
        errors: [],
        warnings: [],
      },
      records: [
        {
          year: 2025,
          subRegion: 'Test Region',
          country: 'Test Country',
          category: 'Test Category',
          range: 'Test Range',
          campaign: 'Test Campaign',
          media: 'Test Media',
          mediaSubtype: 'Test Subtype',
          pmType: 'Test PM Type',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          totalBudget: 10000,
          targetReach: 1000,
          currentReach: 800,
          targetFrequency: 5,
          currentFrequency: 4,
          targetGrps: 5000,
          currentGrps: 4000,
          reach1Plus: 800,
          reach2Plus: 600,
          reach3Plus: 400,
          businessUnit: 'Test Business Unit'
        }
      ]
    };
    
    // Write the sample data to the session file
    fs.writeFileSync(sessionFilePath, JSON.stringify(sampleData, null, 2), 'utf8');
    console.log(`Created test session file: ${sessionFilePath}`);
    
    // Step 3: Test the import API endpoint directly
    console.log('\n=== TESTING IMPORT API ENDPOINT ===');
    console.log('Session ID:', sessionId);
    
    // Simulate the import process directly without using the API
    await simulateImportProcess(sessionId, sessionFilePath);
    
    // Step 4: Check the database to see if the data was imported
    console.log('\n=== CHECKING DATABASE FOR IMPORTED DATA ===');
    await checkDatabaseForImportedData();
    
    console.log('\n=== IMPORT PROCESS TEST COMPLETED ===');
    
  } catch (error) {
    console.error('Error in test import process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to simulate the import process
async function simulateImportProcess(sessionId: string, sessionFilePath: string) {
  try {
    console.log('Reading session file...');
    const sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    console.log('Session data loaded successfully');
    console.log(`Number of records: ${sessionData.records.length}`);
    
    // Update session status to importing
    sessionData.status = 'importing';
    sessionData.importProgress = {
      current: 0,
      total: sessionData.records.length,
      percentage: 0,
      stage: 'Starting import'
    };
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2), 'utf8');
    
    console.log('Updated session status to importing');
    
    // Process the records
    const records = sessionData.records;
    const importResults = {
      subRegions: [],
      countries: [],
      categories: [],
      ranges: [],
      mediaTypes: [],
      mediaSubtypes: [],
      businessUnits: [],
      pmTypes: [],
      campaigns: [],
      campaignMedia: []
    };
    
    // Define the type for import log errors
    type ImportError = {
      record: number;
      error: string;
    };

    const importLog = {
      timestamp: new Date(),
      fileName: sessionData.sessionData.fileName,
      recordCount: records.length,
      successCount: 0,
      errorCount: 0,
      errors: [] as ImportError[],
    };
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(`Processing record ${i + 1}/${records.length}...`);
      
      try {
        // Simulate database operations
        await processRecord(record, importResults);
        importLog.successCount++;
        
        // Update progress
        sessionData.importProgress = {
          current: i + 1,
          total: records.length,
          percentage: Math.round(((i + 1) / records.length) * 100),
          stage: `Processed record ${i + 1}/${records.length}`
        };
        fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2), 'utf8');
        
      } catch (error) {
        console.error(`Error processing record ${i + 1}:`, error);
        importLog.errorCount++;
        importLog.errors.push({
          record: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Update session status to completed
    sessionData.status = 'completed';
    sessionData.importProgress = {
      current: records.length,
      total: records.length,
      percentage: 100,
      stage: 'Import completed successfully'
    };
    sessionData.importResults = importResults;
    sessionData.importLog = importLog;
    
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData, null, 2), 'utf8');
    console.log('Updated session status to completed');
    console.log('Import results:', JSON.stringify(importResults, null, 2));
    
  } catch (error) {
    console.error('Error simulating import process:', error);
    throw error;
  }
}

// Function to process a single record
async function processRecord(record: any, importResults: any) {
  // This is a simplified version of the actual import process
  // In a real implementation, this would create/update database records
  
  console.log('Processing record:', JSON.stringify(record, null, 2));
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Add the processed entities to the results
  importResults.subRegions.push({ name: record.subRegion });
  importResults.countries.push({ name: record.country, subRegion: record.subRegion });
  importResults.categories.push({ name: record.category });
  importResults.ranges.push({ name: record.range, category: record.category });
  importResults.mediaTypes.push({ name: record.media });
  importResults.mediaSubtypes.push({ name: record.mediaSubtype, mediaType: record.media });
  importResults.businessUnits.push({ name: record.businessUnit });
  importResults.pmTypes.push({ name: record.pmType });
  importResults.campaigns.push({ 
    name: record.campaign, 
    range: record.range, 
    country: record.country,
    year: record.year
  });
  importResults.campaignMedia.push({
    campaign: record.campaign,
    mediaSubtype: record.mediaSubtype,
    pmType: record.pmType,
    startDate: record.startDate,
    endDate: record.endDate,
    totalBudget: record.totalBudget,
    targetReach: record.targetReach,
    currentReach: record.currentReach,
    targetFrequency: record.targetFrequency,
    currentFrequency: record.currentFrequency,
    targetGrps: record.targetGrps,
    currentGrps: record.currentGrps,
    reach1Plus: record.reach1Plus,
    reach2Plus: record.reach2Plus,
    reach3Plus: record.reach3Plus
  });
  
  return true;
}

// Function to check the database for imported data
async function checkDatabaseForImportedData() {
  try {
    console.log('Checking database connection...');
    
    // Test the database connection
    const databaseType = await prisma.$queryRaw`SELECT current_database()`;
    console.log('Connected to database:', databaseType);
    
    // Check for imported data
    const subRegionCount = await prisma.subRegion.count();
    console.log(`SubRegions: ${subRegionCount}`);
    
    const countryCount = await prisma.mSCountry.count();
    console.log(`Countries: ${countryCount}`);
    
    const categoryCount = await prisma.category.count();
    console.log(`Categories: ${categoryCount}`);
    
    const rangeCount = await prisma.range.count();
    console.log(`Ranges: ${rangeCount}`);
    
    const campaignCount = await prisma.campaign.count();
    console.log(`Campaigns: ${campaignCount}`);
    
    const campaignMediaCount = await prisma.campaignMedia.count();
    console.log(`Campaign Media: ${campaignMediaCount}`);
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Run the test
testImportProcess().catch(error => {
  console.error('Error in test script:', error);
  process.exit(1);
});
