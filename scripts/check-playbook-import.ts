import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPlaybookImport() {
  try {
    console.log('🔍 Checking Playbook ID import results...');

    // 1. Check if any GamePlans have playbook_id values
    const gamePlansWithPlaybook = await prisma.gamePlan.findMany({
      where: {
        playbook_id: {
          not: null
        }
      },
      select: {
        id: true,
        playbook_id: true,
        campaign: {
          select: {
            name: true
          }
        },
        country: {
          select: {
            name: true
          }
        },
        totalBudget: true,
        year: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Get the 10 most recent ones
    });

    console.log(`\n📊 Found ${gamePlansWithPlaybook.length} GamePlans with Playbook IDs:`);
    
    if (gamePlansWithPlaybook.length > 0) {
      console.log('\n✅ Recent GamePlans with Playbook IDs:');
      gamePlansWithPlaybook.forEach((gp, index) => {
        console.log(`${index + 1}. Playbook ID: "${gp.playbook_id}"`);
        console.log(`   Campaign: ${gp.campaign?.name || 'N/A'}`);
        console.log(`   Country: ${gp.country?.name || 'N/A'}`);
        console.log(`   Budget: ${gp.totalBudget}`);
        console.log(`   Year: ${gp.year}`);
        console.log(`   Created: ${gp.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No GamePlans found with Playbook IDs');
    }

    // 2. Check total GamePlans count
    const totalGamePlans = await prisma.gamePlan.count();
    console.log(`📈 Total GamePlans in database: ${totalGamePlans}`);

    // 3. Check how many have playbook_id vs how many don't
    const withPlaybookCount = await prisma.gamePlan.count({
      where: {
        playbook_id: {
          not: null
        }
      }
    });

    const withoutPlaybookCount = await prisma.gamePlan.count({
      where: {
        playbook_id: null
      }
    });

    console.log(`\n📊 Playbook ID Statistics:`);
    console.log(`✅ With Playbook ID: ${withPlaybookCount}`);
    console.log(`⚪ Without Playbook ID: ${withoutPlaybookCount}`);
    console.log(`📊 Total: ${totalGamePlans}`);

    // 4. Show unique Playbook IDs
    const uniquePlaybookIds = await prisma.gamePlan.findMany({
      where: {
        playbook_id: {
          not: null
        }
      },
      select: {
        playbook_id: true
      },
      distinct: ['playbook_id']
    });

    if (uniquePlaybookIds.length > 0) {
      console.log(`\n🆔 Unique Playbook IDs (${uniquePlaybookIds.length}):`);
      uniquePlaybookIds.forEach(item => {
        console.log(`  - "${item.playbook_id}"`);
      });
    }

    // 5. Check the most recent imports (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentImports = await prisma.gamePlan.findMany({
      where: {
        createdAt: {
          gte: yesterday.toISOString()
        }
      },
      select: {
        id: true,
        playbook_id: true,
        campaign: {
          select: {
            name: true
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`\n⏰ Recent imports (last 24 hours): ${recentImports.length}`);
    recentImports.forEach((gp, index) => {
      console.log(`${index + 1}. Campaign: ${gp.campaign?.name || 'N/A'} | Playbook: ${gp.playbook_id || 'NULL'} | Created: ${gp.createdAt}`);
    });

    if (withPlaybookCount > 0) {
      console.log('\n🎉 SUCCESS: Playbook ID import is working correctly!');
    } else {
      console.log('\n⚠️  No Playbook IDs found. Possible issues:');
      console.log('   - CSV column name not recognized');
      console.log('   - Playbook ID column was empty');
      console.log('   - Import failed or validation errors');
    }

  } catch (error) {
    console.error('❌ Error checking Playbook ID import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlaybookImport();