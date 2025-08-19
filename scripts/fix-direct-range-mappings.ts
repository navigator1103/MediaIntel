import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDirectRangeMappings() {
  console.log('🔧 Fixing direct range mappings to match junction table...\n');
  
  const problemCampaigns = [
    { campaign: 'Zazil', expectedRange: 'Deo Even Tone' },
    { campaign: 'Sachet', expectedRange: 'Deo Even Tone' },
    { campaign: 'Vitamin Scrub', expectedRange: 'Men' },
    { campaign: 'C&E Tata', expectedRange: 'Vitamin Range' },
    { campaign: 'Brand (Institutional)', expectedRange: 'X-Cat' },
    { campaign: 'Eucerin brand AWON', expectedRange: 'X-Cat' }
  ];
  
  let fixedCount = 0;
  
  for (const { campaign: campaignName, expectedRange: expectedRangeName } of problemCampaigns) {
    console.log(`🔍 Fixing: "${campaignName}" → "${expectedRangeName}"`);
    
    // Find the campaign
    const campaign = await prisma.campaign.findFirst({
      where: { name: campaignName }
    });
    
    if (!campaign) {
      console.log(`   ❌ Campaign "${campaignName}" not found`);
      continue;
    }
    
    // Find the expected range
    const expectedRange = await prisma.range.findFirst({
      where: { name: expectedRangeName }
    });
    
    if (!expectedRange) {
      console.log(`   ❌ Range "${expectedRangeName}" not found`);
      continue;
    }
    
    // Check current direct mapping
    const currentRange = campaign.rangeId ? await prisma.range.findUnique({
      where: { id: campaign.rangeId }
    }) : null;
    
    console.log(`   📊 Current direct mapping: ${currentRange ? `"${currentRange.name}"` : 'None'}`);
    console.log(`   📊 Expected mapping: "${expectedRangeName}"`);
    
    // Verify junction table has this mapping
    const junctionMapping = await prisma.rangeToCampaign.findFirst({
      where: {
        campaignId: campaign.id,
        rangeId: expectedRange.id
      }
    });
    
    if (!junctionMapping) {
      console.log(`   ⚠️  Junction table mapping missing! Skipping to avoid inconsistency.`);
      continue;
    }
    
    // Update the direct range mapping
    if (campaign.rangeId !== expectedRange.id) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { rangeId: expectedRange.id }
      });
      
      console.log(`   ✅ Updated direct mapping: "${campaignName}" → "${expectedRangeName}"`);
      fixedCount++;
    } else {
      console.log(`   ✅ Direct mapping already correct`);
    }
  }
  
  console.log(`\n📊 SUMMARY: Fixed ${fixedCount} direct range mappings`);
  
  // Verify the fixes
  console.log('\n🧪 Verifying fixes...');
  for (const { campaign: campaignName, expectedRange: expectedRangeName } of problemCampaigns) {
    const campaign = await prisma.campaign.findFirst({
      where: { name: campaignName },
      include: { range: true }
    });
    
    if (campaign && campaign.range) {
      const isCorrect = campaign.range.name === expectedRangeName;
      console.log(`   ${isCorrect ? '✅' : '❌'} "${campaignName}": "${campaign.range.name}"`);
    } else {
      console.log(`   ❌ "${campaignName}": No range mapping found`);
    }
  }
  
  console.log('\n✅ Direct range mapping fixes completed!');
  console.log('These campaigns should now pass validation.');
  
  await prisma.$disconnect();
}

fixDirectRangeMappings();