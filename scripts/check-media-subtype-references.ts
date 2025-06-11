import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking references to "Media Subtype" entry...');
    
    // 1. Find the "Media Subtype" entry
    const mediaSubtypeEntry = await prisma.mediaSubType.findFirst({
      where: { name: 'Media Subtype' }
    });
    
    if (!mediaSubtypeEntry) {
      console.log('"Media Subtype" entry not found in the database.');
      return;
    }
    
    console.log(`Found "Media Subtype" entry with ID: ${mediaSubtypeEntry.id}`);
    
    // 2. Check for references in PMTypeToMediaSubType
    const pmTypeReferences = await prisma.pMTypeToMediaSubType.findMany({
      where: { mediaSubTypeId: mediaSubtypeEntry.id }
    });
    
    console.log(`Found ${pmTypeReferences.length} references in PMTypeToMediaSubType table.`);
    
    // 3. Check for references in GamePlan
    const gamePlanReferences = await prisma.gamePlan.findMany({
      where: { mediaSubTypeId: mediaSubtypeEntry.id }
    });
    
    console.log(`Found ${gamePlanReferences.length} references in GamePlan table.`);
    
    // 4. Print detailed information about the references
    if (pmTypeReferences.length > 0) {
      console.log('\nPMTypeToMediaSubType references:');
      for (const ref of pmTypeReferences) {
        console.log(`- PMTypeId: ${ref.pmTypeId}, MediaSubTypeId: ${ref.mediaSubTypeId}`);
      }
    }
    
    if (gamePlanReferences.length > 0) {
      console.log('\nGamePlan references:');
      for (const ref of gamePlanReferences) {
        console.log(`- ID: ${ref.id}`);
      }
    }
    
  } catch (error) {
    console.error('Error during check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
