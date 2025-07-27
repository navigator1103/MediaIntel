import { prisma } from '../src/lib/prisma';

async function debugBusinessUnitFilter() {
  console.log('🔍 Debugging Business Unit Filter Issues\n');
  
  // Get some sample game plans with business unit data
  const gamePlans = await prisma.gamePlan.findMany({
    take: 10,
    include: {
      campaign: {
        include: {
          range: true
        }
      },
      category: {
        include: {
          businessUnit: true
        }
      }
    },
    orderBy: {
      id: 'desc'
    }
  });
  
  console.log('📊 Sample Game Plans with Business Unit Data:');
  gamePlans.forEach((plan, i) => {
    console.log(`${i + 1}. Game Plan ID: ${plan.id}`);
    console.log(`   Category: ${plan.category?.name || 'N/A'}`);
    console.log(`   Business Unit: ${plan.category?.businessUnit?.name || 'N/A'}`);
    console.log(`   Campaign: ${plan.campaign?.name || 'N/A'}`);
    console.log('');
  });
  
  // Check for any inconsistent business unit data
  console.log('🔍 Checking for business unit inconsistencies:');
  
  const categories = await prisma.category.findMany({
    include: { businessUnit: true }
  });
  
  categories.forEach(category => {
    console.log(`Category "${category.name}": Business Unit: ${category.businessUnit?.name || 'NONE'}`);
  });
  
  // Check if there are any game plans with Nivea business unit that might show up in Derma filter
  console.log('\n🔍 Checking for potential filter leakage:');
  
  const dermaCategories = await prisma.category.findMany({
    where: {
      businessUnit: {
        name: 'Derma'
      }
    }
  });
  
  const niveaCategories = await prisma.category.findMany({
    where: {
      businessUnit: {
        name: 'Nivea'
      }
    }
  });
  
  console.log(`Derma categories: ${dermaCategories.map(c => c.name).join(', ')}`);
  console.log(`Nivea categories: ${niveaCategories.map(c => c.name).join(', ')}`);
  
  await prisma.$disconnect();
}

debugBusinessUnitFilter().catch(console.error);