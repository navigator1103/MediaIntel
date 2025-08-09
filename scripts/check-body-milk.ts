import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBodyMilk() {
  // Check game plans for India
  const indiaGamePlans = await prisma.gamePlan.findMany({
    where: {
      country: {
        name: 'India'
      }
    },
    include: {
      campaign: true,
      country: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      }
    }
  });
  
  console.log('=== Game Plans for India ===');
  console.log(`Total: ${indiaGamePlans.length}`);
  indiaGamePlans.forEach(gp => {
    console.log(`  Campaign: ${gp.campaign?.name}, Budget: ${gp.totalBudget}`);
  });
  
  // Check all Body Milk campaigns
  const bodyMilkCampaigns = await prisma.gamePlan.findMany({
    where: {
      campaign: {
        name: {
          contains: 'Body Milk'
        }
      }
    },
    include: {
      campaign: true,
      country: true
    }
  });
  
  console.log('\n=== All Body Milk Game Plans ===');
  bodyMilkCampaigns.forEach(gp => {
    console.log(`  Campaign: ${gp.campaign?.name}`);
    console.log(`    Country: ${gp.country?.name} (ID: ${gp.countryId})`);
    console.log(`    Budget: ${gp.totalBudget}`);
  });
  
  // Check what user with India access (countryId: 33) should see
  console.log('\n=== What user with India access (ID: 33) should see ===');
  
  const userAccessibleGamePlans = await prisma.gamePlan.findMany({
    where: {
      countryId: 33  // India
    },
    include: {
      campaign: true,
      country: true
    }
  });
  
  console.log(`Game Plans in India: ${userAccessibleGamePlans.length}`);
  userAccessibleGamePlans.forEach(gp => {
    console.log(`  - ${gp.campaign?.name}`);
  });
  
  // Check MediaSufficiency table
  const mediaSufficiency = await prisma.mediaSufficiency.findMany();
  console.log('\n=== MediaSufficiency Records ===');
  console.log(`Total: ${mediaSufficiency.length}`);
  mediaSufficiency.forEach(ms => {
    console.log(`  Campaign: ${ms.campaign}, Country: ${ms.country} (ID: ${ms.countryId})`);
  });
  
  await prisma.$disconnect();
}

checkBodyMilk().catch(console.error);