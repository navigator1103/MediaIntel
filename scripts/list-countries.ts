import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listCountries() {
  try {
    console.log('Fetching countries from the database...');
    
    const countries = await prisma.country.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        region: true
      }
    });
    
    console.log(`Found ${countries.length} countries in the database:`);
    console.log('-------------------------------------------');
    
    countries.forEach((country, index) => {
      console.log(`${index + 1}. ${country.name} (Region: ${country.region.name})`);
    });
    
    console.log('-------------------------------------------');
    console.log('Country names only (for easy copying):');
    console.log(countries.map(c => c.name).join(', '));
    
  } catch (error) {
    console.error('Error fetching countries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listCountries();
