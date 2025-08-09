import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixInvalidRecords() {
  console.log('Fixing invalid MediaSufficiency records...\n');
  
  // Delete MediaSufficiency records with invalid countryId
  const result = await prisma.mediaSufficiency.deleteMany({
    where: {
      countryId: 1
    }
  });
  
  console.log(`✅ Deleted ${result.count} MediaSufficiency records with invalid countryId=1`);
  
  // Verify remaining records
  const remaining = await prisma.mediaSufficiency.findMany({
    select: {
      id: true,
      country: true,
      countryId: true,
      campaign: true
    }
  });
  
  console.log('\n📊 Remaining MediaSufficiency records:');
  remaining.forEach(r => {
    console.log(`  ID: ${r.id}, Country: ${r.country}, CountryID: ${r.countryId}, Campaign: ${r.campaign}`);
  });
  
  console.log(`\n✅ Total valid records: ${remaining.length}`);
  
  await prisma.$disconnect();
}

fixInvalidRecords().catch(console.error);