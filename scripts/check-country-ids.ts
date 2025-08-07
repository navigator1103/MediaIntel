import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCountryIds() {
  console.log('\n=== Checking Country IDs in Database ===\n');
  
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('All Countries with IDs:');
    console.log('========================');
    countries.forEach(country => {
      console.log(`ID: ${country.id.toString().padStart(3)} - ${country.name}`);
    });
    
    console.log('\n\nLooking for India and Singapore:');
    console.log('=================================');
    const india = countries.find(c => c.name.toLowerCase().includes('india'));
    const singapore = countries.find(c => c.name.toLowerCase().includes('singapore'));
    
    if (india) {
      console.log(`✓ India found with ID: ${india.id}`);
    } else {
      console.log('✗ India not found');
    }
    
    if (singapore) {
      console.log(`✓ Singapore found with ID: ${singapore.id}`);
    } else {
      console.log('✗ Singapore not found');
    }
    
    console.log('\n\nFor demo user access, use these IDs in:');
    console.log('- src/lib/auth/countryAccess.ts (demo-user-token)');
    console.log('- src/app/api/auth/login/route.ts (demo user)');
    console.log(`\nSuggested accessibleCountries value: "${india?.id || 4},${singapore?.id || 33}"`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCountryIds().catch(console.error);