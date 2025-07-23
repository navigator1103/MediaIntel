import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function examineCategories() {
  try {
    console.log('=== Current Categories ===');
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    console.log('Categories found:', categories.length);
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id})`);
    });

    console.log('\n=== Current Business Units ===');
    const businessUnits = await prisma.businessUnit.findMany({
      orderBy: { name: 'asc' }
    });
    console.log('Business Units found:', businessUnits.length);
    businessUnits.forEach((bu, index) => {
      console.log(`${index + 1}. ${bu.name} (ID: ${bu.id})`);
    });

  } catch (error) {
    console.error('Error examining data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

examineCategories();