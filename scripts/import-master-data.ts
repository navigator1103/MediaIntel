import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

// Path to the master data file
const MASTER_DATA_PATH = path.resolve('./MasterData.csv');

// Create a JSON file to store the master data for validation
const OUTPUT_PATH = path.resolve('./src/lib/validation/masterData.json');

interface MasterDataRow {
  Categories: string;
  Range: string;
  Campaigns: string;
  'Media Types': string;
  'Media Sub Types': string;
  'PM Type': string;
  'Objectives Values': string;
}

interface CategoryRangeMap {
  [category: string]: string[];
}

interface RangeCategoryMap {
  [range: string]: string[];
}

async function importMasterData() {
  console.log('Importing master data from CSV...');
  console.log(`Source file: ${MASTER_DATA_PATH}`);
  
  // Check if the master data file exists
  if (!fs.existsSync(MASTER_DATA_PATH)) {
    console.error(`Master data file not found at: ${MASTER_DATA_PATH}`);
    return;
  }
  
  try {
    // Initialize Prisma client
    const prisma = new PrismaClient();
    console.log('Connected to database');
    
    // Read and parse the CSV file
    const csvContent = fs.readFileSync(MASTER_DATA_PATH, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as MasterDataRow[];
    
    console.log(`Parsed ${records.length} records from the CSV file`);
    
    // Create maps for category-range relationships
    const categoryToRanges: CategoryRangeMap = {};
    const rangeToCategories: RangeCategoryMap = {};
    
    // Process each record
    records.forEach(record => {
      const category = record.Categories?.trim();
      const range = record.Range?.trim();
      
      if (!category || !range) return;
      
      // Add to category-to-ranges map
      if (!categoryToRanges[category]) {
        categoryToRanges[category] = [];
      }
      if (!categoryToRanges[category].includes(range)) {
        categoryToRanges[category].push(range);
      }
      
      // Add to range-to-categories map
      if (!rangeToCategories[range]) {
        rangeToCategories[range] = [];
      }
      if (!rangeToCategories[range].includes(category)) {
        rangeToCategories[range].push(category);
      }
    });
    
    // Create a master data object for the JSON file (keep this for backward compatibility)
    const masterData = {
      categoryToRanges,
      rangeToCategories,
      records
    };
    
    // Write to JSON file (keep this for backward compatibility)
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(masterData, null, 2));
    console.log(`Master data exported to ${OUTPUT_PATH} (for backward compatibility)`);
    
    // Now store the data in the database
    console.log('\nStoring master data in the database...');
    
    // First, ensure all categories exist in the database
    console.log('Creating categories...');
    const categoryPromises = Object.keys(categoryToRanges).map(async (categoryName) => {
      return prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });
    });
    
    const categories = await Promise.all(categoryPromises);
    console.log(`Created/updated ${categories.length} categories`);
    
    // Create a map of category names to IDs for easy lookup
    const categoryMap = categories.reduce((map, category) => {
      map[category.name] = category.id;
      return map;
    }, {} as Record<string, number>);
    
    // Now handle ranges and their relationships
    console.log('Creating ranges and their relationships...');
    
    // For each range, create it with its primary category first
    for (const [rangeName, categoryNames] of Object.entries(rangeToCategories)) {
      if (categoryNames.length === 0) continue;
      
      // Use the first category as the primary category
      const primaryCategoryName = categoryNames[0];
      const primaryCategoryId = categoryMap[primaryCategoryName];
      
      if (!primaryCategoryId) {
        console.warn(`Primary category ${primaryCategoryName} not found for range ${rangeName}`);
        continue;
      }
      
      // Create or update the range with its primary category
      const range = await prisma.range.upsert({
        where: {
          name_categoryId: {
            name: rangeName,
            categoryId: primaryCategoryId
          }
        },
        update: {},
        create: {
          name: rangeName,
          categoryId: primaryCategoryId
        }
      });
      
      console.log(`Created/updated range ${rangeName} with primary category ${primaryCategoryName}`);
      
      // Now create the many-to-many relationships for additional categories
      if (categoryNames.length > 1) {
        // Skip the primary category as it's already linked via the one-to-many relationship
        const additionalCategories = categoryNames.slice(1);
        
        for (const additionalCategoryName of additionalCategories) {
          const additionalCategoryId = categoryMap[additionalCategoryName];
          
          if (!additionalCategoryId) {
            console.warn(`Additional category ${additionalCategoryName} not found for range ${rangeName}`);
            continue;
          }
          
          // Create the many-to-many relationship using a direct database query
          // since the model might not be available in the Prisma client yet
          try {
            // Check if the relationship already exists
            const existingRelation = await prisma.$queryRaw`
              SELECT * FROM ms_category_to_range 
              WHERE category_id = ${additionalCategoryId} AND range_id = ${range.id}
            `;
            
            if (Array.isArray(existingRelation) && existingRelation.length === 0) {
              // Create the relationship if it doesn't exist
              await prisma.$executeRaw`
                INSERT INTO ms_category_to_range (category_id, range_id, is_primary, created_at, updated_at)
                VALUES (${additionalCategoryId}, ${range.id}, false, datetime('now'), datetime('now'))
              `;
              console.log(`Created relationship between range ${rangeName} and additional category ${additionalCategoryName}`);
            } else {
              console.log(`Relationship already exists between range ${rangeName} and additional category ${additionalCategoryName}`);
            }
          } catch (error) {
            console.warn(`Failed to create relationship for range ${rangeName} and category ${additionalCategoryName}:`, error);
            console.warn('The ms_category_to_range table may not exist yet. Run the migration first.');
          }
          
          console.log(`Created/updated relationship between range ${rangeName} and additional category ${additionalCategoryName}`);
        }
      }
    }
    
    // Print summary
    console.log('\nMaster Data Summary:');
    console.log(`Total Categories: ${Object.keys(categoryToRanges).length}`);
    console.log(`Total Ranges: ${Object.keys(rangeToCategories).length}`);
    
    // Print ranges with multiple categories
    console.log('\nRanges with Multiple Categories:');
    const multiCategoryRanges = Object.entries(rangeToCategories)
      .filter(([_, categories]) => categories.length > 1);
    
    if (multiCategoryRanges.length === 0) {
      console.log('No ranges with multiple categories found.');
    } else {
      multiCategoryRanges.forEach(([range, categories]) => {
        console.log(`${range}: ${categories.join(', ')}`);
      });
    }
    
    await prisma.$disconnect();
    console.log('\nMaster data import completed successfully!');
    
  } catch (error) {
    console.error('Error importing master data:', error);
  }
}

importMasterData().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
