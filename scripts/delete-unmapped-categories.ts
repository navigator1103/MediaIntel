import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categories that should be deleted (unmapped ones that shouldn't exist)
const categoriesToDelete = [
  'Body Care',
  'Cool Kick', 
  'Hair Care',
  'Q10',
  'Skin Care',
  'Sun Care',
  'UV Face'
];

async function deleteUnmappedCategories() {
  try {
    console.log('=== Deleting Unmapped Categories ===');
    
    // First, let's see what we're about to delete
    const categoriesFound = await prisma.category.findMany({
      where: {
        name: {
          in: categoriesToDelete
        }
      },
      include: {
        ranges: true,
        gamePlans: true
      }
    });
    
    console.log(`Found ${categoriesFound.length} categories to delete:`);
    categoriesFound.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
      console.log(`  - Linked to ${cat.ranges.length} ranges`);
      console.log(`  - Linked to ${cat.gamePlans.length} game plans`);
    });
    
    // Check if any of these categories have dependencies
    const categoriesWithDependencies = categoriesFound.filter(cat => 
      cat.ranges.length > 0 || cat.gamePlans.length > 0
    );
    
    if (categoriesWithDependencies.length > 0) {
      console.log('\n⚠️  Warning: Some categories have dependencies:');
      categoriesWithDependencies.forEach(cat => {
        console.log(`- ${cat.name}: ${cat.ranges.length} ranges, ${cat.gamePlans.length} game plans`);
      });
      console.log('These dependencies need to be handled before deletion.');
      
      // For safety, let's not delete categories with dependencies automatically
      console.log('\nSkipping deletion of categories with dependencies.');
      console.log('Please review and handle dependencies manually if needed.');
      
      const categoriesToDeleteSafely = categoriesFound.filter(cat => 
        cat.ranges.length === 0 && cat.gamePlans.length === 0
      );
      
      if (categoriesToDeleteSafely.length === 0) {
        console.log('No categories can be safely deleted at this time.');
        return;
      }
      
      console.log(`\nProceeding to delete ${categoriesToDeleteSafely.length} categories without dependencies:`);
      categoriesToDeleteSafely.forEach(cat => console.log(`- ${cat.name}`));
      
      // Delete only safe categories
      const deleteResult = await prisma.category.deleteMany({
        where: {
          id: {
            in: categoriesToDeleteSafely.map(cat => cat.id)
          }
        }
      });
      
      console.log(`✅ Successfully deleted ${deleteResult.count} categories`);
    } else {
      // All categories are safe to delete
      console.log('\n✅ All categories are safe to delete (no dependencies found)');
      
      const deleteResult = await prisma.category.deleteMany({
        where: {
          name: {
            in: categoriesToDelete
          }
        }
      });
      
      console.log(`✅ Successfully deleted ${deleteResult.count} categories`);
    }
    
    // Show final category count and mappings
    console.log('\n=== Final Category Status ===');
    
    const remainingCategories = await prisma.category.findMany({
      include: {
        businessUnit: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total remaining categories: ${remainingCategories.length}`);
    
    const dermaCategories = remainingCategories.filter(cat => cat.businessUnit?.name === 'Derma');
    const niveaCategories = remainingCategories.filter(cat => cat.businessUnit?.name === 'Nivea');
    const unmappedCategories = remainingCategories.filter(cat => !cat.businessUnit);
    
    console.log(`\nDerma categories (${dermaCategories.length}):`);
    dermaCategories.forEach((cat, index) => console.log(`  ${index + 1}. ${cat.name}`));
    
    console.log(`\nNivea categories (${niveaCategories.length}):`);
    niveaCategories.forEach((cat, index) => console.log(`  ${index + 1}. ${cat.name}`));
    
    if (unmappedCategories.length > 0) {
      console.log(`\nRemaining unmapped categories (${unmappedCategories.length}):`);
      unmappedCategories.forEach((cat, index) => console.log(`  ${index + 1}. ${cat.name}`));
    } else {
      console.log('\n✅ All remaining categories are properly mapped to business units!');
    }
    
  } catch (error) {
    console.error('Error deleting categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUnmappedCategories();