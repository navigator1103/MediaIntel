import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLipRangeCategoryLink() {
  console.log('🔧 FIXING: Lip range category link\n');

  try {
    // Update the Lip range to link to Lip category
    const result = await prisma.range.update({
      where: { id: 12 }, // Lip range ID
      data: { category_id: 5 } // Lip category ID
    });
    
    console.log(`✅ Updated Lip range (ID: ${result.id}) to link to category ID: ${result.category_id}`);
    
    // Verify the fix
    const updatedRange = await prisma.range.findUnique({
      where: { id: 12 }
    });
    
    console.log(`\n🔍 Verification:`);
    console.log(`   Range: ${updatedRange?.name}`);
    console.log(`   Category ID: ${updatedRange?.category_id}`);
    console.log(`   Status: ${updatedRange?.status}`);
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

fixLipRangeCategoryLink().catch(console.error);