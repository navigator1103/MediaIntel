import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Path to the source database (golden_rules.db)
const SOURCE_DB_PATH = path.resolve('./prisma/golden_rules.db');

// Path to the target database (dev.db)
const TARGET_DB_PATH = path.resolve('./prisma/prisma/dev.db');

async function checkRanges() {
  console.log('Checking ranges in databases...');
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
    // First check categories since ranges are linked to categories
    console.log('\nChecking categories...');
    const sourceCategories = await sourceClient.category.findMany({
      orderBy: { name: 'asc' }
    });
    const targetCategories = await targetClient.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`Source database has ${sourceCategories.length} categories:`);
    sourceCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
    });
    
    console.log(`\nTarget database has ${targetCategories.length} categories:`);
    targetCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
    });
    
    // Now check ranges
    console.log('\nChecking ranges...');
    const sourceRanges = await sourceClient.range.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    const targetRanges = await targetClient.range.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Source database has ${sourceRanges.length} ranges:`);
    sourceRanges.forEach((range, index) => {
      console.log(`${index + 1}. ${range.name} (Category: ${range.category.name})`);
    });
    
    console.log(`\nTarget database has ${targetRanges.length} ranges:`);
    targetRanges.forEach((range, index) => {
      console.log(`${index + 1}. ${range.name} (Category: ${range.category.name})`);
    });
    
    // Check for missing ranges in target database
    const sourceRangeNames = new Set(sourceRanges.map(r => `${r.name}|${r.category.name}`));
    const targetRangeNames = new Set(targetRanges.map(r => `${r.name}|${r.category.name}`));
    
    const missingRanges = [...sourceRangeNames].filter(name => !targetRangeNames.has(name));
    
    if (missingRanges.length > 0) {
      console.log(`\nFound ${missingRanges.length} ranges missing in target database:`);
      missingRanges.forEach((rangeName, index) => {
        const [name, category] = rangeName.split('|');
        console.log(`${index + 1}. ${name} (Category: ${category})`);
      });
    } else {
      console.log('\nNo missing ranges found. Target database has all ranges from source database.');
    }
    
  } catch (error) {
    console.error('Error checking ranges:', error);
  } finally {
    await sourceClient.$disconnect();
    await targetClient.$disconnect();
  }
}

checkRanges().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
