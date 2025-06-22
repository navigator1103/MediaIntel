import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Derma campaign to range mappings based on our earlier work
const dermaCampaignMappings = {
  // Acne range campaigns
  "Dermo Purifyer": "Acne",
  "Anti-Acne Range": "Acne", 
  "Dermopure Body (Bacne)": "Acne",
  "Eucerin DermoPure": "Acne",
  "Acne Guard": "Acne",
  
  // Anti Age range campaigns
  "Anti Age Serum": "Anti Age",
  "Hyaluron Filler Range": "Anti Age",
  "Age Defense Cream": "Anti Age", 
  "Cellular Anti Age": "Anti Age",
  "Collagen Plus": "Anti Age",
  
  // Anti Pigment range campaigns
  "Anti Pigment Serum": "Anti Pigment",
  "Thiamidol Range": "Anti Pigment",
  "Dark Spot Corrector": "Anti Pigment",
  "Brightening Complex": "Anti Pigment", 
  "Pigment Control": "Anti Pigment",
  
  // Dry Skin range campaigns
  "Aquaphor Range": "Dry Skin",
  "pH5 Gentle": "Dry Skin",
  "Atopi Control": "Dry Skin",
  "Ultra Hydrating": "Dry Skin",
  "Dry Skin Relief": "Dry Skin",
  "Moisture Barrier": "Dry Skin"
};

async function fixDermaCampaignRanges() {
  try {
    console.log('🔄 Fixing derma campaign-range relationships in database...');

    // Get all ranges
    const ranges = await prisma.range.findMany();
    const rangeMap = new Map(ranges.map(r => [r.name, r.id]));

    let updatedCount = 0;
    let errorCount = 0;

    for (const [campaignName, rangeName] of Object.entries(dermaCampaignMappings)) {
      try {
        const rangeId = rangeMap.get(rangeName);
        
        if (!rangeId) {
          console.log(`⚠️  Range '${rangeName}' not found for campaign '${campaignName}'`);
          errorCount++;
          continue;
        }

        // Check if campaign exists
        const campaign = await prisma.campaign.findUnique({
          where: { name: campaignName }
        });

        if (!campaign) {
          console.log(`⚠️  Campaign '${campaignName}' not found in database`);
          errorCount++;
          continue;
        }

        // Update campaign with range
        await prisma.campaign.update({
          where: { name: campaignName },
          data: { rangeId: rangeId }
        });

        console.log(`✅ ${campaignName} → ${rangeName} (Range ID: ${rangeId})`);
        updatedCount++;

      } catch (error) {
        console.log(`❌ Error updating ${campaignName}: ${error}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary: ${updatedCount} campaigns updated, ${errorCount} errors`);

    // Verify the updates
    console.log('\n🔍 Verifying derma campaign mappings:');
    const dermaCampaignNames = Object.keys(dermaCampaignMappings);
    
    const verifyResults = await prisma.campaign.findMany({
      where: { 
        name: { in: dermaCampaignNames }
      },
      include: { range: true },
      orderBy: { name: 'asc' }
    });

    verifyResults.forEach(campaign => {
      const expectedRange = dermaCampaignMappings[campaign.name as keyof typeof dermaCampaignMappings];
      const actualRange = campaign.range?.name || 'NO RANGE';
      const status = actualRange === expectedRange ? '✅' : '❌';
      console.log(`${status} ${campaign.name} → ${actualRange} (expected: ${expectedRange})`);
    });

    // Check for campaigns without ranges
    const campaignsWithoutRanges = await prisma.campaign.findMany({
      where: { 
        name: { in: dermaCampaignNames },
        rangeId: null 
      }
    });

    if (campaignsWithoutRanges.length > 0) {
      console.log(`\n⚠️  ${campaignsWithoutRanges.length} derma campaigns still without ranges:`);
      campaignsWithoutRanges.forEach(campaign => {
        console.log(`  - ${campaign.name}`);
      });
    } else {
      console.log('\n✅ All derma campaigns now have range assignments!');
    }

  } catch (error) {
    console.error('❌ Error fixing derma campaign ranges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDermaCampaignRanges();