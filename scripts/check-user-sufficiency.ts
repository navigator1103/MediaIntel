import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserSufficiency() {
  // Check user@example.com access
  const user = await prisma.user.findFirst({
    where: { email: 'user@example.com' }
  });
  
  console.log('=== User Details ===');
  console.log('Email: user@example.com');
  console.log('Role:', user?.role);
  console.log('Accessible Countries (raw):', user?.accessibleCountries);
  
  // Parse accessible countries
  let accessibleCountryIds: number[] = [];
  if (user?.accessibleCountries) {
    try {
      const parsed = typeof user.accessibleCountries === 'string' 
        ? JSON.parse(user.accessibleCountries)
        : user.accessibleCountries;
      
      // Handle both single number and array formats
      if (Array.isArray(parsed)) {
        accessibleCountryIds = parsed;
      } else if (typeof parsed === 'number') {
        accessibleCountryIds = [parsed];
      }
    } catch (e) {
      console.log('Error parsing accessible countries:', e);
    }
  }
  
  console.log('Parsed Accessible Country IDs:', accessibleCountryIds);
  
  // Get country names
  if (accessibleCountryIds.length > 0) {
    const countries = await prisma.country.findMany({
      where: {
        id: { in: accessibleCountryIds }
      }
    });
    console.log('Accessible Countries:', countries.map(c => c.name).join(', '));
  }
  
  console.log('\n=== All MediaSufficiency Records ===');
  const allMS = await prisma.mediaSufficiency.findMany();
  allMS.forEach(record => {
    console.log(`  Campaign: ${record.campaign}, Country: ${record.country}, CountryID: ${record.countryId}`);
  });
  
  console.log('\n=== What user@example.com SHOULD see ===');
  
  // Simulate the API filter
  const whereClause: any = {};
  if (accessibleCountryIds.length > 0) {
    whereClause.countryId = {
      in: accessibleCountryIds
    };
    console.log('Filter applied: countryId IN', accessibleCountryIds);
  } else {
    console.log('No filter applied (user has no country restrictions)');
  }
  
  const filteredMS = await prisma.mediaSufficiency.findMany({
    where: whereClause,
    select: {
      id: true,
      country: true,
      countryId: true,
      campaign: true,
      digitalPlannedR1Plus: true,
      digitalPotentialR1Plus: true
    }
  });
  
  console.log('\nFiltered MediaSufficiency records:');
  if (filteredMS.length === 0) {
    console.log('  (none - this user should see no data in Sufficiency tab)');
  } else {
    filteredMS.forEach(record => {
      console.log(`  Campaign: ${record.campaign}, Country: ${record.country}`);
    });
  }
  
  await prisma.$disconnect();
}

checkUserSufficiency().catch(console.error);