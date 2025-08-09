import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRanges() {
  // Check ranges in GamePlan
  const gamePlans = await prisma.gamePlan.findMany({
    where: {
      range_id: { not: null }
    },
    select: {
      range_id: true
    },
    take: 5
  });
  
  console.log('GamePlan range_ids:', gamePlans);
  
  // Check ranges in MediaSufficiency
  const mediaSufficiency = await prisma.mediaSufficiency.findMany({
    where: {
      range: { not: null }
    },
    select: {
      range: true
    },
    distinct: ['range'],
    take: 10
  });
  
  console.log('\nUnique MediaSufficiency ranges:', mediaSufficiency.map(m => m.range));
  
  // Check Range table
  const ranges = await prisma.range.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });
  
  console.log('\nAll Ranges in database:', ranges);
  
  await prisma.$disconnect();
}

checkRanges().catch(console.error);