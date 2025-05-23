import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Path to the source database (golden_rules.db)
const SOURCE_DB_PATH = path.resolve('./prisma/golden_rules.db');

// Path to the target database (dev.db)
const TARGET_DB_PATH = path.resolve('./prisma/prisma/dev.db');

async function copyCountries() {
  console.log('Starting country synchronization...');
  console.log(`Source DB: ${SOURCE_DB_PATH}`);
  console.log(`Target DB: ${TARGET_DB_PATH}`);
  
  // Check if both database files exist
  if (!fs.existsSync(SOURCE_DB_PATH)) {
    console.error(`Source database not found at: ${SOURCE_DB_PATH}`);
    return;
  }
  
  if (!fs.existsSync(TARGET_DB_PATH)) {
    console.error(`Target database not found at: ${TARGET_DB_PATH}`);
    return;
  }
  
  // Create Prisma clients for both databases
  const sourceClient = new PrismaClient({
    datasources: {
      db: {
        url: `file:${SOURCE_DB_PATH}`
      }
    }
  });
  
  const targetClient = new PrismaClient({
    datasources: {
      db: {
        url: `file:${TARGET_DB_PATH}`
      }
    }
  });
  
  try {
    // First, get all existing regions and countries in the target database
    console.log('Checking existing data in target database...');
    const targetRegions = await targetClient.region.findMany();
    const targetCountries = await targetClient.country.findMany();
    
    console.log(`Target database has ${targetRegions.length} regions and ${targetCountries.length} countries`);
    
    // Get all regions and countries from the source database
    console.log('Reading data from source database...');
    const sourceRegions = await sourceClient.region.findMany();
    const sourceCountries = await sourceClient.country.findMany({
      include: { region: true }
    });
    
    console.log(`Source database has ${sourceRegions.length} regions and ${sourceCountries.length} countries`);
    
    // Create a map of existing region IDs in the target database
    const existingRegionIds = new Set(targetRegions.map(r => r.id));
    
    // Add any missing regions to the target database
    console.log('Adding missing regions to target database...');
    let addedRegions = 0;
    
    for (const region of sourceRegions) {
      if (!existingRegionIds.has(region.id)) {
        await targetClient.region.create({
          data: {
            id: region.id,
            name: region.name,
            createdAt: region.createdAt
          }
        });
        addedRegions++;
      }
    }
    
    console.log(`Added ${addedRegions} new regions to target database`);
    
    // Create a map of existing country IDs in the target database
    const existingCountryIds = new Set(targetCountries.map(c => c.id));
    const existingCountryNames = new Map(targetCountries.map(c => [c.name.toLowerCase().trim(), c.id]));
    
    // Add any missing countries to the target database
    console.log('Adding missing countries to target database...');
    let addedCountries = 0;
    let updatedCountries = 0;
    
    for (const country of sourceCountries) {
      const normalizedName = country.name.toLowerCase().trim();
      
      if (!existingCountryIds.has(country.id)) {
        // Country doesn't exist by ID, check if it exists by name
        if (existingCountryNames.has(normalizedName)) {
          // Country exists with a different ID, update it
          const existingId = existingCountryNames.get(normalizedName);
          await targetClient.country.update({
            where: { id: existingId },
            data: {
              name: country.name, // Use the exact name from source
              regionId: country.regionId
            }
          });
          updatedCountries++;
        } else {
          // Country doesn't exist, create it
          await targetClient.country.create({
            data: {
              id: country.id,
              name: country.name,
              regionId: country.regionId,
              createdAt: country.createdAt
            }
          });
          addedCountries++;
        }
      }
    }
    
    console.log(`Added ${addedCountries} new countries and updated ${updatedCountries} existing countries in target database`);
    console.log(`Copied ${sourceCountries.length} countries to target database`);
    
    console.log('Country synchronization completed successfully!');
  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    await sourceClient.$disconnect();
    await targetClient.$disconnect();
  }
}

copyCountries().catch(error => {
  console.error('Synchronization failed:', error);
  process.exit(1);
});
