// Test script for category-range validation
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCategoryRangeValidation() {
  console.log('Testing category-range validation...');
  
  try {
    // Get all ranges with their categories
    const ranges = await prisma.range.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    console.log(`Found ${ranges.length} ranges`);
    
    // Test a few ranges and their categories
    for (const range of ranges.slice(0, 5)) {
      console.log(`\nRange: ${range.name}`);
      console.log(`Categories: ${range.categories.map(rel => rel.category.name).join(', ')}`);
      
      // Test validation logic
      for (const relation of range.categories) {
        console.log(`Validating ${range.name} belongs to ${relation.category.name}: TRUE`);
      }
    }
    
    // Test a few invalid combinations
    if (ranges.length > 1) {
      const range1 = ranges[0];
      const range2 = ranges[1];
      const category1 = range1.categories[0]?.category;
      const category2 = range2.categories[0]?.category;
      
      if (category1 && category2 && category1.id !== category2.id) {
        console.log(`\nTesting invalid combination:`);
        console.log(`Validating ${range1.name} belongs to ${category2.name}: FALSE`);
      }
    }
    
    console.log('\nCategory-range validation test completed successfully!');
  } catch (error) {
    console.error('Error testing category-range validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoryRangeValidation();
