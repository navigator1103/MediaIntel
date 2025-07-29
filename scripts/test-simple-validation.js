const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCategoryValidation() {
  console.log('🧪 Testing Category Business Unit Validation');
  console.log('===========================================');

  try {
    // Test case 1: Lip category should belong to Nivea
    console.log('\n1. Testing Category "Lip" against business unit "Nivea":');
    const lipCategory = await prisma.category.findFirst({
      where: { 
        name: 'Lip',
        businessUnit: { name: 'Nivea' }
      },
      include: { businessUnit: true }
    });
    console.log('   Result:', !!lipCategory ? 'VALID ✅' : 'INVALID ❌');
    console.log('   Category found:', lipCategory?.name, '-> Business Unit:', lipCategory?.businessUnit?.name);

    // Test case 2: Aquaphor category should NOT belong to Nivea
    console.log('\n2. Testing Category "Aquaphor" against business unit "Nivea":');
    const aquaphorCategory = await prisma.category.findFirst({
      where: { 
        name: 'Aquaphor',
        businessUnit: { name: 'Nivea' }
      },
      include: { businessUnit: true }
    });
    console.log('   Result:', !!aquaphorCategory ? 'VALID ✅' : 'INVALID ❌ (Expected)');
    console.log('   Category found:', aquaphorCategory?.name || 'None');

    // Test case 3: Check what business unit Aquaphor actually belongs to
    console.log('\n3. Finding which business unit "Aquaphor" actually belongs to:');
    const aquaphorActual = await prisma.category.findFirst({
      where: { 
        name: 'Aquaphor'
      },
      include: { businessUnit: true }
    });
    console.log('   Category "Aquaphor" belongs to:', aquaphorActual?.businessUnit?.name || 'None');

    console.log('\n✅ Direct database queries completed successfully!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoryValidation();