// Script to check the relationship between MediaType and MediaSubType
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking relationship between MediaType and MediaSubType...');
  
  try {
    // Get all media types with their associated media sub types
    const mediaTypes = await prisma.mediaType.findMany({
      include: {
        mediaSubTypes: true
      }
    });
    
    // Display the results
    console.log(`\nFound ${mediaTypes.length} media types:`);
    mediaTypes.forEach(type => {
      console.log(`\n${type.name} (ID: ${type.id}):`);
      console.log(`Has ${type.mediaSubTypes.length} media sub types:`);
      type.mediaSubTypes.forEach(subType => {
        console.log(`- ${subType.name} (ID: ${subType.id})`);
      });
    });
    
  } catch (error) {
    console.error('Error checking relationship:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
