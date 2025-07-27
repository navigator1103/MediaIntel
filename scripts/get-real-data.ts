import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getRealData() {
  try {
    // Get unique categories from master data
    const categories = await prisma.category.findMany({
      select: { name: true },
      take: 10
    });
    
    // Get unique ranges from master data  
    const ranges = await prisma.range.findMany({
      select: { name: true },
      take: 10
    });
    
    // Get unique campaigns from master data
    const campaigns = await prisma.campaign.findMany({
      select: { name: true },
      take: 10
    });
    
    // Get countries
    const countries = await prisma.country.findMany({
      select: { id: true, name: true },
      take: 5
    });
    
    console.log('Categories in database:');
    categories.forEach(c => console.log(`- ${c.name}`));
    
    console.log('\nRanges in database:');
    ranges.forEach(r => console.log(`- ${r.name}`));
    
    console.log('\nCampaigns in database:');
    campaigns.forEach(c => console.log(`- ${c.name}`));
    
    console.log('\nCountries in database:');
    countries.forEach(c => console.log(`- ID: ${c.id}, Name: ${c.name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getRealData();