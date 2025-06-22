import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDrySkinRange() {
  try {
    console.log('🔄 Adding Dry Skin range to database...');

    // Check if range already exists
    const existingRange = await prisma.range.findUnique({
      where: { name: 'Dry Skin' }
    });

    if (existingRange) {
      console.log('✅ Dry Skin range already exists');
      return existingRange;
    }

    // Create the Dry Skin range
    const drySkinRange = await prisma.range.create({
      data: { name: 'Dry Skin' }
    });

    console.log(`✅ Created Dry Skin range (ID: ${drySkinRange.id})`);

    // Now update the derma campaigns that should belong to Dry Skin
    const drySkinCampaigns = [
      "Aquaphor Range",
      "pH5 Gentle", 
      "Atopi Control",
      "Ultra Hydrating",
      "Dry Skin Relief",
      "Moisture Barrier"
    ];

    let updatedCount = 0;
    
    for (const campaignName of drySkinCampaigns) {
      try {
        const result = await prisma.campaign.update({
          where: { name: campaignName },
          data: { rangeId: drySkinRange.id }
        });
        console.log(`✅ ${campaignName} → Dry Skin`);
        updatedCount++;
      } catch (error) {
        console.log(`⚠️  Could not update ${campaignName}: ${error}`);
      }
    }

    console.log(`\n📊 Updated ${updatedCount} campaigns to Dry Skin range`);

    // Verify the updates
    const drySkinCampaignsInDb = await prisma.campaign.findMany({
      where: { rangeId: drySkinRange.id },
      orderBy: { name: 'asc' }
    });

    console.log(`\n🔍 Dry Skin range now has ${drySkinCampaignsInDb.length} campaigns:`);
    drySkinCampaignsInDb.forEach(campaign => {
      console.log(`  - ${campaign.name}`);
    });

  } catch (error) {
    console.error('❌ Error adding Dry Skin range:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDrySkinRange();