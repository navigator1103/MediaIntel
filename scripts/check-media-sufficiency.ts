import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMediaSufficiency() {
  const count = await prisma.mediaSufficiency.count();
  console.log('MediaSufficiency records:', count);
  
  if (count > 0) {
    const sample = await prisma.mediaSufficiency.findFirst();
    if (sample) {
      console.log('\nSample record fields:');
      console.log(Object.keys(sample));
      
      // Check for WOA fields
      const woaFields = Object.keys(sample).filter(key => key.toLowerCase().includes('woa'));
      console.log('\nWOA fields found:', woaFields.length > 0 ? woaFields : 'None');
      
      // Check specific fields that frontend expects
      console.log('\nChecking fields used in frontend:');
      console.log('- tvR1Plus:', sample.tvR1Plus);
      console.log('- tvIdealReach:', sample.tvIdealReach);
      console.log('- digitalR1Plus:', sample.digitalR1Plus);
      console.log('- digitalIdealReach:', sample.digitalIdealReach);
      console.log('- plannedCombinedReach:', sample.plannedCombinedReach);
      console.log('- combinedIdealReach:', sample.combinedIdealReach);
    }
  }
  
  await prisma.$disconnect();
}

checkMediaSufficiency();