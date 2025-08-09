import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGamePlansWOA() {
  console.log('Checking Game Plans WOA data...\n');
  
  // Get all campaigns that have media sufficiency data
  const mediaSufficiency = await prisma.mediaSufficiency.findMany({
    select: {
      campaign: true
    },
    distinct: ['campaign']
  });
  
  const uniqueCampaigns = mediaSufficiency.map(ms => ms.campaign).filter(Boolean);
  console.log('Unique campaigns in MediaSufficiency:', uniqueCampaigns);
  
  // Get campaign IDs
  const campaigns = await prisma.campaign.findMany({
    where: {
      name: {
        in: uniqueCampaigns as string[]
      }
    },
    select: {
      id: true,
      name: true
    }
  });
  
  console.log('\nCampaigns found:', campaigns);
  
  // Get game plans for these campaigns
  const gamePlans = await prisma.gamePlan.findMany({
    where: {
      campaignId: {
        in: campaigns.map(c => c.id)
      }
    },
    select: {
      id: true,
      campaignId: true,
      totalWoa: true,
      totalWoff: true,
      totalWeeks: true,
      weeksOffAir: true,
      startDate: true,
      endDate: true
    }
  });
  
  console.log('\nGame Plans data:');
  gamePlans.forEach(gp => {
    const campaign = campaigns.find(c => c.id === gp.campaignId);
    console.log(`\nCampaign: ${campaign?.name || 'Unknown'}`);
    console.log(`  - totalWoa: ${gp.totalWoa}`);
    console.log(`  - totalWoff: ${gp.totalWoff}`);
    console.log(`  - totalWeeks: ${gp.totalWeeks}`);
    console.log(`  - weeksOffAir: ${gp.weeksOffAir}`);
    console.log(`  - Start: ${gp.startDate}, End: ${gp.endDate}`);
  });
  
  // Calculate totals
  const totalWoa = gamePlans.reduce((sum, gp) => sum + (gp.totalWoa || 0), 0);
  const totalWoff = gamePlans.reduce((sum, gp) => sum + (gp.totalWoff || 0), 0);
  const totalWeeks = gamePlans.reduce((sum, gp) => sum + (gp.totalWeeks || 0), 0);
  
  console.log('\n=== TOTALS ===');
  console.log('Total WOA:', totalWoa);
  console.log('Total WOFF:', totalWoff);
  console.log('Total Weeks:', totalWeeks);
  
  await prisma.$disconnect();
}

checkGamePlansWOA().catch(console.error);