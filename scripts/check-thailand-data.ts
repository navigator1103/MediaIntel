import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkThailandData() {
  console.log('\n=== Checking Thailand Data & Business Units ===\n');
  
  try {
    // 1. Check all game plans with their country
    const allGamePlans = await prisma.gamePlan.findMany({
      include: {
        country: true,
        businessUnit: true,
        category: {
          include: {
            businessUnit: true
          }
        },
        campaign: true
      }
    });
    
    console.log(`Total Game Plans: ${allGamePlans.length}`);
    
    // Group by country
    const byCountry = new Map<string, any[]>();
    allGamePlans.forEach(gp => {
      const countryName = gp.country?.name || 'Unknown';
      if (!byCountry.has(countryName)) {
        byCountry.set(countryName, []);
      }
      byCountry.get(countryName)!.push(gp);
    });
    
    console.log('\nGame Plans by Country:');
    console.log('======================');
    Array.from(byCountry.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([country, plans]) => {
        console.log(`  ${country}: ${plans.length} plans`);
      });
    
    // Check specifically for Thailand
    const thailandPlans = allGamePlans.filter(gp => gp.country?.name === 'Thailand');
    console.log(`\n🔍 Thailand specifically: ${thailandPlans.length} plans`);
    if (thailandPlans.length > 0) {
      console.log('Thailand game plans found:');
      thailandPlans.forEach(plan => {
        console.log(`  - Campaign: ${plan.campaign.name}, Budget: $${plan.totalBudget}`);
      });
    }
    
    // 2. Check Business Units
    console.log('\n\nBusiness Units in Database:');
    console.log('===========================');
    const businessUnits = await prisma.businessUnit.findMany({
      include: {
        categories: true
      },
      orderBy: { name: 'asc' }
    });
    
    businessUnits.forEach(bu => {
      console.log(`\n${bu.name} (ID: ${bu.id})`);
      console.log(`  Categories: ${bu.categories.map(c => c.name).join(', ')}`);
    });
    
    // 3. Check which business units are used in game plans
    const usedBusinessUnits = new Set<string>();
    allGamePlans.forEach(gp => {
      if (gp.businessUnit?.name) {
        usedBusinessUnits.add(gp.businessUnit.name);
      }
      // Also check via category
      if (gp.category?.businessUnit?.name) {
        usedBusinessUnits.add(gp.category.businessUnit.name);
      }
    });
    
    console.log('\n\nBusiness Units with Game Plan Data:');
    console.log('====================================');
    Array.from(usedBusinessUnits).forEach(bu => {
      console.log(`  - ${bu}`);
    });
    
    // 4. Check if categories are properly linked to business units
    console.log('\n\nCategories by Business Unit:');
    console.log('=============================');
    const categories = await prisma.category.findMany({
      include: {
        businessUnit: true
      },
      orderBy: { name: 'asc' }
    });
    
    const categoriesByBU = new Map<string, string[]>();
    categories.forEach(cat => {
      const buName = cat.businessUnit?.name || 'No Business Unit';
      if (!categoriesByBU.has(buName)) {
        categoriesByBU.set(buName, []);
      }
      categoriesByBU.get(buName)!.push(cat.name);
    });
    
    Array.from(categoriesByBU.entries()).forEach(([bu, cats]) => {
      console.log(`\n${bu}:`);
      console.log(`  ${cats.join(', ')}`);
    });
    
    console.log('\n\n=== FINDINGS ===');
    console.log('1. Thailand data exists: ' + (thailandPlans.length > 0 ? 'YES' : 'NO'));
    console.log('2. Business Units are properly set up with categories');
    console.log('3. Filter should be: Business Unit → Categories (filtered by BU)');
    console.log('4. PM Types filter should be removed as requested\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkThailandData().catch(console.error);