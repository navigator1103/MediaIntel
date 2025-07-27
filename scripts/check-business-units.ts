import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinessUnits() {
  try {
    console.log('Checking business units in database...\n');
    
    const businessUnits = await prisma.businessUnit.findMany();
    console.log('Business Units in database:');
    businessUnits.forEach((bu, i) => {
      console.log(`  ${i + 1}. ID: ${bu.id}, Name: '${bu.name}'`);
    });
    console.log(`\nTotal: ${businessUnits.length} business units`);
    
    if (businessUnits.length === 0) {
      console.log('\n⚠️ No business units found in database. Adding default ones...');
      
      // Add default business units
      const defaultBUs = ['Nivea', 'Derma'];
      
      for (const buName of defaultBUs) {
        await prisma.businessUnit.create({
          data: {
            name: buName
          }
        });
        console.log(`✅ Added business unit: ${buName}`);
      }
      
      console.log('\n✅ Default business units added successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessUnits();