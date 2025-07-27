import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCampaigns() {
  try {
    const gamePlans = await prisma.gamePlan.findMany({
      include: {
        campaign: {
          include: {
            range: true
          }
        },
        category: true,
        country: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        }
      },
      take: 20
    });
    
    console.log('Game Plans with Campaigns:');
    const campaignMap = new Map();
    
    gamePlans.forEach(plan => {
      const campaignName = plan.campaign?.name;
      const categoryName = plan.category?.name;
      const rangeName = plan.campaign?.range?.name;
      const countryName = plan.country?.name;
      const mediaType = plan.mediaSubType?.mediaType?.name;
      
      if (campaignName) {
        if (!campaignMap.has(campaignName)) {
          campaignMap.set(campaignName, {
            campaign: campaignName,
            category: categoryName,
            range: rangeName,
            country: countryName,
            mediaTypes: new Set()
          });
        }
        if (mediaType) {
          campaignMap.get(campaignName).mediaTypes.add(mediaType);
        }
      }
    });
    
    console.log('\nUnique Campaigns:');
    Array.from(campaignMap.values()).forEach((campaign, index) => {
      console.log(`${index + 1}. Campaign: "${campaign.campaign}"`);
      console.log(`   Category: ${campaign.category}`);
      console.log(`   Range: ${campaign.range}`);
      console.log(`   Country: ${campaign.country}`);
      console.log(`   Media Types: ${Array.from(campaign.mediaTypes).join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCampaigns();