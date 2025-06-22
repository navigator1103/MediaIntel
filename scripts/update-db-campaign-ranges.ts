import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCampaignRanges() {
  try {
    console.log('🔄 Updating campaign-range relationships in database...');

    // First, get the Milk range ID
    const milkRange = await prisma.range.findUnique({
      where: { name: 'Milk' }
    });

    if (!milkRange) {
      console.error('❌ Milk range not found in database');
      return;
    }

    console.log(`✅ Found Milk range (ID: ${milkRange.id})`);

    // Update Body Aloe Summer to Milk range
    const bodyAloeResult = await prisma.campaign.update({
      where: { name: 'Body Aloe Summer' },
      data: { rangeId: milkRange.id }
    });
    console.log(`✅ Updated Body Aloe Summer → Milk (Range ID: ${milkRange.id})`);

    // Update Body Milk 5 in 1 to Milk range  
    const bodyMilkResult = await prisma.campaign.update({
      where: { name: 'Body Milk 5 in 1' },
      data: { rangeId: milkRange.id }
    });
    console.log(`✅ Updated Body Milk 5 in 1 → Milk (Range ID: ${milkRange.id})`);

    // Verify the changes
    console.log('\n🔍 Verifying updates:');
    
    const updatedCampaigns = await prisma.campaign.findMany({
      where: { 
        name: { in: ['Body Aloe Summer', 'Body Milk 5 in 1'] }
      },
      include: { range: true }
    });

    updatedCampaigns.forEach(campaign => {
      console.log(`✅ ${campaign.name} → ${campaign.range?.name} (Range ID: ${campaign.rangeId})`);
    });

    // Check Milk range campaigns
    const milkCampaigns = await prisma.campaign.findMany({
      where: { rangeId: milkRange.id }
    });

    console.log(`\n📊 Milk range now has ${milkCampaigns.length} campaigns:`);
    milkCampaigns.forEach(campaign => {
      console.log(`  - ${campaign.name}`);
    });

    console.log('\n🎯 Database campaign-range relationships updated successfully!');

  } catch (error) {
    console.error('❌ Error updating campaign ranges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCampaignRanges();