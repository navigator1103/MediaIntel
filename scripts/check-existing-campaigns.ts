import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExistingCampaigns() {
  console.log('🔍 Checking existing campaigns in database...\n');
  
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: { not: 'archived' }
    },
    select: {
      id: true,
      name: true,
      status: true
    },
    orderBy: {
      name: 'asc'
    }
  });
  
  console.log(`Found ${campaigns.length} active campaigns:\n`);
  
  campaigns.forEach((campaign, i) => {
    console.log(`${i + 1}. "${campaign.name}" (ID: ${campaign.id}, Status: ${campaign.status})`);
  });
  
  // Test campaigns from your validation
  const testCampaigns = [
    'Elasticity Motown',
    'Epigenetics (Epi 2.0)', 
    'Hello',
    'Icecream',
    'Booster Serum',
    'Black & White',
    'Hijab',
    'Extra Bright',
    'Derma Skin Clear'
  ];
  
  console.log('\n🧪 Testing campaign existence:');
  
  for (const testCampaign of testCampaigns) {
    const exists = campaigns.find(c => c.name.toLowerCase() === testCampaign.toLowerCase());
    console.log(`  "${testCampaign}": ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  }
  
  await prisma.$disconnect();
}

checkExistingCampaigns().catch(console.error);