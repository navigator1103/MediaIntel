import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugValidationLogic() {
  console.log('🔍 Debugging validation logic for problematic campaigns...\n');
  
  const problemCampaigns = [
    { campaign: 'Zazil', range: 'Deo Even Tone' },
    { campaign: 'Sachet', range: 'Deo Even Tone' },
    { campaign: 'Deep X-Cat', range: 'Deep' },
    { campaign: 'Vitamin Scrub', range: 'Men' },
    { campaign: 'C&E Tata', range: 'Vitamin Range' },
    { campaign: 'Dermo Purifyer', range: 'Acne' },
    { campaign: 'Brand (Institutional)', range: 'X-Cat' },
    { campaign: 'Eucerin brand AWON', range: 'X-Cat' }
  ];
  
  // Check SHARED_CAMPAIGNS list
  const SHARED_CAMPAIGNS = [
    'Search AWON',
    'Luminous Launch India',
    'Orionis',
    'Lucia', 
    'Sirena',
    '50 Shades',
    'Stardust',
    'Stargate',
    'Midnight Gold',
    'Polaris',
    'Sirius'
  ];
  
  console.log('📋 SHARED_CAMPAIGNS list:');
  SHARED_CAMPAIGNS.forEach(campaign => console.log(`   - ${campaign}`));
  
  for (const { campaign: campaignName, range: rangeName } of problemCampaigns) {
    console.log(`\n🔍 Testing: "${campaignName}" → "${rangeName}"`);
    
    // Check if it's a shared campaign
    const isSharedCampaign = SHARED_CAMPAIGNS.some(sharedCampaign => 
      sharedCampaign.toLowerCase() === campaignName.toLowerCase()
    );
    
    console.log(`   📊 Is shared campaign: ${isSharedCampaign}`);
    
    if (isSharedCampaign) {
      console.log('   🔄 Using many-to-many validation');
      
      // Check junction table
      const junctionCheck = await prisma.rangeToCampaign.findFirst({
        where: {
          campaign: { name: campaignName },
          range: { name: rangeName }
        },
        include: {
          campaign: true,
          range: true
        }
      });
      
      console.log(`   📊 Junction table result: ${junctionCheck ? '✅ Found' : '❌ Not found'}`);
    } else {
      console.log('   🔄 Using regular validation');
      
      // Check direct range mapping
      const campaign = await prisma.campaign.findFirst({
        where: { name: campaignName },
        include: { range: true }
      });
      
      if (campaign && campaign.range) {
        console.log(`   📊 Direct range: "${campaign.range.name}"`);
        console.log(`   📊 Expected range: "${rangeName}"`);
        console.log(`   📊 Match: ${campaign.range.name === rangeName ? '✅ Yes' : '❌ No'}`);
        
        if (campaign.range.name !== rangeName) {
          console.log(`   ⚠️  VALIDATION ERROR: Campaign mapped to wrong range!`);
          console.log(`       Expected: "${rangeName}"`);
          console.log(`       Actual: "${campaign.range.name}"`);
        }
      } else {
        console.log(`   ❌ No direct range mapping found`);
      }
    }
  }
  
  console.log('\n🔧 SOLUTION NEEDED:');
  console.log('The validation errors occur because:');
  console.log('1. These campaigns are NOT in the SHARED_CAMPAIGNS list');
  console.log('2. So they use regular validation (direct range mapping)');
  console.log('3. But their direct range mapping doesn\'t match the expected range');
  console.log('4. We need to either:');
  console.log('   a) Fix the direct range mappings, OR');
  console.log('   b) Add these campaigns to SHARED_CAMPAIGNS if they appear in multiple ranges');
  
  await prisma.$disconnect();
}

debugValidationLogic();