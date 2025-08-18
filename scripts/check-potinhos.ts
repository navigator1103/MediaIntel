import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPotinhos() {
  console.log('🔍 Checking Potinhos placement...');
  
  const campaign = await prisma.campaign.findFirst({
    where: { name: 'Potinhos' }
  });
  
  if (!campaign) {
    console.log('❌ Potinhos campaign not found');
    return;
  }
  
  const relationships = await prisma.rangeToCampaign.findMany({
    where: { campaignId: campaign.id },
    include: { range: true }
  });
  
  console.log(`✅ Potinhos is now linked to ranges:`);
  relationships.forEach(rel => {
    console.log(`   - ${rel.range.name}`);
  });
  
  await prisma.$disconnect();
}

checkPotinhos();