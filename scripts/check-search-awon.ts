import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSearchAWON() {
  console.log('🔍 Checking Search AWON placement...');
  
  const campaign = await prisma.campaign.findFirst({
    where: { name: 'Search AWON' }
  });
  
  if (!campaign) {
    console.log('❌ Search AWON campaign not found');
    return;
  }
  
  const relationships = await prisma.rangeToCampaign.findMany({
    where: { campaignId: campaign.id },
    include: { range: true }
  });
  
  console.log(`✅ Search AWON is now linked to ranges:`);
  relationships.forEach(rel => {
    console.log(`   - ${rel.range.name}`);
  });
  
  await prisma.$disconnect();
}

checkSearchAWON();