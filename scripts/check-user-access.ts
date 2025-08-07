import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserAccess() {
  console.log('\n=== Checking User Access in Database ===\n');
  
  const user = await prisma.user.findFirst({
    where: { email: 'user@example.com' }
  });
  
  if (user) {
    console.log('User found in database:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Accessible Countries:', user.accessibleCountries);
    
    // Parse the country IDs
    if (user.accessibleCountries) {
      const countryIds = user.accessibleCountries.split(',').map(id => parseInt(id.trim()));
      console.log('  Parsed Country IDs:', countryIds);
      
      // Get country names
      const countries = await prisma.country.findMany({
        where: { id: { in: countryIds } }
      });
      
      console.log('  Countries:');
      countries.forEach(c => {
        console.log(`    - ${c.name} (ID: ${c.id})`);
      });
    }
  } else {
    console.log('No user found with email user@example.com in database');
    console.log('This means the demo account is being used with hardcoded values');
  }
  
  await prisma.$disconnect();
}

checkUserAccess().catch(console.error);