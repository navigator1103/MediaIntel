import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('Mapping "Middle East" country to AME sub-region...');
  
  try {
    // Create a new Prisma client instance
    const prisma = new PrismaClient();
    
    // Find the Middle East country
    const middleEast = await prisma.country.findFirst({
      where: {
        name: 'Middle East'
      }
    });
    
    if (!middleEast) {
      console.error('Error: "Middle East" country not found in the database.');
      return;
    }
    
    console.log(`Found "Middle East" country with ID: ${middleEast.id}`);
    
    // Find the AME sub-region
    const ameSubRegion = await prisma.subRegion.findFirst({
      where: {
        name: 'AME'
      }
    });
    
    if (!ameSubRegion) {
      console.error('Error: "AME" sub-region not found in the database.');
      return;
    }
    
    console.log(`Found "AME" sub-region with ID: ${ameSubRegion.id}`);
    
    // Update the Middle East country to associate it with the AME sub-region
    const updatedCountry = await prisma.country.update({
      where: {
        id: middleEast.id
      },
      data: {
        subRegionId: ameSubRegion.id
      }
    });
    
    console.log(`Successfully mapped "Middle East" country to "AME" sub-region.`);
    console.log(`Updated country: ${JSON.stringify(updatedCountry, null, 2)}`);
    
    // Verify the mapping
    const verifyCountry = await prisma.country.findUnique({
      where: {
        id: middleEast.id
      },
      include: {
        subRegion: true
      }
    });
    
    if (verifyCountry?.subRegion?.name === 'AME') {
      console.log(`Verification successful: "Middle East" is now mapped to "${verifyCountry.subRegion.name}" sub-region.`);
    } else {
      console.log(`Verification failed: "Middle East" mapping could not be verified.`);
    }
    
    // Disconnect the client
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error mapping "Middle East" to AME:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
