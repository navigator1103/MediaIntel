import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCampaignRanges() {
  try {
    console.log('🔍 Checking campaign-range relationships in database...');

    // Check specific campaigns
    const testCampaigns = ['Body Aloe Summer', 'Body Milk 5 in 1', 'Milk'];
    
    for (const campaignName of testCampaigns) {
      const campaign = await prisma.campaign.findUnique({
        where: { name: campaignName },
        include: { range: true }
      });
      
      if (campaign) {
        console.log(`✅ ${campaignName} → Range: ${campaign.range?.name || 'NO RANGE'} (Range ID: ${campaign.rangeId || 'NULL'})`);
      } else {
        console.log(`❌ ${campaignName} → NOT FOUND IN DATABASE`);
      }
    }

    // Check Milk range and its campaigns
    console.log('\n📊 Checking Milk range campaigns:');
    const milkRange = await prisma.range.findUnique({
      where: { name: 'Milk' },
      include: { campaigns: true }
    });

    if (milkRange) {
      console.log(`✅ Milk range found (ID: ${milkRange.id})`);
      console.log(`   Campaigns: [${milkRange.campaigns.map(c => c.name).join(', ')}]`);
    } else {
      console.log('❌ Milk range NOT FOUND in database');
    }

    // Check all campaign-range mappings
    console.log('\n🔄 All campaign-range mappings in database:');
    const campaignsWithRanges = await prisma.campaign.findMany({
      where: { rangeId: { not: null } },
      include: { range: true },
      orderBy: { name: 'asc' }
    });

    campaignsWithRanges.forEach(campaign => {
      console.log(`${campaign.name} → ${campaign.range?.name}`);
    });

    console.log(`\n📈 Total campaigns with ranges: ${campaignsWithRanges.length}`);

    // Check campaigns without ranges
    const campaignsWithoutRanges = await prisma.campaign.findMany({
      where: { rangeId: null }
    });

    if (campaignsWithoutRanges.length > 0) {
      console.log(`\n⚠️  Campaigns without ranges (${campaignsWithoutRanges.length}):`);
      campaignsWithoutRanges.slice(0, 10).forEach(campaign => {
        console.log(`  - ${campaign.name}`);
      });
      if (campaignsWithoutRanges.length > 10) {
        console.log(`  ... and ${campaignsWithoutRanges.length - 10} more`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking campaign ranges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampaignRanges();