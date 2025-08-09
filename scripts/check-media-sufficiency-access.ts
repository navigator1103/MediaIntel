import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMediaSufficiencyAccess() {
  const mediaSufficiency = await prisma.mediaSufficiency.findMany({
    select: {
      id: true,
      country: true,
      countryId: true,
      campaign: true,
      category: true
    }
  });
  
  console.log('Total MediaSufficiency records:', mediaSufficiency.length);
  
  // Group by country
  const byCountry: Record<string, number> = {};
  mediaSufficiency.forEach(ms => {
    const country = ms.country || 'Unknown';
    if (!byCountry[country]) byCountry[country] = 0;
    byCountry[country]++;
  });
  
  console.log('\nRecords by country:');
  Object.entries(byCountry).forEach(([country, count]) => {
    console.log(`  ${country}: ${count}`);
  });
  
  // Check which countries have countryId set
  const withCountryId = mediaSufficiency.filter(ms => ms.countryId !== null);
  const withoutCountryId = mediaSufficiency.filter(ms => ms.countryId === null);
  
  console.log(`\nRecords with countryId: ${withCountryId.length}`);
  console.log(`Records without countryId: ${withoutCountryId.length}`);
  
  if (withoutCountryId.length > 0) {
    console.log('\nSample records without countryId:');
    withoutCountryId.slice(0, 5).forEach(ms => {
      console.log(`  ID: ${ms.id}, Country: ${ms.country}, Campaign: ${ms.campaign}`);
    });
  }
  
  await prisma.$disconnect();
}

checkMediaSufficiencyAccess().catch(console.error);