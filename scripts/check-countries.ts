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
    
    // Check specifically for Middle East
    const middleEast = await prisma.country.findFirst({
      where: {
        name: {
          equals: 'Middle East',
          mode: 'insensitive' as any
        }
      }
    });
    
    if (middleEast) {
      console.log('\nMiddle East exists as a country in the database.');
    } else {
      console.log('\nMiddle East does NOT exist as a country in the database.');
    }
    
    // Check if Middle East exists as a sub-region
    const middleEastSubRegion = await prisma.subRegion.findFirst({
      where: {
        name: {
          equals: 'Middle East',
          mode: 'insensitive' as any
        }
      }
    });
    
    if (middleEastSubRegion) {
      console.log('Middle East exists as a sub-region in the database.');
      
      // Get countries in Middle East sub-region
      const countriesInMiddleEast = await prisma.country.findMany({
        where: {
          subRegionId: middleEastSubRegion.id
        }
      });
      
      console.log(`Countries in Middle East sub-region (${countriesInMiddleEast.length}):`);
      countriesInMiddleEast.forEach(country => {
        console.log(`- ${country.name}`);
      });
    } else {
      console.log('Middle East does NOT exist as a sub-region in the database.');
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
