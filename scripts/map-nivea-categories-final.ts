import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nivea business unit categories (correct mapping)
const niveaCategories = [
  'Deo',
  'Face Care',
  'Face Cleansing',
  'Hand Body',
  'Lip',
  'Men',
  'Sun',
  'X-Cat'
];

async function mapNiveaCategoriesFinal() {
  try {
    console.log('=== Mapping Nivea Categories to Nivea Business Unit ===');
    
    // Get Nivea business unit ID
    const niveaBusinessUnit = await prisma.businessUnit.findFirst({
      where: { name: 'Nivea' }
    });
    
    if (!niveaBusinessUnit) {
      console.error('Nivea business unit not found!');
      return;
    }
    
    console.log(`Found Nivea business unit with ID: ${niveaBusinessUnit.id}`);
    
    // Check if any of these categories are currently mapped to Derma
    const currentMappings = await prisma.category.findMany({
      where: {
        name: {
          in: niveaCategories
        }
      },
      include: {
        businessUnit: true
      }
    });
    
    console.log('\nCurrent status of Nivea categories:');
    currentMappings.forEach(cat => {
      const currentBU = cat.businessUnit ? cat.businessUnit.name : 'Unmapped';
      console.log(`- ${cat.name}: ${currentBU}`);
    });
    
    // Handle the special case of 'Sun' and 'X-Cat' which might be in Derma
    const conflictCategories = currentMappings.filter(cat => 
      (cat.name === 'Sun' || cat.name === 'X-Cat') && cat.businessUnit?.name === 'Derma'
    );
    
    if (conflictCategories.length > 0) {
      console.log('\n⚠️  Note: Some categories are currently mapped to Derma:');
      conflictCategories.forEach(cat => {
        console.log(`- ${cat.name} (currently in ${cat.businessUnit?.name})`);
      });
      console.log('These will be moved to Nivea as per your mapping.');
    }
    
    // Update categories to link to Nivea business unit
    const result = await prisma.category.updateMany({
      where: {
        name: {
          in: niveaCategories
        }
      },
      data: {
        businessUnitId: niveaBusinessUnit.id
      }
    });
    
    console.log(`\n✅ Successfully updated ${result.count} categories to be linked to Nivea business unit`);
    
    // Show final mapping verification
    console.log('\n=== Final Business Unit Mappings ===');
    
    // Show all business units with their categories
    const businessUnitsWithCategories = await prisma.businessUnit.findMany({
      include: {
        categories: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    businessUnitsWithCategories.forEach(bu => {
      console.log(`\n📋 ${bu.name} Business Unit (${bu.categories.length} categories):`);
      if (bu.categories.length === 0) {
        console.log('   (No categories mapped)');
      } else {
        bu.categories.forEach((cat, index) => {
          console.log(`   ${index + 1}. ${cat.name}`);
        });
      }
    });
    
    // Show remaining unmapped categories
    const unmappedCategories = await prisma.category.findMany({
      where: {
        businessUnitId: null
      },
      orderBy: { name: 'asc' }
    });
    
    if (unmappedCategories.length > 0) {
      console.log(`\n❓ Unmapped Categories (${unmappedCategories.length}):`);
      unmappedCategories.forEach((cat, index) => {
        console.log(`   ${index + 1}. ${cat.name}`);
      });
    }
    
    // Final summary
    const totalCategories = await prisma.category.count();
    const mappedCategories = await prisma.category.count({
      where: { businessUnitId: { not: null } }
    });
    
    console.log('\n=== Final Summary ===');
    console.log(`Total Categories: ${totalCategories}`);
    console.log(`Mapped Categories: ${mappedCategories}`);
    console.log(`Unmapped Categories: ${totalCategories - mappedCategories}`);
    console.log(`Mapping Coverage: ${((mappedCategories / totalCategories) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Error mapping categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mapNiveaCategoriesFinal();