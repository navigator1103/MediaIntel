const { PrismaClient } = require('@prisma/client');

// Simple test to verify our validation logic works
async function testDirectValidation() {
  console.log('🧪 Testing Business Unit Validation Logic Directly');
  console.log('=================================================');

  const prisma = new PrismaClient();

  try {
    // Test data
    const testCategories = ['Lip', 'Aquaphor'];
    const selectedBusinessUnit = 'Nivea';

    for (const categoryName of testCategories) {
      console.log(`\n🔍 Testing Category: "${categoryName}" against business unit: "${selectedBusinessUnit}"`);
      
      // Query database to check if category belongs to the selected business unit
      const category = await prisma.category.findFirst({
        where: { 
          name: categoryName,
          businessUnit: { name: selectedBusinessUnit }
        },
        include: { businessUnit: true }
      });
      
      console.log(`📊 Query result:`, {
        categoryName,
        found: !!category,
        businessUnit: category?.businessUnit?.name
      });
      
      const result = !!category;
      if (!result) {
        console.log(`❌ Category "${categoryName}" does NOT belong to business unit "${selectedBusinessUnit}" - CRITICAL ERROR`);
      } else {
        console.log(`✅ Category "${categoryName}" belongs to business unit "${selectedBusinessUnit}" - VALID`);
      }
    }

    console.log('\n📋 Summary:');
    console.log('- "Lip" should be VALID for Nivea (✅)');
    console.log('- "Aquaphor" should be INVALID for Nivea (❌ Critical Error)');

  } catch (error) {
    console.error('❌ Error during validation test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectValidation();