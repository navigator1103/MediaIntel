import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinessUnit() {
  try {
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: 1 }
    });
    
    console.log('Business Unit ID 1:', businessUnit);
    
    // Also check categories and their business units
    const categories = await prisma.category.findMany({
      where: {
        name: {
          in: ['Lip', 'Hand Body', 'Face Cleansing', 'Aquaphor']
        }
      },
      include: {
        businessUnit: true
      }
    });
    
    console.log('\nCategories from CSV:');
    categories.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.businessUnit?.name || 'NO BUSINESS UNIT'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessUnit();