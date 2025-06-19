import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDeletionLogic() {
  try {
    console.log('🧪 Testing deletion logic...');
    
    // Simulate what should happen:
    // 1. We have data for India (country ID 33) and ABP 2025 (lastUpdate ID 1)
    const countryId = 33; // India
    const lastUpdateId = 1; // ABP 2025
    
    console.log(`\n🔍 Checking existing game plans for Country ID: ${countryId}, Last Update ID: ${lastUpdateId}`);
    
    // Check what exists currently
    const existingPlans = await prisma.gamePlan.findMany({
      where: {
        countryId: countryId,
        last_update_id: lastUpdateId
      },
      include: {
        country: true,
        lastUpdate: true,
        campaign: true
      }
    });
    
    console.log(`📊 Found ${existingPlans.length} existing game plans`);
    
    if (existingPlans.length > 0) {
      console.log('📋 Existing plans:');
      existingPlans.forEach(plan => {
        console.log(`  - ID: ${plan.id}, Campaign: ${plan.campaign?.name}, Country: ${plan.country?.name}, LastUpdate: ${plan.lastUpdate?.name}, last_update_id: ${plan.last_update_id}`);
      });
      
      // Test the deletion query that should be used
      console.log(`\n🗑️ Testing deletion query...`);
      const deleteResult = await prisma.gamePlan.deleteMany({
        where: {
          countryId: countryId,
          last_update_id: lastUpdateId
        }
      });
      
      console.log(`✅ Would delete ${deleteResult.count} records`);
      
      // Check what remains
      const remainingPlans = await prisma.gamePlan.findMany({
        where: {
          countryId: countryId,
          last_update_id: lastUpdateId
        }
      });
      
      console.log(`📊 Remaining plans after deletion: ${remainingPlans.length}`);
      
    } else {
      console.log('ℹ️ No existing plans found to delete');
    }
    
    // Check all game plans
    console.log('\n📊 All game plans in database:');
    const allPlans = await prisma.gamePlan.findMany({
      include: {
        country: true,
        lastUpdate: true
      }
    });
    
    console.log(`Total: ${allPlans.length}`);
    allPlans.forEach(plan => {
      console.log(`  - ID: ${plan.id}, Country: ${plan.country?.name || 'Unknown'}, LastUpdate: ${plan.lastUpdate?.name || 'Unknown'}, last_update_id: ${plan.last_update_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing deletion logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeletionLogic();