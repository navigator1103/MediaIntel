import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCategoryMapping() {
  try {
    console.log('=== Category-Business Unit Mapping Verification ===\n');
    
    // Get all business units with their categories
    const businessUnitsWithCategories = await prisma.businessUnit.findMany({
      include: {
        categories: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    businessUnitsWithCategories.forEach(bu => {
      console.log(`📋 ${bu.name} (ID: ${bu.id}) - ${bu.categories.length} categories:`);
      bu.categories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name}`);
      });
      console.log('');
    });
    
    // Get categories without business unit mapping
    const unmappedCategories = await prisma.category.findMany({
      where: { businessUnitId: null },
      orderBy: { name: 'asc' }
    });
    
    if (unmappedCategories.length > 0) {
      console.log(`❓ Unmapped Categories (${unmappedCategories.length}):`);
      unmappedCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name} (ID: ${cat.id})`);
      });
      console.log('');
    }
    
    // Summary
    const totalCategories = await prisma.category.count();
    const mappedCategories = await prisma.category.count({
      where: { businessUnitId: { not: null } }
    });
    
    console.log('=== Summary ===');
    console.log(`Total Categories: ${totalCategories}`);
    console.log(`Mapped Categories: ${mappedCategories}`);
    console.log(`Unmapped Categories: ${totalCategories - mappedCategories}`);
    console.log(`Mapping Coverage: ${((mappedCategories / totalCategories) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Error verifying mapping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCategoryMapping();