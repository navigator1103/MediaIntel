import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReachPlanningData() {
  try {
    console.log('🔍 Checking reach planning data...\n');

    // Count total MediaSufficiency records
    const totalRecords = await prisma.mediaSufficiency.count();
    console.log(`📊 Total MediaSufficiency records: ${totalRecords}`);

    if (totalRecords > 0) {
      // Get the most recent records
      const recentRecords = await prisma.mediaSufficiency.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          lastUpdate: true,
          country: true,
          category: true,
          range: true,
          campaign: true,
          tvCopyLength: true,
          createdAt: true,
          uploadSession: true
        }
      });

      console.log('\n📋 Recent MediaSufficiency records:');
      recentRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        console.log(`      Country: ${record.country}`);
        console.log(`      Campaign: ${record.campaign}`);
        console.log(`      TV Copy Length: ${record.tvCopyLength}`);
        console.log(`      Created: ${record.createdAt}`);
        console.log(`      Session: ${record.uploadSession}`);
        console.log('');
      });

      // Check if we have records from recent reach planning sessions
      const reachPlanningRecords = await prisma.mediaSufficiency.findMany({
        where: {
          uploadSession: {
            startsWith: 'reach-planning-'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3
      });

      console.log(`🎯 Records from reach planning sessions: ${reachPlanningRecords.length}`);
      
      if (reachPlanningRecords.length > 0) {
        console.log('\n✅ Recent reach planning imports:');
        reachPlanningRecords.forEach((record, index) => {
          console.log(`   ${index + 1}. Session: ${record.uploadSession}`);
          console.log(`      Country: ${record.country}`);
          console.log(`      Campaign: ${record.campaign}`);
          console.log(`      TV Copy Length: ${record.tvCopyLength}`);
          console.log(`      Created: ${record.createdAt}`);
          console.log('');
        });
      } else {
        console.log('⚠️ No records found from reach-planning sessions');
      }
    } else {
      console.log('❌ No MediaSufficiency records found in database');
    }

  } catch (error) {
    console.error('❌ Error checking reach planning data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReachPlanningData();