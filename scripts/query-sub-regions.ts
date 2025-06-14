import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Query all sub-regions
    const subRegions = await prisma.subRegion.findMany();
    console.log('Sub-regions in database:');
    console.log(JSON.stringify(subRegions, null, 2));
    
    // Query all countries with their sub-regions
    const countries = await prisma.country.findMany({
      include: {
        subRegion: true
      }
    });
    console.log('\nCountries with sub-regions:');
    console.log(JSON.stringify(countries.slice(0, 5), null, 2)); // Show first 5 for brevity
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
