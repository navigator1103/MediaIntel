import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Checking countries in the database...');
  
  try {
    // Create a new Prisma client instance
    const prisma = new PrismaClient();
    
    // Get all countries
    const countries = await prisma.country.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`Found ${countries.length} countries in the database:`);
    countries.forEach(country => {
      console.log(`- ${country.name}`);
    });
    
    // Check for countries containing "Middle East" in the name
    const middleEastCountries = countries.filter(country => 
      country.name.toLowerCase().includes('middle east')
    );
    
    if (middleEastCountries.length > 0) {
      console.log('\nFound countries containing "Middle East":');
      middleEastCountries.forEach(country => {
        console.log(`- ${country.name}`);
      });
    } else {
      console.log('\nNo countries containing "Middle East" found in the database.');
    }
    
    // Get all sub-regions
    const subRegions = await prisma.subRegion.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`\nFound ${subRegions.length} sub-regions in the database:`);
    subRegions.forEach(subRegion => {
      console.log(`- ${subRegion.name}`);
    });
    
    // Check for sub-regions containing "Middle East" in the name
    const middleEastSubRegions = subRegions.filter(subRegion => 
      subRegion.name.toLowerCase().includes('middle east')
    );
    
    if (middleEastSubRegions.length > 0) {
      console.log('\nFound sub-regions containing "Middle East":');
      middleEastSubRegions.forEach(subRegion => {
        console.log(`- ${subRegion.name}`);
      });
    } else {
      console.log('\nNo sub-regions containing "Middle East" found in the database.');
    }
    
    // Disconnect the client
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error checking countries:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
