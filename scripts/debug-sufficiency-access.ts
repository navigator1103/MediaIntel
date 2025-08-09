import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSufficiencyAccess() {
  // Get MediaSufficiency records
  const ms = await prisma.mediaSufficiency.findMany();
  
  console.log('=== MediaSufficiency Records ===');
  console.log(`Total records: ${ms.length}`);
  ms.forEach(record => {
    console.log(`  ID: ${record.id}, Country: '${record.country}', CountryID: ${record.countryId}, Campaign: ${record.campaign}`);
  });
  
  // Check countries table
  const countries = await prisma.country.findMany();
  console.log('\n=== Countries in Database ===');
  countries.forEach(c => {
    console.log(`  ID: ${c.id}, Name: ${c.name}`);
  });
  
  // Map countryIds to country names
  console.log('\n=== MediaSufficiency Country Mapping ===');
  for (const record of ms) {
    if (record.countryId) {
      const country = countries.find(c => c.id === record.countryId);
      console.log(`  Record ${record.id}: countryId=${record.countryId} => ${country ? country.name : 'NOT FOUND'} (string field says: '${record.country}')`);
    }
  }
  
  // Check users and their access
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accessibleCountries: true
    }
  });
  
  console.log('\n=== User Access Rights ===');
  for (const user of users) {
    const userName = user.name || user.email;
    console.log(`\n${userName} (${user.role}):`);
    
    if (user.accessibleCountries) {
      try {
        const accessList = typeof user.accessibleCountries === 'string' 
          ? JSON.parse(user.accessibleCountries) 
          : user.accessibleCountries;
        
        console.log(`  Accessible country IDs: ${JSON.stringify(accessList)}`);
        
        // Map IDs to country names
        const countryNames = accessList.map((id: number) => {
          const country = countries.find(c => c.id === id);
          return country ? country.name : `Unknown(${id})`;
        });
        console.log(`  Accessible countries: ${countryNames.join(', ')}`);
        
        // Check what MediaSufficiency records this user should see
        const visibleRecords = ms.filter(record => 
          !record.countryId || accessList.includes(record.countryId)
        );
        console.log(`  Should see ${visibleRecords.length} MediaSufficiency records`);
        
      } catch (e) {
        console.log(`  Error parsing access: ${e}`);
      }
    } else {
      console.log('  Has access to ALL countries');
      console.log(`  Should see all ${ms.length} MediaSufficiency records`);
    }
  }
  
  await prisma.$disconnect();
}

debugSufficiencyAccess().catch(console.error);