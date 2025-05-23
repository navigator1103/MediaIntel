import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Path to the source database (golden_rules.db)
const SOURCE_DB_PATH = path.resolve('./prisma/golden_rules.db');

// Path to the target database (dev.db)
const TARGET_DB_PATH = path.resolve('./prisma/prisma/dev.db');

async function checkCategoryRangeRelationships() {
  console.log('Checking Category-Range relationships in databases...');
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
    // Get all ranges with their categories from both databases
    const sourceRanges = await sourceClient.range.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    
    const targetRanges = await targetClient.range.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    
    // Create maps for easier comparison
    const sourceMap = new Map();
    sourceRanges.forEach(range => {
      sourceMap.set(`${range.name}|${range.category.name}`, {
        rangeId: range.id,
        rangeName: range.name,
        categoryId: range.categoryId,
        categoryName: range.category.name
      });
    });
    
    const targetMap = new Map();
    targetRanges.forEach(range => {
      targetMap.set(`${range.name}|${range.category.name}`, {
        rangeId: range.id,
        rangeName: range.name,
        categoryId: range.categoryId,
        categoryName: range.category.name
      });
    });
    
    // Check for specific ranges
    console.log('\nChecking specific ranges:');
    
    // Check for "Acne" range
    const acneRanges = sourceRanges.filter(r => r.name === 'Acne');
    console.log(`\nSource DB has ${acneRanges.length} ranges named "Acne":`);
    acneRanges.forEach((range, index) => {
      console.log(`${index + 1}. Acne (Category: ${range.category.name}, CategoryID: ${range.categoryId}, RangeID: ${range.id})`);
    });
    
    const targetAcneRanges = targetRanges.filter(r => r.name === 'Acne');
    console.log(`\nTarget DB has ${targetAcneRanges.length} ranges named "Acne":`);
    targetAcneRanges.forEach((range, index) => {
      console.log(`${index + 1}. Acne (Category: ${range.category.name}, CategoryID: ${range.categoryId}, RangeID: ${range.id})`);
    });
    
    // Check for differences in category-range relationships
    console.log('\nChecking for differences in Category-Range relationships:');
    
    let differences = 0;
    
    // Check source ranges that might be different in target
    for (const [key, sourceData] of sourceMap.entries()) {
      const targetData = targetMap.get(key);
      
      if (!targetData) {
        console.log(`Range "${sourceData.rangeName}" with Category "${sourceData.categoryName}" exists in source but not in target`);
        differences++;
        continue;
      }
      
      // Check if IDs are different
      if (sourceData.rangeId !== targetData.rangeId || sourceData.categoryId !== targetData.categoryId) {
        console.log(`Range "${sourceData.rangeName}" with Category "${sourceData.categoryName}" has different IDs:`);
        console.log(`  Source: RangeID=${sourceData.rangeId}, CategoryID=${sourceData.categoryId}`);
        console.log(`  Target: RangeID=${targetData.rangeId}, CategoryID=${targetData.categoryId}`);
        differences++;
      }
    }
    
    // Check target ranges that might not exist in source
    for (const [key, targetData] of targetMap.entries()) {
      if (!sourceMap.has(key)) {
        console.log(`Range "${targetData.rangeName}" with Category "${targetData.categoryName}" exists in target but not in source`);
        differences++;
      }
    }
    
    if (differences === 0) {
      console.log('No differences found in Category-Range relationships between the databases.');
    } else {
      console.log(`Found ${differences} differences in Category-Range relationships.`);
    }
    
  } catch (error) {
    console.error('Error checking Category-Range relationships:', error);
  } finally {
    await sourceClient.$disconnect();
    await targetClient.$disconnect();
  }
}

checkCategoryRangeRelationships().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
