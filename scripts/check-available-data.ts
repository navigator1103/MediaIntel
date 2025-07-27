import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const countries = await prisma.country.findMany({ take: 10 });
    console.log('Available Countries:');
    countries.forEach((c, i) => console.log(`  ${i+1}. ${c.name} (ID: ${c.id})`));
    
    const financialCycles = await prisma.lastUpdate.findMany({ take: 10 });
    console.log('\nAvailable Financial Cycles:');
    financialCycles.forEach((fc, i) => console.log(`  ${i+1}. ${fc.name} (ID: ${fc.id})`));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();