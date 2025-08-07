import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllFilterOptions() {
  console.log('\n=== Checking All Available Filter Options ===\n');
  
  try {
    // 1. Get all countries from database
    const allCountries = await prisma.country.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total Countries in Database: ${allCountries.length}`);
    console.log('Countries:', allCountries.map(c => c.name).join(', '));
    
    // 2. Get all media types
    const allMediaTypes = await prisma.mediaType.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nTotal Media Types in Database: ${allMediaTypes.length}`);
    console.log('Media Types:', allMediaTypes.map(mt => mt.name).join(', '));
    
    // 3. Get all categories
    const allCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nTotal Categories in Database: ${allCategories.length}`);
    console.log('Categories:', allCategories.map(c => c.name).join(', '));
    
    // 4. Get all PM types
    const allPMTypes = await prisma.pMType.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nTotal PM Types in Database: ${allPMTypes.length}`);
    console.log('PM Types:', allPMTypes.map(pm => pm.name).join(', '));
    
    // 5. Check what's actually in game plans
    const gamePlans = await prisma.gamePlan.findMany({
      include: {
        country: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        category: true,
        pmType: true
      }
    });
    
    const usedCountries = new Set(gamePlans.map(gp => gp.country?.name).filter(Boolean));
    const usedMediaTypes = new Set(gamePlans.map(gp => gp.mediaSubType?.mediaType?.name).filter(Boolean));
    const usedCategories = new Set(gamePlans.map(gp => gp.category?.name).filter(Boolean));
    const usedPMTypes = new Set(gamePlans.map(gp => gp.pmType?.name).filter(Boolean));
    
    console.log('\n=== Currently Used in Game Plans ===');
    console.log(`Countries with data: ${usedCountries.size} of ${allCountries.length}`);
    console.log('Used:', Array.from(usedCountries).join(', '));
    
    console.log(`\nMedia Types with data: ${usedMediaTypes.size} of ${allMediaTypes.length}`);
    console.log('Used:', Array.from(usedMediaTypes).join(', '));
    
    console.log(`\nCategories with data: ${usedCategories.size} of ${allCategories.length}`);
    console.log('Used:', Array.from(usedCategories).join(', '));
    
    console.log(`\nPM Types with data: ${usedPMTypes.size} of ${allPMTypes.length}`);
    console.log('Used:', Array.from(usedPMTypes).join(', '));
    
    console.log('\n=== ISSUE IDENTIFIED ===');
    console.log('The dashboard filters are only showing options that have budget data.');
    console.log('Missing countries from filters:', 
      allCountries
        .map(c => c.name)
        .filter(name => !usedCountries.has(name))
        .join(', ') || 'None'
    );
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllFilterOptions().catch(console.error);