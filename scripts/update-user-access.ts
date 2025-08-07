import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserAccess() {
  console.log('\n=== Updating User Access ===\n');
  
  // Update user@example.com to have access to India only
  const updatedUser = await prisma.user.update({
    where: { email: 'user@example.com' },
    data: {
      accessibleCountries: '33'  // Only India (ID: 33)
    }
  });
  
  console.log('User access updated:');
  console.log('  Email:', updatedUser.email);
  console.log('  Role:', updatedUser.role);
  console.log('  Accessible Countries:', updatedUser.accessibleCountries);
  
  // Verify the countries
  if (updatedUser.accessibleCountries) {
    const countryIds = updatedUser.accessibleCountries.split(',').map(id => parseInt(id.trim()));
    const countries = await prisma.country.findMany({
      where: { id: { in: countryIds } }
    });
    
    console.log('  Countries with access:');
    countries.forEach(c => {
      console.log(`    - ${c.name} (ID: ${c.id})`);
    });
  }
  
  await prisma.$disconnect();
  
  console.log('\n✓ User access has been updated to India only');
  console.log('  The user should now only see data for India when they login\n');
}

updateUserAccess().catch(console.error);