import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

// Get the current username for PostgreSQL connection
const username = execSync('whoami').toString().trim();

// Save original .env content
const envPath = path.join(process.cwd(), '.env');
const originalEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

// Create PostgreSQL connection string
const pgConnectionString = `postgresql://${username}@localhost:5432/golden_rules`;

// Create SQLite connection string (assuming it's in the .env file)
const sqliteConnectionString = process.env.DATABASE_URL || 'file:./dev.db';

// Create Prisma clients with explicit connection strings
const pgClient = new PrismaClient({
  datasources: {
    db: {
      url: pgConnectionString
    }
  }
});

// Create a SQLite client with explicit connection
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: sqliteConnectionString
    }
  }
});

async function compareDatabases() {
  console.log('Comparing PostgreSQL and SQLite databases...');
  
  try {
    // Compare counts for each table
    console.log('\n=== Record Count Comparison ===');
    
    // SubRegions
    const pgSubRegionCount = await pgClient.subRegion.count();
    const sqliteSubRegionCount = await sqliteClient.subRegion.count();
    console.log(`SubRegions: PostgreSQL=${pgSubRegionCount}, SQLite=${sqliteSubRegionCount}, Match=${pgSubRegionCount === sqliteSubRegionCount ? 'Yes' : 'No'}`);
    
    // Countries
    const pgCountryCount = await pgClient.mSCountry.count();
    const sqliteCountryCount = await sqliteClient.mSCountry.count();
    console.log(`Countries: PostgreSQL=${pgCountryCount}, SQLite=${sqliteCountryCount}, Match=${pgCountryCount === sqliteCountryCount ? 'Yes' : 'No'}`);
    
    // Categories
    const pgCategoryCount = await pgClient.category.count();
    const sqliteCategoryCount = await sqliteClient.category.count();
    console.log(`Categories: PostgreSQL=${pgCategoryCount}, SQLite=${sqliteCategoryCount}, Match=${pgCategoryCount === sqliteCategoryCount ? 'Yes' : 'No'}`);
    
    // Ranges
    const pgRangeCount = await pgClient.range.count();
    const sqliteRangeCount = await sqliteClient.range.count();
    console.log(`Ranges: PostgreSQL=${pgRangeCount}, SQLite=${sqliteRangeCount}, Match=${pgRangeCount === sqliteRangeCount ? 'Yes' : 'No'}`);
    
    // MediaTypes
    const pgMediaTypeCount = await pgClient.mediaType.count();
    const sqliteMediaTypeCount = await sqliteClient.mediaType.count();
    console.log(`Media Types: PostgreSQL=${pgMediaTypeCount}, SQLite=${sqliteMediaTypeCount}, Match=${pgMediaTypeCount === sqliteMediaTypeCount ? 'Yes' : 'No'}`);
    
    // MediaSubtypes
    const pgMediaSubtypeCount = await pgClient.mediaSubtype.count();
    const sqliteMediaSubtypeCount = await sqliteClient.mediaSubtype.count();
    console.log(`Media Subtypes: PostgreSQL=${pgMediaSubtypeCount}, SQLite=${sqliteMediaSubtypeCount}, Match=${pgMediaSubtypeCount === sqliteMediaSubtypeCount ? 'Yes' : 'No'}`);
    
    // BusinessUnits
    const pgBusinessUnitCount = await pgClient.businessUnit.count();
    const sqliteBusinessUnitCount = await sqliteClient.businessUnit.count();
    console.log(`Business Units: PostgreSQL=${pgBusinessUnitCount}, SQLite=${sqliteBusinessUnitCount}, Match=${pgBusinessUnitCount === sqliteBusinessUnitCount ? 'Yes' : 'No'}`);
    
    // PMTypes
    const pgPMTypeCount = await pgClient.pMType.count();
    const sqlitePMTypeCount = await sqliteClient.pMType.count();
    console.log(`PM Types: PostgreSQL=${pgPMTypeCount}, SQLite=${sqlitePMTypeCount}, Match=${pgPMTypeCount === sqlitePMTypeCount ? 'Yes' : 'No'}`);
    
    // Campaigns
    const pgCampaignCount = await pgClient.campaign.count();
    const sqliteCampaignCount = await sqliteClient.campaign.count();
    console.log(`Campaigns: PostgreSQL=${pgCampaignCount}, SQLite=${sqliteCampaignCount}, Match=${pgCampaignCount === sqliteCampaignCount ? 'Yes' : 'No'}`);
    
    // CampaignMedia
    const pgCampaignMediaCount = await pgClient.campaignMedia.count();
    const sqliteCampaignMediaCount = await sqliteClient.campaignMedia.count();
    console.log(`Campaign Media: PostgreSQL=${pgCampaignMediaCount}, SQLite=${sqliteCampaignMediaCount}, Match=${pgCampaignMediaCount === sqliteCampaignMediaCount ? 'Yes' : 'No'}`);
    
    // Check if all counts match
    const allMatch = 
      pgSubRegionCount === sqliteSubRegionCount &&
      pgCountryCount === sqliteCountryCount &&
      pgCategoryCount === sqliteCategoryCount &&
      pgRangeCount === sqliteRangeCount &&
      pgMediaTypeCount === sqliteMediaTypeCount &&
      pgMediaSubtypeCount === sqliteMediaSubtypeCount &&
      pgBusinessUnitCount === sqliteBusinessUnitCount &&
      pgPMTypeCount === sqlitePMTypeCount &&
      pgCampaignCount === sqliteCampaignCount &&
      pgCampaignMediaCount === sqliteCampaignMediaCount;
    
    console.log(`\nOverall Sync Status: ${allMatch ? 'SYNCHRONIZED' : 'NOT SYNCHRONIZED'}`);
    
    if (!allMatch) {
      console.log('\nTo synchronize the databases, run:');
      console.log('npx ts-node scripts/sync-databases.ts pg-to-sqlite  # To sync from PostgreSQL to SQLite');
      console.log('npx ts-node scripts/sync-databases.ts sqlite-to-pg  # To sync from SQLite to PostgreSQL');
    }
    
  } catch (error) {
    console.error('Error during comparison:', error);
  } finally {
    // Disconnect from both databases
    await pgClient.$disconnect();
    await sqliteClient.$disconnect();
  }
}

// Run the comparison
compareDatabases();
