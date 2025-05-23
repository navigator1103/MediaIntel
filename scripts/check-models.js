// Script to check if all models are properly recognized by Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking all models in the database...');
  
  try {
    // Check MediaType
    console.log('\nChecking MediaType:');
    const mediaTypes = await prisma.mediaType.findMany();
    console.log(`Found ${mediaTypes.length} media types:`);
    mediaTypes.forEach(type => console.log(`- ${type.name}`));
    
    // Check Campaign
    console.log('\nChecking Campaign:');
    const campaigns = await prisma.campaign.findMany();
    console.log(`Found ${campaigns.length} campaigns (showing first 5):`);
    campaigns.slice(0, 5).forEach(campaign => console.log(`- ${campaign.name}`));
    
    // Check other models
    console.log('\nChecking other models:');
    const subRegions = await prisma.subRegion.findMany();
    console.log(`Found ${subRegions.length} sub regions`);
    
    const clusters = await prisma.cluster.findMany();
    console.log(`Found ${clusters.length} clusters`);
    
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} categories`);
    
    const ranges = await prisma.range.findMany();
    console.log(`Found ${ranges.length} ranges`);
    
    const lastUpdates = await prisma.lastUpdate.findMany();
    console.log(`Found ${lastUpdates.length} last updates`);
    
    const pmTypes = await prisma.pMType.findMany();
    console.log(`Found ${pmTypes.length} PM types`);
    
    const mediaSubTypes = await prisma.mediaSubType.findMany();
    console.log(`Found ${mediaSubTypes.length} media sub types`);
  } catch (error) {
    console.error('Error checking models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
