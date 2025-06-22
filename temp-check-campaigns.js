const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking campaigns and range-campaign mapping...');
  
  // Get all campaigns
  const campaigns = await prisma.campaign.findMany({
    include: {
      range: true,
      gamePlans: true
    }
  });
  
  console.log('\n=== CAMPAIGNS ===');
  campaigns.forEach(campaign => {
    console.log(`ID: ${campaign.id}, Name: ${campaign.name}, Range ID: ${campaign.rangeId || 'NULL'}`);
    if (campaign.range) {
      console.log(`  Range: ${campaign.range.name}`);
    }
    console.log(`  Game Plans Count: ${campaign.gamePlans.length}`);
    console.log('---');
  });
  
  // Get all ranges with their campaigns
  const ranges = await prisma.range.findMany({
    include: {
      campaigns: true,
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  console.log('\n=== RANGES WITH CAMPAIGNS ===');
  ranges.forEach(range => {
    console.log(`ID: ${range.id}, Name: ${range.name}`);
    console.log(`  Categories: ${range.categories.map(c => c.category.name).join(', ') || 'None'}`);
    console.log(`  Campaigns (${range.campaigns.length}):`);
    range.campaigns.forEach(campaign => {
      console.log(`    - ID: ${campaign.id}, Name: ${campaign.name}`);
    });
    console.log('---');
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
