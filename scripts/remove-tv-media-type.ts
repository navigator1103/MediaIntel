import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting removal of TV media type...');
    
    // 1. Find the TV media type ID
    const tvMediaType = await prisma.mediaType.findFirst({
      where: { name: 'TV' }
    });
    
    if (!tvMediaType) {
      console.log('TV media type not found in the database.');
      return;
    }
    
    console.log(`Found TV media type with ID: ${tvMediaType.id}`);
    
    // 2. Double check that no media subtypes are associated with TV
    const tvSubtypes = await prisma.mediaSubType.findMany({
      where: { mediaTypeId: tvMediaType.id }
    });
    
    if (tvSubtypes.length > 0) {
      console.log(`WARNING: Found ${tvSubtypes.length} media subtypes still associated with TV. Please migrate these first.`);
      tvSubtypes.forEach(subtype => {
        console.log(`- ${subtype.name} (ID: ${subtype.id})`);
      });
      return;
    }
    
    // 3. Delete the TV media type
    await prisma.mediaType.delete({
      where: { id: tvMediaType.id }
    });
    
    console.log(`Successfully removed TV media type with ID: ${tvMediaType.id}`);
    
    // 4. Verify the deletion
    const verifyTvMediaType = await prisma.mediaType.findFirst({
      where: { name: 'TV' }
    });
    
    if (!verifyTvMediaType) {
      console.log('Verified: TV media type has been removed from the database.');
    } else {
      console.log('WARNING: TV media type still exists in the database.');
    }
    
    // 5. List remaining media types
    const remainingMediaTypes = await prisma.mediaType.findMany();
    console.log(`Remaining media types (${remainingMediaTypes.length}):`);
    remainingMediaTypes.forEach(mediaType => {
      console.log(`- ${mediaType.name} (ID: ${mediaType.id})`);
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
