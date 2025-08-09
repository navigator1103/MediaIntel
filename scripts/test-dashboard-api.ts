import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDashboardAPI() {
  // Simulate user with India access (countryId: 33)
  const accessibleCountryIds = [33];
  
  console.log('=== Simulating user with India access (ID: 33) ===\n');
  
  // 1. Game Plans query (from /api/dashboard/media-sufficiency)
  const whereClause = {
    countryId: {
      in: accessibleCountryIds
    }
  };
  
  const gamePlans = await prisma.gamePlan.findMany({
    where: whereClause,
    include: {
      campaign: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      },
      country: true,
      pmType: true,
    }
  });
  
  console.log('Game Plans visible to user:');
  gamePlans.forEach(gp => {
    console.log(`  - ${gp.campaign?.name} (${gp.country?.name})`);
  });
  
  // 2. MediaSufficiency query (from /api/dashboard/media-sufficiency-reach)
  const msWhereClause = {
    countryId: {
      in: accessibleCountryIds
    }
  };
  
  const mediaSufficiencyData = await prisma.mediaSufficiency.findMany({
    where: msWhereClause,
    select: {
      id: true,
      country: true,
      countryId: true,
      campaign: true,
      tvPlannedR1Plus: true,
      digitalPlannedR1Plus: true
    }
  });
  
  console.log('\nMediaSufficiency records visible to user:');
  mediaSufficiencyData.forEach(ms => {
    console.log(`  - ${ms.campaign} (${ms.country})`);
  });
  
  // Check what happens without country filter (admin users)
  console.log('\n=== Admin user (no country filter) ===\n');
  
  const allGamePlans = await prisma.gamePlan.findMany({
    include: {
      campaign: true,
      country: true
    }
  });
  
  console.log('All Game Plans:');
  const countryCounts: Record<string, number> = {};
  allGamePlans.forEach(gp => {
    const country = gp.country?.name || 'Unknown';
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });
  
  Object.entries(countryCounts).forEach(([country, count]) => {
    console.log(`  ${country}: ${count} game plans`);
  });
  
  const allMediaSufficiency = await prisma.mediaSufficiency.findMany();
  console.log('\nAll MediaSufficiency records:');
  allMediaSufficiency.forEach(ms => {
    console.log(`  - ${ms.campaign} (${ms.country})`);
  });
  
  await prisma.$disconnect();
}

testDashboardAPI().catch(console.error);