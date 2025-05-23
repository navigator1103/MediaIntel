import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

async function testDataUpload() {
  console.log('Testing data upload with database validation...');
  
  // Create a sample CSV file with test data
  const testCsvPath = path.resolve('./test-upload-data.csv');
  createTestCsvFile(testCsvPath);
  
  // Read and parse the test CSV file
  const csvContent = fs.readFileSync(testCsvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  console.log(`Parsed ${records.length} records from the test CSV file`);
  
  // Test the database validation directly
  console.log('\nValidating category-range relationships against the database...');
  const prisma = new PrismaClient();
  
  try {
    // Test each record for category-range relationship validity
    for (const record of records) {
      const categoryInput = record.Category.toString().trim();
      const rangeInput = record.Range.toString().trim();
      
      console.log(`\nTesting: Category "${categoryInput}" with Range "${rangeInput}"`);
      
      // Find the category by name
      const category = await prisma.category.findUnique({
        where: { name: categoryInput }
      });
      
      if (!category) {
        console.log(`  Result: INVALID - Category "${categoryInput}" not found in database`);
        continue;
      }
      
      // Find the range by name
      const range = await prisma.range.findUnique({
        where: { name: rangeInput }
      });
      
      if (!range) {
        console.log(`  Result: INVALID - Range "${rangeInput}" not found in database`);
        continue;
      }
      
      // Check if this category-range relationship exists
      const relationship = await prisma.$queryRaw<any[]>`
        SELECT * FROM ms_category_to_range 
        WHERE category_id = ${category.id} AND range_id = ${range.id}
      `;
      
      const isValid = Array.isArray(relationship) && relationship.length > 0;
      
      if (isValid) {
        console.log(`  Result: VALID - Range "${rangeInput}" belongs to Category "${categoryInput}"`);
      } else {
        console.log(`  Result: INVALID - Range "${rangeInput}" does not belong to Category "${categoryInput}"`);
      }
    }
  } catch (error) {
    console.error('Error during database validation:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  // Clean up
  fs.unlinkSync(testCsvPath);
  console.log('\nTest completed and test file removed');
}

function createTestCsvFile(filePath: string) {
  // Create a CSV file with test data
  // Include both valid and invalid category-range relationships
  const csvContent = `Year,Sub Region,Country,Category,Range,Campaign,Media,Media Subtype,Start Date,End Date,Budget,Target Reach,Current Reach
2025,APAC,India,Face Care,Q10,Q10 Anti-Age,TV,TV Spot,01/01/2025,12/31/2025,1000000,80,75
2025,APAC,India,Face Care,Cellular,Cell Boost,Digital,Social Media,01/01/2025,12/31/2025,500000,70,65
2025,APAC,India,Hand Body,Q10,Q10 Body Cream,Print,Magazine,01/01/2025,12/31/2025,300000,60,55
2025,APAC,India,Face Care,Invalid Range,Test Campaign,TV,TV Spot,01/01/2025,12/31/2025,200000,50,45
2025,APAC,India,Invalid Category,Q10,Test Campaign,Digital,Social Media,01/01/2025,12/31/2025,150000,40,35
2025,APAC,India,Deo,Deep,Deep Fresh,TV,TV Spot,01/01/2025,12/31/2025,800000,75,70
2025,APAC,India,Men,Deep,Deep Men,Print,Magazine,01/01/2025,12/31/2025,400000,65,60
2025,APAC,India,Face Cleansing,Luminous 630,Luminous Cleanse,Digital,Social Media,01/01/2025,12/31/2025,600000,70,65
2025,APAC,India,Face Care,Luminous 630,Luminous Face,TV,TV Spot,01/01/2025,12/31/2025,900000,80,75
2025,APAC,India,Deo,Q10,Invalid Relationship,Digital,Social Media,01/01/2025,12/31/2025,250000,55,50`;
  
  fs.writeFileSync(filePath, csvContent);
  console.log(`Created test CSV file at: ${filePath}`);
}

testDataUpload().catch(console.error);
