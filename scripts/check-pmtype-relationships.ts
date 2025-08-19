import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPMTypeRelationships() {
  console.log('🔍 Checking PMType relationships blocking Display deletion...\n');
  
  const displaySubType = await prisma.mediaSubType.findFirst({
    where: { name: 'Display' }
  });
  
  if (!displaySubType) {
    console.log('❌ Display sub-type not found');
    return;
  }
  
  console.log(`✅ Display sub-type found (ID: ${displaySubType.id})`);
  
  // Check PMTypeToMediaSubType relationships
  const pmTypeRelations = await prisma.pMTypeToMediaSubType.findMany({
    where: { mediaSubTypeId: displaySubType.id },
    include: { pmType: true }
  });
  
  console.log(`📊 PMType relationships: ${pmTypeRelations.length}`);
  
  if (pmTypeRelations.length > 0) {
    console.log('\n🔗 PMType relationships found:');
    pmTypeRelations.forEach(relation => {
      console.log(`   - PMType: ${relation.pmType?.name || 'Unknown'} (ID: ${relation.pmTypeId})`);
      console.log(`     PMType ID: ${relation.pmTypeId}, MediaSubType ID: ${relation.mediaSubTypeId}`);
    });
    
    console.log('\n❌ Cannot delete Display: Referenced in PMTypeToMediaSubType table');
    console.log('💡 Solutions:');
    console.log('   1. Delete PMType relationships first');
    console.log('   2. Reassign PMTypes to different media sub-types');
    
    // Show which PMTypes would be affected
    console.log('\n📋 Affected PMTypes:');
    const uniquePMTypes = [...new Set(pmTypeRelations.map(r => r.pmType?.name).filter(Boolean))];
    uniquePMTypes.forEach(pmTypeName => {
      console.log(`   - ${pmTypeName}`);
    });
    
  } else {
    console.log('✅ Safe to delete: No PMType relationships found');
  }
  
  // Also check for any other foreign key relationships
  console.log('\n🔍 Checking other potential foreign key relationships...');
  
  // Check game plans (already checked, but let's confirm)
  const gamePlansCount = await prisma.gamePlan.count({
    where: { mediaSubTypeId: displaySubType.id }
  });
  console.log(`📊 Game plans using Display: ${gamePlansCount}`);
  
  await prisma.$disconnect();
}

checkPMTypeRelationships();