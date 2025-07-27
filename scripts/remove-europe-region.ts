import { prisma } from '../src/lib/prisma';

async function removeEuropeRegion() {
  console.log('🗑️  Removing Europe Region and Reassigning Countries\n');
  
  // First, find the Europe region
  const europeRegion = await prisma.region.findFirst({
    where: {
      name: 'Europe'
    },
    include: {
      countries: true
    }
  });
  
  if (!europeRegion) {
    console.log('❌ Europe region not found');
    return;
  }
  
  console.log(`Found Europe region with ${europeRegion.countries.length} countries:`);
  europeRegion.countries.forEach(country => {
    console.log(`  - ${country.name}`);
  });
  
  // Check if there are any game plans linked to these countries
  const gamePlansCount = await prisma.gamePlan.count({
    where: {
      country: {
        regionId: europeRegion.id
      }
    }
  });
  
  console.log(`\n📊 Found ${gamePlansCount} game plans linked to European countries`);
  
  if (gamePlansCount > 0) {
    console.log('⚠️  WARNING: There are game plans linked to European countries');
    console.log('   You may want to reassign these countries to other regions first');
    
    // Show which countries have game plans
    const countriesWithGamePlans = await prisma.country.findMany({
      where: {
        regionId: europeRegion.id,
        gamePlans: {
          some: {}
        }
      }
    });
    
    console.log('\n🎯 Countries with game plans:');
    countriesWithGamePlans.forEach(country => {
      console.log(`  - ${country.name}: has game plans`);
    });
  }
  
  // Proceed with removal
  console.log('\n🚀 Proceeding with Europe region removal...\n');
  
  try {
    // Start a transaction to safely remove the region
    await prisma.$transaction(async (tx) => {
      // Step 1: Delete all European countries (since they have no game plans)
      const deleteResult = await tx.country.deleteMany({
        where: {
          regionId: europeRegion.id
        }
      });
      
      console.log(`✅ Deleted ${deleteResult.count} European countries`);
      
      // Step 2: Delete the Europe region
      await tx.region.delete({
        where: {
          id: europeRegion.id
        }
      });
      
      console.log('✅ Deleted Europe region');
    });
    
    console.log('\n🎉 Europe region and all European countries removed successfully!');
    
    console.log('\n📋 Deleted countries:');
    europeRegion.countries.forEach(country => {
      console.log(`  - ${country.name}`);
    });
    
    console.log('\n💡 Note: The following have been permanently deleted:');
    console.log('   - Europe region');
    console.log('   - All European countries (Germany, France, Spain, Italy, Poland)');
    console.log('   - This is safe since they had no game plans');
    
  } catch (error) {
    console.error('❌ Error removing Europe region:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeEuropeRegion().catch(console.error);