import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGamePlans() {
  try {
    console.log('Fetching game plans for Pearl and Beauty campaigns...');
    
    // Find campaigns with names containing 'pearl' or 'beauty' (case insensitive)
    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { name: { contains: 'pearl', mode: 'insensitive' } },
          { name: { contains: 'beauty', mode: 'insensitive' } }
        ]
      },
      include: {
        gamePlans: {
          include: {
            mediaSubType: true,
            pmType: true
          },
          orderBy: {
            startDate: 'desc'
          }
        },
        range: true
      }
    });

    if (campaigns.length === 0) {
      console.log('No matching campaigns found.');
      return;
    }

    console.log('\n=== Campaign Budgets ===');
    
    for (const campaign of campaigns) {
      console.log(`\nCampaign: ${campaign.name} (ID: ${campaign.id})`);
      console.log(`Range: ${campaign.range?.name || 'N/A'}`);
      
      if (campaign.gamePlans.length === 0) {
        console.log('  No game plans found for this campaign.');
        continue;
      }

      console.log('  Game Plans:');
      
      let totalBudget = 0;
      
      for (const plan of campaign.gamePlans) {
        console.log(`  - Media: ${plan.mediaSubType.name}`);
        console.log(`    PM Type: ${plan.pmType?.name || 'N/A'}`);
        console.log(`    Period: ${plan.startDate.toISOString().split('T')[0]} to ${plan.endDate.toISOString().split('T')[0]}`);
        console.log(`    Budget: ${plan.totalBudget || 0}`);
        console.log(`    Q1: ${plan.q1Budget || 0}, Q2: ${plan.q2Budget || 0}, Q3: ${plan.q3Budget || 0}, Q4: ${plan.q4Budget || 0}`);
        console.log(`    Reach: ${plan.reach1Plus || 0} (1+), ${plan.reach3Plus || 0} (3+)`);
        console.log('    ---');
        
        totalBudget += plan.totalBudget || 0;
      }
      
      console.log(`\n  Total Budget for ${campaign.name}: ${totalBudget}`);
    }
    
  } catch (error) {
    console.error('Error fetching game plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the query
checkGamePlans()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
