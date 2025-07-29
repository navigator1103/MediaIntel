import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGamePlans() {
  try {
    // Get Singapore country ID
    const singapore = await prisma.country.findFirst({
      where: { name: { contains: 'Singapore' } }
    });
    
    if (!singapore) {
      console.log('Singapore not found in database');
      return;
    }
    
    // Get Nivea business unit ID  
    const nivea = await prisma.businessUnit.findFirst({
      where: { name: { contains: 'Nivea' } }
    });
    
    if (!nivea) {
      console.log('Nivea business unit not found');
      return;
    }
    
    console.log('Singapore ID:', singapore.id, 'Nivea BU ID:', nivea.id);
    
    // Get game plans for Singapore + Nivea
    const gamePlans = await prisma.gamePlan.findMany({
      where: {
        countryId: singapore.id,
        business_unit_id: nivea.id
      },
      include: {
        category: true,
        campaign: {
          include: { range: true }
        }
      }
    });
    
    console.log('Total game plans found:', gamePlans.length);
    
    // Extract unique categories, ranges, campaigns
    const categories = new Set<string>();
    const ranges = new Set<string>();  
    const campaigns = new Set<string>();
    
    gamePlans.forEach(plan => {
      if (plan.category?.name) categories.add(plan.category.name);
      if (plan.campaign?.range?.name) ranges.add(plan.campaign.range.name);
      if (plan.campaign?.name) campaigns.add(plan.campaign.name);
    });
    
    console.log('\nCategories in Singapore+Nivea game plans:');
    Array.from(categories).sort().forEach(cat => console.log('  -', cat));
    
    console.log('\nRanges in Singapore+Nivea game plans:');
    Array.from(ranges).sort().forEach(range => console.log('  -', range));
    
    console.log('\nCampaigns in Singapore+Nivea game plans:');
    Array.from(campaigns).sort().forEach(camp => console.log('  -', camp));
    
    // Check specific items from the CSV
    const csvItems = [
      { type: 'Category', name: 'Deo' },
      { type: 'Category', name: 'Face Cleansing' },
      { type: 'Category', name: 'Hand Body' },
      { type: 'Category', name: 'Face Care' },
      { type: 'Category', name: 'Sun' },
      { type: 'Category', name: 'Acne' },
      { type: 'Range', name: 'Black & White' },
      { type: 'Range', name: 'Hijab' },
      { type: 'Range', name: 'Cool Kick' },
      { type: 'Range', name: 'Q10' },
      { type: 'Campaign', name: 'Black & White' },
      { type: 'Campaign', name: 'Hijab Fresh' },
      { type: 'Campaign', name: 'Cool Kick' }
    ];
    
    console.log('\nChecking CSV items against game plans:');
    csvItems.forEach(item => {
      let exists = false;
      if (item.type === 'Category') exists = categories.has(item.name);
      else if (item.type === 'Range') exists = ranges.has(item.name);
      else if (item.type === 'Campaign') exists = campaigns.has(item.name);
      
      console.log(`  ${item.type} "${item.name}": ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGamePlans();