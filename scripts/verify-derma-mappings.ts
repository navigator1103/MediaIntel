import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDermaMappings() {
  try {
    console.log('🔍 Verifying all derma campaign mappings...');

    const dermaRanges = ['Acne', 'Anti Age', 'Anti Pigment', 'Dry Skin'];
    
    for (const rangeName of dermaRanges) {
      const range = await prisma.range.findUnique({
        where: { name: rangeName },
        include: { campaigns: true }
      });

      if (range) {
        console.log(`\n✅ ${rangeName} range (ID: ${range.id}):`);
        console.log(`   Campaigns (${range.campaigns.length}): [${range.campaigns.map(c => c.name).join(', ')}]`);
      } else {
        console.log(`\n❌ ${rangeName} range not found`);
      }
    }

    // Check for any derma campaigns without ranges
    const allDermaCampaigns = [
      'Dermo Purifyer', 'Anti-Acne Range', 'Dermopure Body (Bacne)', 'Eucerin DermoPure', 'Acne Guard',
      'Anti Age Serum', 'Hyaluron Filler Range', 'Age Defense Cream', 'Cellular Anti Age', 'Collagen Plus',
      'Anti Pigment Serum', 'Thiamidol Range', 'Dark Spot Corrector', 'Brightening Complex', 'Pigment Control',
      'Aquaphor Range', 'pH5 Gentle', 'Atopi Control', 'Ultra Hydrating', 'Dry Skin Relief', 'Moisture Barrier'
    ];

    const campaignsWithoutRanges = await prisma.campaign.findMany({
      where: { 
        name: { in: allDermaCampaigns },
        rangeId: null 
      }
    });

    if (campaignsWithoutRanges.length > 0) {
      console.log(`\n⚠️  ${campaignsWithoutRanges.length} derma campaigns still without ranges:`);
      campaignsWithoutRanges.forEach(campaign => {
        console.log(`  - ${campaign.name}`);
      });
    } else {
      console.log('\n🎯 All derma campaigns have proper range assignments!');
    }

    // Summary
    console.log('\n📊 Derma mapping summary:');
    console.log(`✅ Total derma campaigns: ${allDermaCampaigns.length}`);
    console.log(`✅ Mapped to ranges: ${allDermaCampaigns.length - campaignsWithoutRanges.length}`);
    console.log(`⚠️  Without ranges: ${campaignsWithoutRanges.length}`);

  } catch (error) {
    console.error('❌ Error verifying derma mappings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDermaMappings();