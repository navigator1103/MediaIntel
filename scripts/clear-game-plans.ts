import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearGamePlans() {
  try {
    console.log('🗑️  Clearing game plans database...');
    
    // Get count before deletion
    const countBefore = await prisma.gamePlan.count();
    console.log(`📊 Found ${countBefore} game plans in database`);
    
    if (countBefore === 0) {
      console.log('✅ Database is already empty');
      return;
    }
    
    // Delete all game plans
    const deleteResult = await prisma.gamePlan.deleteMany({});
    
    console.log(`✅ Successfully deleted ${deleteResult.count} game plans`);
    
    // Verify deletion
    const countAfter = await prisma.gamePlan.count();
    console.log(`📊 Game plans remaining: ${countAfter}`);
    
    if (countAfter === 0) {
      console.log('🎉 Game plans database cleared successfully!');
      console.log('🔄 Ready for testing new upload feature with financial cycle management');
    } else {
      console.log('⚠️  Warning: Some game plans may still remain');
    }
    
  } catch (error) {
    console.error('❌ Error clearing game plans:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearGamePlans();