import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING ANTI AGE GAME PLANS ===\n');

  try {
    // First, find all campaigns that should be Anti Age according to master data or database
    const antiAgeCampaignNames = [
      'Elasticity Motown',
      'Golden Age (Gold Revamp)', 
      '3D Serum + Dragon (Gold)',
      'Club55 Serum',
      'Epigenetics (Benjamin Button)',
      'Epigenetics (Epi 2.0)', 
      'Epigenius RL',
      'Refillution',
      // Database variations
      'Gold Revamp',
      '3D Serum',
      '3D Serum + Dragon'
    ];

    console.log('1. SEARCHING FOR GAME PLANS WITH ANTI AGE CAMPAIGNS:');
    console.log('--------------------------------------------------');

    for (const campaignName of antiAgeCampaignNames) {
      const gamePlans = await prisma.gamePlan.findMany({
        where: {
          campaign: {
            name: campaignName
          }
        },
        include: {
          campaign: {
            include: {
              range: true
            }
          },
          category: true
        },
        take: 3 // Just show first 3 per campaign
      });

      if (gamePlans.length > 0) {
        console.log(`\\n📋 Found ${gamePlans.length} game plans for campaign "${campaignName}":`);
        gamePlans.forEach((plan, index) => {
          const categoryName = plan.category?.name || 'N/A';
          const rangeName = plan.campaign?.range?.name || 'N/A';
          console.log(`  ${index + 1}. Category: "${categoryName}" | Range: "${rangeName}" | Plan ID: ${plan.id}`);
        });
      }
    }

    console.log('\\n2. CHECKING ALL CATEGORIES IN GAME PLANS:');
    console.log('-----------------------------------------');
    
    // Get all unique categories used in game plans
    const gameplanCategories = await prisma.gamePlan.findMany({
      select: {
        category: true
      }
    });

    console.log('Categories found in game plans:');
    const uniqueCategories = new Set();
    gameplanCategories.forEach((plan: any) => {
      if (plan.category?.name) {
        uniqueCategories.add(plan.category.name);
      }
    });

    Array.from(uniqueCategories).sort().forEach((categoryName, index) => {
      console.log(`  ${index + 1}. ${categoryName}`);
    });

    console.log('\\n3. CHECKING FOR ANTI AGE CAMPAIGNS WITHOUT GAME PLANS:');
    console.log('-----------------------------------------------------');
    
    // Find Anti Age campaigns that exist but have no game plans
    const antiAgeRange = await prisma.range.findUnique({
      where: { name: 'Anti Age' },
      include: {
        campaigns: {
          include: {
            gamePlans: true
          }
        }
      }
    });

    if (antiAgeRange) {
      console.log(`Anti Age range has ${antiAgeRange.campaigns.length} campaigns:`);
      antiAgeRange.campaigns.forEach((campaign, index) => {
        const gamePlanCount = campaign.gamePlans.length;
        console.log(`  ${index + 1}. "${campaign.name}" - ${gamePlanCount} game plans`);
      });
    }

    console.log('\\n4. SAMPLE GAME PLANS FROM DATABASE:');
    console.log('-----------------------------------');
    
    // Show a sample of recent game plans to understand the data structure
    const sampleGamePlans = await prisma.gamePlan.findMany({
      include: {
        campaign: {
          include: {
            range: true
          }
        },
        category: true
      },
      orderBy: {
        id: 'desc'
      },
      take: 10
    });

    console.log('Recent game plans:');
    sampleGamePlans.forEach((plan, index) => {
      const categoryName = plan.category?.name || 'N/A';
      const campaignName = plan.campaign?.name || 'N/A';
      const rangeName = plan.campaign?.range?.name || 'N/A';
      console.log(`  ${index + 1}. Category: "${categoryName}" | Campaign: "${campaignName}" | Range: "${rangeName}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);