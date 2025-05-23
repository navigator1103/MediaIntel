import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

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

// Create a custom PostgreSQL client
const pgClient = new PrismaClient({
  datasources: {
    db: {
      url: getPostgresUrl()
    }
  }
});

// Create a SQLite client (using the default connection string from .env)
const sqliteClient = new PrismaClient();

async function checkDatabases() {
  try {
    console.log('=== CHECKING BOTH DATABASES ===');
    
    // Check PostgreSQL Database
    console.log('\n=== POSTGRESQL DATABASE ===');
    await checkPostgresDatabase();
    
    // Check SQLite Database
    console.log('\n=== SQLITE DATABASE ===');
    await checkSQLiteDatabase();
    
  } catch (error) {
    console.error('Error checking databases:', error);
  } finally {
    await pgClient.$disconnect();
    await sqliteClient.$disconnect();
  }
}

async function checkPostgresDatabase() {
  try {
    console.log('Checking PostgreSQL database contents...');
    
    // Check SubRegions
    const subRegionCount = await pgClient.subRegion.count();
    console.log(`SubRegions: ${subRegionCount}`);
    
    // Check Countries
    const countryCount = await pgClient.mSCountry.count();
    console.log(`Countries: ${countryCount}`);
    
    // Check Categories
    const categoryCount = await pgClient.category.count();
    console.log(`Categories: ${categoryCount}`);
    
    // Check Ranges
    const rangeCount = await pgClient.range.count();
    console.log(`Ranges: ${rangeCount}`);
    
    // Check Media Types
    const mediaTypeCount = await pgClient.mediaType.count();
    console.log(`Media Types: ${mediaTypeCount}`);
    
    // Check Media Subtypes
    const mediaSubtypeCount = await pgClient.mediaSubtype.count();
    console.log(`Media Subtypes: ${mediaSubtypeCount}`);
    
    // Check Business Units
    const businessUnitCount = await pgClient.businessUnit.count();
    console.log(`Business Units: ${businessUnitCount}`);
    
    // Check PM Types
    const pmTypeCount = await pgClient.pMType.count();
    console.log(`PM Types: ${pmTypeCount}`);
    
    // Check Campaigns
    const campaignCount = await pgClient.campaign.count();
    console.log(`Campaigns: ${campaignCount}`);
    
    // Check Campaign Media
    const campaignMediaCount = await pgClient.campaignMedia.count();
    console.log(`Campaign Media: ${campaignMediaCount}`);
    
    // If there are campaigns, show a sample
    if (campaignCount > 0) {
      const sampleCampaigns = await pgClient.campaign.findMany({
        take: 3,
        include: {
          range: true,
          country: true
        }
      });
      
      console.log('\nSample Campaigns:');
      sampleCampaigns.forEach(campaign => {
        console.log(`- ${campaign.name} (Year: ${campaign.year}, Country: ${campaign.country?.name}, Range: ${campaign.range?.name})`);
      });
    }
  } catch (error) {
    console.error('Error checking PostgreSQL database:', error);
  }
}

async function checkSQLiteDatabase() {
  try {
    console.log('Checking SQLite database contents...');
    
    // Check SubRegions
    const subRegionCount = await sqliteClient.subRegion.count();
    console.log(`SubRegions: ${subRegionCount}`);
    
    // Check Countries
    const countryCount = await sqliteClient.mSCountry.count();
    console.log(`Countries: ${countryCount}`);
    
    // Check Categories
    const categoryCount = await sqliteClient.category.count();
    console.log(`Categories: ${categoryCount}`);
    
    // Check Ranges
    const rangeCount = await sqliteClient.range.count();
    console.log(`Ranges: ${rangeCount}`);
    
    // Check Media Types
    const mediaTypeCount = await sqliteClient.mediaType.count();
    console.log(`Media Types: ${mediaTypeCount}`);
    
    // Check Media Subtypes
    const mediaSubtypeCount = await sqliteClient.mediaSubtype.count();
    console.log(`Media Subtypes: ${mediaSubtypeCount}`);
    
    // Check Business Units
    const businessUnitCount = await sqliteClient.businessUnit.count();
    console.log(`Business Units: ${businessUnitCount}`);
    
    // Check PM Types
    const pmTypeCount = await sqliteClient.pMType.count();
    console.log(`PM Types: ${pmTypeCount}`);
    
    // Check Campaigns
    const campaignCount = await sqliteClient.campaign.count();
    console.log(`Campaigns: ${campaignCount}`);
    
    // Check Campaign Media
    const campaignMediaCount = await sqliteClient.campaignMedia.count();
    console.log(`Campaign Media: ${campaignMediaCount}`);
    
    // If there are campaigns, show a sample
    if (campaignCount > 0) {
      const sampleCampaigns = await sqliteClient.campaign.findMany({
        take: 3,
        include: {
          range: true,
          country: true
        }
      });
      
      console.log('\nSample Campaigns:');
      sampleCampaigns.forEach(campaign => {
        console.log(`- ${campaign.name} (Year: ${campaign.year}, Country: ${campaign.country?.name}, Range: ${campaign.range?.name})`);
      });
    }
  } catch (error) {
    console.error('Error checking SQLite database:', error);
  }
}

checkDatabases();
