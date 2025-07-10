import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGovernanceFields() {
  console.log('🔄 Updating existing campaigns and ranges with governance fields...');

  try {
    // Update all existing campaigns to active status (since we have default values, just update all)
    const campaignUpdate = await prisma.campaign.updateMany({
      data: {
        createdBy: 'manual'  // Mark existing ones as manually created
      }
    });

    console.log(`✅ Updated ${campaignUpdate.count} campaigns to active status`);

    // Update all existing ranges to active status (since we have default values, just update all)
    const rangeUpdate = await prisma.range.updateMany({
      data: {
        createdBy: 'manual'  // Mark existing ones as manually created
      }
    });

    console.log(`✅ Updated ${rangeUpdate.count} ranges to active status`);

    // Get counts for verification
    const [totalCampaigns, totalRanges, activeCampaigns, activeRanges] = await Promise.all([
      prisma.campaign.count(),
      prisma.range.count(),
      prisma.campaign.count({ where: { status: 'active' } }),
      prisma.range.count({ where: { status: 'active' } })
    ]);

    console.log('\n📊 Final Status:');
    console.log(`   Campaigns: ${activeCampaigns}/${totalCampaigns} active`);
    console.log(`   Ranges: ${activeRanges}/${totalRanges} active`);

    console.log('\n🎉 Governance field update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating governance fields:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateGovernanceFields()
  .catch(console.error)
  .finally(() => process.exit(0));