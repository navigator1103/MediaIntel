import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findGamePlanData() {
  try {
    // Get all countries and financial cycles that have game plans
    console.log('=== COUNTRIES WITH GAME PLANS ===');
    const countriesWithGamePlans = await prisma.gamePlan.findMany({
      include: {
        country: true,
        lastUpdate: true
      },
      distinct: ['countryId', 'last_update_id']
    });
    
    const uniqueCountries = new Map();
    countriesWithGamePlans.forEach(gp => {
      if (gp.country && gp.lastUpdate) {
        const key = `${gp.country.name}-${gp.lastUpdate.name}`;
        if (!uniqueCountries.has(key)) {
          uniqueCountries.set(key, {
            countryId: gp.countryId,
            countryName: gp.country.name,
            financialCycle: gp.lastUpdate.name,
            lastUpdateId: gp.last_update_id
          });
        }
      }
    });
    
    Array.from(uniqueCountries.values()).forEach(item => {
      console.log(`Country: ${item.countryName} (ID: ${item.countryId}), Financial Cycle: ${item.financialCycle} (ID: ${item.lastUpdateId})`);
    });
    
    // Get sample game plan data for the first country/cycle
    if (uniqueCountries.size > 0) {
      const firstCountry = Array.from(uniqueCountries.values())[0];
      console.log(`\n=== SAMPLE GAME PLAN DATA FOR ${firstCountry.countryName} - ${firstCountry.financialCycle} ===`);
      
      const sampleGamePlans = await prisma.gamePlan.findMany({
        where: {
          countryId: firstCountry.countryId,
          last_update_id: firstCountry.lastUpdateId
        },
        include: {
          campaign: {
            include: {
              range: true
            }
          },
          category: true,
          mediaSubType: {
            include: {
              mediaType: true
            }
          }
        },
        take: 10
      });
      
      // Group by campaign to see media types
      const campaignGroups = new Map();
      sampleGamePlans.forEach(gp => {
        const campaignName = gp.campaign?.name;
        if (campaignName) {
          if (!campaignGroups.has(campaignName)) {
            campaignGroups.set(campaignName, {
              category: gp.category?.name,
              range: gp.campaign?.range?.name,
              campaign: campaignName,
              mediaTypes: new Set()
            });
          }
          const mediaType = gp.mediaSubType?.mediaType?.name;
          if (mediaType) {
            campaignGroups.get(campaignName).mediaTypes.add(mediaType);
          }
        }
      });
      
      Array.from(campaignGroups.values()).forEach((campaign, index) => {
        const mediaTypesArray = Array.from(campaign.mediaTypes);
        console.log(`${index + 1}. Category: ${campaign.category}`);
        console.log(`   Range: ${campaign.range}`);
        console.log(`   Campaign: ${campaign.campaign}`);
        console.log(`   Media Types: ${mediaTypesArray.join(', ')}`);
        console.log(`   Type: ${mediaTypesArray.length > 1 ? 'MIXED (TV+Digital)' : mediaTypesArray[0] + ' ONLY'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findGamePlanData();