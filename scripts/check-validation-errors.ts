import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkValidationErrors() {
  console.log('🔍 Investigating validation errors for specific campaigns...\n');
  
  const problemCampaigns = {
    'Nivea': ['Zazil', 'Sachet', 'Deep X-Cat', 'Vitamin Scrub', 'C&E Tata'],
    'Derma': ['Dermo Purifyer', 'Brand (Institutional)', 'Eucerin brand AWON']
  };
  
  for (const [businessUnit, campaigns] of Object.entries(problemCampaigns)) {
    console.log(`\n📋 ${businessUnit} Campaign Issues:`);
    console.log('=' + '='.repeat(businessUnit.length + 17));
    
    for (const campaignName of campaigns) {
      console.log(`\n🔍 Checking: "${campaignName}"`);
      
      // Check if campaign exists
      const campaign = await prisma.campaign.findFirst({
        where: { name: campaignName }
      });
      
      if (!campaign) {
        console.log(`   ❌ Campaign "${campaignName}" not found in database`);
        
        // Check for similar names
        const allCampaigns = await prisma.campaign.findMany({
          select: { name: true }
        });
        
        const similarCampaigns = allCampaigns.filter(c => 
          c.name.toLowerCase().includes(campaignName.toLowerCase()) ||
          campaignName.toLowerCase().includes(c.name.toLowerCase())
        );
        
        if (similarCampaigns.length > 0) {
          console.log(`   💡 Similar campaigns found:`);
          similarCampaigns.forEach(c => console.log(`      - "${c.name}"`));
        }
        continue;
      }
      
      console.log(`   ✅ Campaign found: ID ${campaign.id}`);
      
      // Check junction table mappings
      const junctionMappings = await prisma.rangeToCampaign.findMany({
        where: { campaignId: campaign.id },
        include: { range: true }
      });
      
      if (junctionMappings.length === 0) {
        console.log(`   ❌ No junction table mappings found`);
      } else {
        console.log(`   📊 Junction mappings (${junctionMappings.length}):`);
        junctionMappings.forEach(mapping => {
          console.log(`      - Range: "${mapping.range.name}" (ID: ${mapping.range.id})`);
        });
      }
      
      // Check direct range mapping (old method)
      if (campaign.rangeId) {
        const directRange = await prisma.range.findUnique({
          where: { id: campaign.rangeId }
        });
        console.log(`   📌 Direct range mapping: "${directRange?.name}" (ID: ${campaign.rangeId})`);
      } else {
        console.log(`   ⚠️  No direct range mapping`);
      }
    }
  }
  
  console.log('\n🔍 Checking template data for comparison...\n');
  
  // Check what the templates actually contain
  console.log('📋 Template verification needed:');
  console.log('1. Check if these campaigns exist in the CSV templates');
  console.log('2. Verify the exact spelling and formatting');
  console.log('3. Confirm which ranges they should be mapped to');
  
  await prisma.$disconnect();
}

checkValidationErrors();