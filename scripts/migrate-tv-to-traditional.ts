import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting migration of TV media subtypes to Traditional...');
    
    // 1. Find the TV and Traditional media type IDs
    const tvMediaType = await prisma.mediaType.findFirst({
      where: { name: 'TV' }
    });
    
    const traditionalMediaType = await prisma.mediaType.findFirst({
      where: { name: 'Traditional' }
    });
    
    if (!tvMediaType) {
      console.log('TV media type not found in the database.');
      return;
    }
    
    if (!traditionalMediaType) {
      console.log('Traditional media type not found in the database.');
      return;
    }
    
    console.log(`Found TV media type with ID: ${tvMediaType.id}`);
    console.log(`Found Traditional media type with ID: ${traditionalMediaType.id}`);
    
    // 2. Find all media subtypes associated with TV
    const tvSubtypes = await prisma.mediaSubType.findMany({
      where: { mediaTypeId: tvMediaType.id }
    });
    
    console.log(`Found ${tvSubtypes.length} media subtypes associated with TV:`);
    tvSubtypes.forEach(subtype => {
      console.log(`- ${subtype.name} (ID: ${subtype.id})`);
    });
    
    // 3. Update each TV subtype to be associated with Traditional
    const updatePromises = tvSubtypes.map(subtype => 
      prisma.mediaSubType.update({
        where: { id: subtype.id },
        data: { mediaTypeId: traditionalMediaType.id }
      })
    );
    
    const updatedSubtypes = await Promise.all(updatePromises);
    console.log(`Successfully moved ${updatedSubtypes.length} subtypes from TV to Traditional.`);
    
    // 4. Verify the update
    const verifyTraditionalSubtypes = await prisma.mediaSubType.findMany({
      where: { mediaTypeId: traditionalMediaType.id }
    });
    
    console.log(`Traditional media type now has ${verifyTraditionalSubtypes.length} subtypes:`);
    verifyTraditionalSubtypes.forEach(subtype => {
      console.log(`- ${subtype.name} (ID: ${subtype.id})`);
    });
    
    // 5. Verify TV has no subtypes left
    const verifyTvSubtypes = await prisma.mediaSubType.findMany({
      where: { mediaTypeId: tvMediaType.id }
    });
    
    console.log(`TV media type now has ${verifyTvSubtypes.length} subtypes.`);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
