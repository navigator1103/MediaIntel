import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanedRecords() {
  console.log('🧹 Cleaning up orphaned records in junction table...\n');
  
  try {
    // Get all junction records
    const allJunctions = await prisma.rangeToCampaign.findMany();
    const orphanedIds: number[] = [];
    
    for (const junction of allJunctions) {
      // Check if range exists
      const range = await prisma.range.findUnique({
        where: { id: junction.rangeId }
      });
      
      // Check if campaign exists  
      const campaign = await prisma.campaign.findUnique({
        where: { id: junction.campaignId }
      });
      
      if (!range || !campaign) {
        orphanedIds.push(junction.id);
        console.log(`🗑️  Will delete junction ID ${junction.id} (rangeId: ${junction.rangeId}, campaignId: ${junction.campaignId})`);
        if (!range) console.log(`     Missing range ID: ${junction.rangeId}`);
        if (!campaign) console.log(`     Missing campaign ID: ${junction.campaignId}`);
      }
    }
    
    if (orphanedIds.length > 0) {
      console.log(`\n🗑️  Deleting ${orphanedIds.length} orphaned records...`);
      
      for (const id of orphanedIds) {
        await prisma.rangeToCampaign.delete({
          where: { id }
        });
        console.log(`   ✅ Deleted junction record ID: ${id}`);
      }
      
      console.log('\n✅ Orphaned records cleaned up!');
      
      // Test the junction query now
      console.log('\n🧪 Testing junction query after cleanup...');
      const testResult = await prisma.rangeToCampaign.findMany({
        take: 5,
        include: {
          range: true,
          campaign: true
        }
      });
      
      console.log(`✅ Junction query works! Retrieved ${testResult.length} records`);
      testResult.forEach(record => {
        console.log(`   - Range: ${record.range.name}, Campaign: ${record.campaign.name}`);
      });
      
    } else {
      console.log('✅ No orphaned records found');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedRecords();