import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting removal of "Media Subtype" entry from media subtypes...');
    
    // 1. Find the "Media Subtype" entry
    const mediaSubtypeEntry = await prisma.mediaSubType.findFirst({
      where: { name: 'Media Subtype' }
    });
    
    if (!mediaSubtypeEntry) {
      console.log('"Media Subtype" entry not found in the database.');
      return;
    }
    
    console.log(`Found "Media Subtype" entry with ID: ${mediaSubtypeEntry.id}`);
    
    // 2. Delete the "Media Subtype" entry
    await prisma.mediaSubType.delete({
      where: { id: mediaSubtypeEntry.id }
    });
    
    console.log(`Successfully removed "Media Subtype" entry with ID: ${mediaSubtypeEntry.id}`);
    
    // 3. Verify the deletion
    const verifyMediaSubtypeEntry = await prisma.mediaSubType.findFirst({
      where: { name: 'Media Subtype' }
    });
    
    if (!verifyMediaSubtypeEntry) {
      console.log('Verified: "Media Subtype" entry has been removed from the database.');
    } else {
      console.log('WARNING: "Media Subtype" entry still exists in the database.');
    }
    
    // 4. List remaining media subtypes
    const remainingMediaSubtypes = await prisma.mediaSubType.findMany();
    console.log(`Remaining media subtypes (${remainingMediaSubtypes.length}):`);
    remainingMediaSubtypes.forEach(subtype => {
      console.log(`- ${subtype.name} (ID: ${subtype.id})`);
    });
    
    console.log('Removal completed successfully!');
  } catch (error) {
    console.error('Error during removal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
