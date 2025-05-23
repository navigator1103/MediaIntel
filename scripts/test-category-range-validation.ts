import { PrismaClient } from '@prisma/client';

async function testCategoryRangeRelationships() {
  console.log('Testing Category-Range relationships in the database...');
  
  const prisma = new PrismaClient();
  
  try {
    // Get all categories
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} categories in the database`);
    
    // Test with a specific category (Face Care)
    const category = await prisma.category.findUnique({
      where: { name: 'Face Care' }
    });
    
    if (!category) {
      console.log('Category "Face Care" not found in database');
      return;
    }
    
    console.log('Category:', category);
    
    // Get all ranges for this category from the join table
    const rangesForCategory = await prisma.$queryRaw<{id: number, name: string}[]>`
      SELECT r.id, r.name 
      FROM ms_ranges r
      JOIN ms_category_to_range cr ON r.id = cr.range_id
      WHERE cr.category_id = ${category.id}
    `;
    
    console.log(`Found ${rangesForCategory.length} ranges for category "Face Care":`);
    rangesForCategory.forEach(range => {
      console.log(`- ${range.name} (ID: ${range.id})`);
    });
    
    // Test validation for a specific range
    const testRange = 'Q10';
    console.log(`\nTesting if range "${testRange}" belongs to category "Face Care"...`);
    
    // Find the range by name
    const range = await prisma.range.findUnique({
      where: { name: testRange }
    });
    
    if (!range) {
      console.log(`Range "${testRange}" not found in database`);
      return;
    }
    
    // Check if this category-range relationship exists
    const relationship = await prisma.$queryRaw<any[]>`
      SELECT * FROM ms_category_to_range 
      WHERE category_id = ${category.id} AND range_id = ${range.id}
    `;
    
    const isValid = Array.isArray(relationship) && relationship.length > 0;
    console.log(`Validation result: ${isValid ? 'Valid' : 'Invalid'}`);
    
  } catch (error) {
    console.error('Error during database validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoryRangeRelationships().catch(console.error);
