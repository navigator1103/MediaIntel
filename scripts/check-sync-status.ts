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

// Create temporary .env files for different database connections
const pgEnvContent = `DATABASE_URL=postgresql://${username}@localhost:5432/golden_rules`;
const sqliteEnvContent = originalEnv; // Assuming original .env has SQLite connection

async function checkSyncStatus() {
  console.log('Checking database synchronization status...');
  
  try {
    // First check SQLite data
    console.log('\n=== SQLite Data Summary ===');
    fs.writeFileSync(envPath, sqliteEnvContent);
    
    const sqliteClient = new PrismaClient();
    
    // Count records in SQLite
    const sqliteSubRegionCount = await sqliteClient.subRegion.count();
    const sqliteCountryCount = await sqliteClient.mSCountry.count();
    const sqliteCategoryCount = await sqliteClient.category.count();
    const sqliteRangeCount = await sqliteClient.range.count();
    const sqliteMediaTypeCount = await sqliteClient.mediaType.count();
    const sqliteMediaSubtypeCount = await sqliteClient.mediaSubtype.count();
    const sqliteBusinessUnitCount = await sqliteClient.businessUnit.count();
    const sqlitePMTypeCount = await sqliteClient.pMType.count();
    const sqliteCampaignCount = await sqliteClient.campaign.count();
    const sqliteCampaignMediaCount = await sqliteClient.campaignMedia.count();
    
    console.log(`SubRegions: ${sqliteSubRegionCount}`);
    console.log(`Countries: ${sqliteCountryCount}`);
    console.log(`Categories: ${sqliteCategoryCount}`);
    console.log(`Ranges: ${sqliteRangeCount}`);
    console.log(`Media Types: ${sqliteMediaTypeCount}`);
    console.log(`Media Subtypes: ${sqliteMediaSubtypeCount}`);
    console.log(`Business Units: ${sqliteBusinessUnitCount}`);
    console.log(`PM Types: ${sqlitePMTypeCount}`);
    console.log(`Campaigns: ${sqliteCampaignCount}`);
    console.log(`Campaign Media: ${sqliteCampaignMediaCount}`);
    
    // Disconnect from SQLite
    await sqliteClient.$disconnect();
    
    // Now check PostgreSQL data
    console.log('\n=== PostgreSQL Data Summary ===');
    fs.writeFileSync(envPath, pgEnvContent);
    
    const pgClient = new PrismaClient();
    
    // Count records in PostgreSQL
    const pgSubRegionCount = await pgClient.subRegion.count();
    const pgCountryCount = await pgClient.mSCountry.count();
    const pgCategoryCount = await pgClient.category.count();
    const pgRangeCount = await pgClient.range.count();
    const pgMediaTypeCount = await pgClient.mediaType.count();
    const pgMediaSubtypeCount = await pgClient.mediaSubtype.count();
    const pgBusinessUnitCount = await pgClient.businessUnit.count();
    const pgPMTypeCount = await pgClient.pMType.count();
    const pgCampaignCount = await pgClient.campaign.count();
    const pgCampaignMediaCount = await pgClient.campaignMedia.count();
    
    console.log(`SubRegions: ${pgSubRegionCount}`);
    console.log(`Countries: ${pgCountryCount}`);
    console.log(`Categories: ${pgCategoryCount}`);
    console.log(`Ranges: ${pgRangeCount}`);
    console.log(`Media Types: ${pgMediaTypeCount}`);
    console.log(`Media Subtypes: ${pgMediaSubtypeCount}`);
    console.log(`Business Units: ${pgBusinessUnitCount}`);
    console.log(`PM Types: ${pgPMTypeCount}`);
    console.log(`Campaigns: ${pgCampaignCount}`);
    console.log(`Campaign Media: ${pgCampaignMediaCount}`);
    
    // Disconnect from PostgreSQL
    await pgClient.$disconnect();
    
    // Compare counts and determine sync status
    console.log('\n=== Synchronization Status ===');
    
    const subRegionsInSync = pgSubRegionCount === sqliteSubRegionCount;
    const countriesInSync = pgCountryCount === sqliteCountryCount;
    const categoriesInSync = pgCategoryCount === sqliteCategoryCount;
    const rangesInSync = pgRangeCount === sqliteRangeCount;
    const mediaTypesInSync = pgMediaTypeCount === sqliteMediaTypeCount;
    const mediaSubtypesInSync = pgMediaSubtypeCount === sqliteMediaSubtypeCount;
    const businessUnitsInSync = pgBusinessUnitCount === sqliteBusinessUnitCount;
    const pmTypesInSync = pgPMTypeCount === sqlitePMTypeCount;
    const campaignsInSync = pgCampaignCount === sqliteCampaignCount;
    const campaignMediaInSync = pgCampaignMediaCount === sqliteCampaignMediaCount;
    
    console.log(`SubRegions: ${subRegionsInSync ? '✅' : '❌'} (PG: ${pgSubRegionCount}, SQLite: ${sqliteSubRegionCount})`);
    console.log(`Countries: ${countriesInSync ? '✅' : '❌'} (PG: ${pgCountryCount}, SQLite: ${sqliteCountryCount})`);
    console.log(`Categories: ${categoriesInSync ? '✅' : '❌'} (PG: ${pgCategoryCount}, SQLite: ${sqliteCategoryCount})`);
    console.log(`Ranges: ${rangesInSync ? '✅' : '❌'} (PG: ${pgRangeCount}, SQLite: ${sqliteRangeCount})`);
    console.log(`Media Types: ${mediaTypesInSync ? '✅' : '❌'} (PG: ${pgMediaTypeCount}, SQLite: ${sqliteMediaTypeCount})`);
    console.log(`Media Subtypes: ${mediaSubtypesInSync ? '✅' : '❌'} (PG: ${pgMediaSubtypeCount}, SQLite: ${sqliteMediaSubtypeCount})`);
    console.log(`Business Units: ${businessUnitsInSync ? '✅' : '❌'} (PG: ${pgBusinessUnitCount}, SQLite: ${sqliteBusinessUnitCount})`);
    console.log(`PM Types: ${pmTypesInSync ? '✅' : '❌'} (PG: ${pgPMTypeCount}, SQLite: ${sqlitePMTypeCount})`);
    console.log(`Campaigns: ${campaignsInSync ? '✅' : '❌'} (PG: ${pgCampaignCount}, SQLite: ${sqliteCampaignCount})`);
    console.log(`Campaign Media: ${campaignMediaInSync ? '✅' : '❌'} (PG: ${pgCampaignMediaCount}, SQLite: ${sqliteCampaignMediaCount})`);
    
    const allInSync = subRegionsInSync && countriesInSync && categoriesInSync && rangesInSync && 
                      mediaTypesInSync && mediaSubtypesInSync && businessUnitsInSync && 
                      pmTypesInSync && campaignsInSync && campaignMediaInSync;
    
    console.log(`\nOverall Sync Status: ${allInSync ? '✅ SYNCHRONIZED' : '❌ NOT SYNCHRONIZED'}`);
    
    if (!allInSync) {
      console.log('\nTo synchronize the databases, run one of the following commands:');
      console.log('npx ts-node scripts/sync-databases.ts pg-to-sqlite  # To sync from PostgreSQL to SQLite');
      console.log('npx ts-node scripts/sync-databases.ts sqlite-to-pg  # To sync from SQLite to PostgreSQL');
    }
    
  } catch (error) {
    console.error('Error during sync check:', error);
  } finally {
    // Restore the original .env file
    fs.writeFileSync(envPath, originalEnv);
    console.log('\nRestored original .env file.');
  }
}

// Run the sync check
checkSyncStatus();
