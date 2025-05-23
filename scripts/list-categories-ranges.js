// Script to list all categories and their associated ranges
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listCategoryRangeRules() {
  try {
    console.log('Fetching all categories and their ranges from the database...');
    
    // Fetch categories with their ranges
    const categories = await prisma.category.findMany({
      include: {
        ranges: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('\n===== CATEGORY-RANGE RELATIONSHIPS =====\n');
    
    // Print each category and its ranges
    categories.forEach(category => {
      console.log(`Category: ${category.name} (ID: ${category.id})`);
      
      if (category.ranges.length === 0) {
        console.log('  No ranges associated with this category');
      } else {
        console.log('  Ranges:');
        category.ranges.forEach(range => {
          console.log(`    - ${range.name} (ID: ${range.id})`);
        });
      }
      
      console.log(''); // Empty line for better readability
    });
    
    // Print summary
    const totalCategories = categories.length;
    const totalRanges = categories.reduce((sum, category) => sum + category.ranges.length, 0);
    
    console.log(`===== SUMMARY =====`);
    console.log(`Total Categories: ${totalCategories}`);
    console.log(`Total Ranges: ${totalRanges}`);
    
  } catch (error) {
    console.error('Error fetching category-range relationships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
listCategoryRangeRules();
