import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

// Get the current username for PostgreSQL connection
const username = execSync('whoami').toString().trim();

// Create a temporary .env file with PostgreSQL connection
const tempEnvFile = `
# This is a temporary .env file for PostgreSQL connection
DATABASE_URL=postgresql://${username}@localhost:5432/golden_rules
`;

// Write the temporary .env file
import * as fs from 'fs';
import * as path from 'path';

async function verifyPostgresData() {
  console.log('Verifying PostgreSQL data...');
  
  // Save the original .env content
  const envPath = path.join(process.cwd(), '.env');
  const originalEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  
  try {
    // Write temporary .env with PostgreSQL connection
    fs.writeFileSync(envPath, tempEnvFile);
    
    // Create a new Prisma client with the PostgreSQL connection
    const prisma = new PrismaClient();
    
    // Verify data in PostgreSQL
    console.log('\n=== PostgreSQL Data Summary ===');
    
    // Count SubRegions
    const subRegionCount = await prisma.subRegion.count();
    console.log(`SubRegions: ${subRegionCount}`);
    
    // Count Countries
    const countryCount = await prisma.mSCountry.count();
    console.log(`Countries: ${countryCount}`);
    
    // Count Categories
    const categoryCount = await prisma.category.count();
    console.log(`Categories: ${categoryCount}`);
    
    // Count Ranges
    const rangeCount = await prisma.range.count();
    console.log(`Ranges: ${rangeCount}`);
    
    // Count MediaTypes
    const mediaTypeCount = await prisma.mediaType.count();
    console.log(`Media Types: ${mediaTypeCount}`);
    
    // Count MediaSubtypes
    const mediaSubtypeCount = await prisma.mediaSubtype.count();
    console.log(`Media Subtypes: ${mediaSubtypeCount}`);
    
    // Count BusinessUnits
    const businessUnitCount = await prisma.businessUnit.count();
    console.log(`Business Units: ${businessUnitCount}`);
    
    // Count PMTypes
    const pmTypeCount = await prisma.pMType.count();
    console.log(`PM Types: ${pmTypeCount}`);
    
    // Count Campaigns
    const campaignCount = await prisma.campaign.count();
    console.log(`Campaigns: ${campaignCount}`);
    
    // Count CampaignMedia
    const campaignMediaCount = await prisma.campaignMedia.count();
    console.log(`Campaign Media: ${campaignMediaCount}`);
    
    // Sample data from each table
    console.log('\n=== Sample Data ===');
    
    // Sample SubRegion
    const subRegion = await prisma.subRegion.findFirst();
    console.log(`\nSample SubRegion: ${JSON.stringify(subRegion, null, 2)}`);
    
    // Sample Country
    const country = await prisma.mSCountry.findFirst();
    console.log(`\nSample Country: ${JSON.stringify(country, null, 2)}`);
    
    // Sample Campaign
    const campaign = await prisma.campaign.findFirst();
    console.log(`\nSample Campaign: ${JSON.stringify(campaign, null, 2)}`);
    
    // Sample CampaignMedia
    const campaignMedia = await prisma.campaignMedia.findFirst();
    console.log(`\nSample Campaign Media: ${JSON.stringify(campaignMedia, null, 2)}`);
    
    // Disconnect from the database
    await prisma.$disconnect();
    
    console.log('\nVerification completed successfully!');
    console.log('PostgreSQL data is ready to be used by the application.');
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    // Restore the original .env file
    fs.writeFileSync(envPath, originalEnv);
    console.log('\nRestored original .env file.');
  }
}

// Run the verification
verifyPostgresData();
