import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getRanges() {
  // Get all ranges
  const ranges = await prisma.range.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });
  
  console.log('All Ranges in database:');
  ranges.forEach(r => console.log(`  ${r.id}: ${r.name}`));
  
  // Check which ranges are used in GamePlans
  const gamePlansWithRanges = await prisma.gamePlan.findMany({
    where: {
      range_id: { not: null }
    },
    select: {
      range_id: true
    },
    distinct: ['range_id']
  });
  
  console.log('\nRange IDs used in GamePlans:', gamePlansWithRanges.map(g => g.range_id));
  
  // Check which ranges are used in MediaSufficiency
  const mediaSufficiencyWithRanges = await prisma.mediaSufficiency.findMany({
    where: {
      rangeId: { not: null }
    },
    select: {
      rangeId: true,
      range: true
    },
    distinct: ['rangeId']
  });
  
  console.log('\nRanges used in MediaSufficiency:');
  mediaSufficiencyWithRanges.forEach(m => console.log(`  ID ${m.rangeId}: ${m.range}`));
  
  await prisma.$disconnect();
}

getRanges().catch(console.error);