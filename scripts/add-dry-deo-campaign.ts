import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDryDeoCampaign() {
  try {
    console.log('🔄 Adding Dry Deo campaign...');

    // 1. Check if Dry Deo range exists
    const dryDeoRange = await prisma.range.findUnique({
      where: { name: 'Dry Deo' }
    });

    if (!dryDeoRange) {
      console.log('❌ Dry Deo range not found in database');
      return;
    }

    console.log(`✅ Found Dry Deo range (ID: ${dryDeoRange.id})`);

    // 2. Check if Dry Deo campaign already exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { name: 'Dry Deo' }
    });

    if (existingCampaign) {
      console.log(`ℹ️  Campaign 'Dry Deo' already exists (ID: ${existingCampaign.id})`);
      
      // Check if it's already assigned to the correct range
      if (existingCampaign.rangeId === dryDeoRange.id) {
        console.log('✅ Campaign already assigned to Dry Deo range');
      } else {
        // Update the range assignment
        await prisma.campaign.update({
          where: { name: 'Dry Deo' },
          data: { rangeId: dryDeoRange.id }
        });
        console.log('✅ Updated campaign to point to Dry Deo range');
      }
    } else {
      // 3. Create the Dry Deo campaign
      const newCampaign = await prisma.campaign.create({
        data: {
          name: 'Dry Deo',
          rangeId: dryDeoRange.id
        }
      });
      console.log(`✅ Created 'Dry Deo' campaign (ID: ${newCampaign.id}) assigned to Dry Deo range`);
    }

    // 4. Verify the mapping
    const verifyMapping = await prisma.campaign.findUnique({
      where: { name: 'Dry Deo' },
      include: { range: true }
    });

    if (verifyMapping && verifyMapping.range) {
      console.log(`🔍 Verification: Dry Deo campaign → ${verifyMapping.range.name} range`);
    }

    // 5. Check what campaigns are now in Dry Deo range
    const campaignsInRange = await prisma.campaign.findMany({
      where: { rangeId: dryDeoRange.id }
    });

    console.log(`📊 Dry Deo range now has ${campaignsInRange.length} campaigns:`);
    campaignsInRange.forEach(campaign => {
      console.log(`  - ${campaign.name}`);
    });

    console.log('\n🎯 Dry Deo campaign setup complete!');

  } catch (error) {
    console.error('❌ Error adding Dry Deo campaign:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDryDeoCampaign();