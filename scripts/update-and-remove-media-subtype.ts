import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting update and removal of "Media Subtype" entry...');
    
    // 1. Find the "Media Subtype" entry
    const mediaSubtypeEntry = await prisma.mediaSubType.findFirst({
      where: { name: 'Media Subtype' }
    });
    
    if (!mediaSubtypeEntry) {
      console.log('"Media Subtype" entry not found in the database.');
      return;
    }
    
    console.log(`Found "Media Subtype" entry with ID: ${mediaSubtypeEntry.id}`);
    
    // 2. Find a suitable replacement media subtype (e.g., first one that's not "Media Subtype")
    const replacementSubtype = await prisma.mediaSubType.findFirst({
      where: {
        id: { not: mediaSubtypeEntry.id }
      }
    });
    
    if (!replacementSubtype) {
      console.log('No suitable replacement media subtype found. Cannot proceed.');
      return;
    }
    
    console.log(`Found replacement media subtype: ${replacementSubtype.name} (ID: ${replacementSubtype.id})`);
    
    // 3. Update the GamePlan record to use the replacement media subtype
    const updatedGamePlans = await prisma.gamePlan.updateMany({
      where: { mediaSubTypeId: mediaSubtypeEntry.id },
      data: { mediaSubTypeId: replacementSubtype.id }
    });
    
    console.log(`Updated ${updatedGamePlans.count} GamePlan records to use the replacement media subtype.`);
    
    // 4. Verify no more references exist
    const gamePlanReferences = await prisma.gamePlan.findMany({
      where: { mediaSubTypeId: mediaSubtypeEntry.id }
    });
    
    if (gamePlanReferences.length > 0) {
      console.log(`WARNING: Still found ${gamePlanReferences.length} GamePlan references. Cannot proceed with deletion.`);
      return;
    }
    
    // 5. Now we can safely delete the "Media Subtype" entry
    await prisma.mediaSubType.delete({
      where: { id: mediaSubtypeEntry.id }
    });
    
    console.log(`Successfully removed "Media Subtype" entry with ID: ${mediaSubtypeEntry.id}`);
    
    // 6. Verify the deletion
    const verifyMediaSubtypeEntry = await prisma.mediaSubType.findFirst({
      where: { name: 'Media Subtype' }
    });
    
    if (!verifyMediaSubtypeEntry) {
      console.log('Verified: "Media Subtype" entry has been removed from the database.');
    } else {
      console.log('WARNING: "Media Subtype" entry still exists in the database.');
    }
    
    // 7. List remaining media subtypes
    const remainingMediaSubtypes = await prisma.mediaSubType.findMany();
    console.log(`Remaining media subtypes (${remainingMediaSubtypes.length}):`);
    remainingMediaSubtypes.forEach(subtype => {
      console.log(`- ${subtype.name} (ID: ${subtype.id})`);
    });
    
    console.log('Update and removal completed successfully!');
  } catch (error) {
    console.error('Error during update and removal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
