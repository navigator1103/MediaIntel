import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listMSCountries() {
  try {
    console.log('Fetching countries from the media sufficiency database...');
    
    const msCountries = await prisma.mSCountry.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        subRegion: true
      }
    });
    
    console.log(`Found ${msCountries.length} countries in the MS database:`);
    console.log('-------------------------------------------');
    
    msCountries.forEach((country, index) => {
      console.log(`${index + 1}. ${country.name} (Sub-Region: ${country.subRegion.name})`);
    });
    
    console.log('-------------------------------------------');
    console.log('Country names only (for easy copying):');
    console.log(msCountries.map(c => c.name).join(', '));
    
  } catch (error) {
    console.error('Error fetching MS countries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listMSCountries();
