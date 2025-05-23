import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Path to the source database (golden_rules.db)
const SOURCE_DB_PATH = path.resolve('./prisma/golden_rules.db');

// Path to the target database (dev.db)
const TARGET_DB_PATH = path.resolve('./prisma/prisma/dev.db');

async function syncCategoryRanges() {
  console.log('Starting Category-Range synchronization...');
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
    // First, get all categories from both databases
    console.log('Fetching categories from both databases...');
    const sourceCategories = await sourceClient.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    const targetCategories = await targetClient.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`Source has ${sourceCategories.length} categories`);
    console.log(`Target has ${targetCategories.length} categories`);
    
    // Create maps for easier lookup
    const sourceCategoryMap = new Map(
      sourceCategories.map(cat => [cat.name.toLowerCase().trim(), cat])
    );
    
    const targetCategoryMap = new Map(
      targetCategories.map(cat => [cat.name.toLowerCase().trim(), cat])
    );
    
    // Now get all ranges with their categories
    console.log('Fetching ranges from both databases...');
    const sourceRanges = await sourceClient.range.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    
    const targetRanges = await targetClient.range.findMany({
      include: { category: true },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Source has ${sourceRanges.length} ranges`);
    console.log(`Target has ${targetRanges.length} ranges`);
    
    // Create a map of range+category combinations in the target
    const targetRangeMap = new Map();
    targetRanges.forEach(range => {
      const key = `${range.name.toLowerCase().trim()}|${range.category.name.toLowerCase().trim()}`;
      targetRangeMap.set(key, range);
    });
    
    // For each source range, update the corresponding target range
    console.log('Updating ranges in target database...');
    let updatedRanges = 0;
    
    for (const sourceRange of sourceRanges) {
      const key = `${sourceRange.name.toLowerCase().trim()}|${sourceRange.category.name.toLowerCase().trim()}`;
      const targetRange = targetRangeMap.get(key);
      
      if (targetRange) {
        // Update the target range to match the source range's category relationship
        // We're only updating the relationship, not the IDs
        if (targetRange.categoryId !== sourceRange.categoryId) {
          // Find the corresponding category in the target database
          const sourceCategoryName = sourceRange.category.name.toLowerCase().trim();
          const targetCategory = targetCategoryMap.get(sourceCategoryName);
          
          if (targetCategory) {
            // Update the range to use the correct category ID
            await targetClient.range.update({
              where: { id: targetRange.id },
              data: {
                categoryId: targetCategory.id
              }
            });
            
            console.log(`Updated range "${sourceRange.name}" (ID: ${targetRange.id}) to use category "${targetCategory.name}" (ID: ${targetCategory.id})`);
            updatedRanges++;
          }
        }
      }
    }
    
    console.log(`Updated ${updatedRanges} ranges in the target database`);
    console.log('Category-Range synchronization completed successfully!');
    
  } catch (error) {
    console.error('Error during synchronization:', error);
  } finally {
    await sourceClient.$disconnect();
    await targetClient.$disconnect();
  }
}

syncCategoryRanges().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
