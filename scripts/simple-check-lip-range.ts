import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLipRange() {
  console.log('🔍 CHECKING: Lip range existence\n');

  try {
    // Check if Lip range exists
    const ranges = await prisma.range.findMany({
      where: { 
        name: 'Lip',
        status: { not: 'archived' }
      }
    });
    
    console.log(`Ranges named "Lip": ${ranges.length}`);
    for (const range of ranges) {
      console.log(`- ID: ${range.id}, Name: ${range.name}, Status: ${range.status}, Category ID: ${range.category_id}`);
    }
    
    // Check if Lip category exists  
    const categories = await prisma.category.findMany({
      where: { 
        name: 'Lip'
      }
    });
    
    console.log(`\nCategories named "Lip": ${categories.length}`);
    for (const category of categories) {
      console.log(`- ID: ${category.id}, Name: ${category.name}, Business Unit ID: ${category.businessUnitId}`);
    }
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

checkLipRange().catch(console.error);