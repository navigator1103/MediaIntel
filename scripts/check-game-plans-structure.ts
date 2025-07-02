import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGamePlansStructure() {
  try {
    console.log('🔍 Checking game plans structure for validation logic...\n');

    // Get sample game plans with media type information
    const gamePlans = await prisma.gamePlan.findMany({
      take: 5,
      include: {
        campaign: true,
        country: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        lastUpdate: true
      },
      orderBy: {
        id: 'desc'
      }
    });

    console.log('📊 Sample game plans structure:');
    gamePlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. Campaign: ${plan.campaign?.name || 'Unknown'}`);
      console.log(`      Country: ${plan.country?.name || 'Unknown'}`);
      console.log(`      Financial Cycle: ${plan.lastUpdate?.name || 'Unknown'}`);
      console.log(`      Media Type: ${plan.mediaSubType?.mediaType?.name || 'Unknown'}`);
      console.log(`      Media Sub Type: ${plan.mediaSubType?.name || 'Unknown'}`);
      console.log(`      Last Update ID: ${plan.last_update_id}`);
      console.log('');
    });

    // Get unique combinations for validation reference
    const uniqueCombinations = await prisma.gamePlan.groupBy({
      by: ['countryId', 'last_update_id'],
      _count: {
        id: true
      }
    });

    console.log('🎯 Unique Country + Financial Cycle combinations in game plans:');
    for (const combo of uniqueCombinations) {
      const country = await prisma.country.findUnique({ where: { id: combo.countryId || 0 } });
      const lastUpdate = await prisma.lastUpdate.findUnique({ where: { id: combo.last_update_id || 0 } });
      
      console.log(`   - ${country?.name || 'Unknown'} + ${lastUpdate?.name || 'Unknown'} (${combo._count.id} game plans)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGamePlansStructure();