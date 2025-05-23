import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBrands() {
  try {
    console.log('Checking and updating brand names in the database...');

    // First, check if the target brand names already exist
    const niveaBrand = await prisma.brand.findUnique({ where: { name: 'Nivea' } });
    const eucerinBrand = await prisma.brand.findUnique({ where: { name: 'Eucerin' } });
    const labelloBrand = await prisma.brand.findUnique({ where: { name: 'Labello' } });

    // Check if Brand A, B, C exist
    const brandA = await prisma.brand.findUnique({ where: { name: 'Brand A' } });
    const brandB = await prisma.brand.findUnique({ where: { name: 'Brand B' } });
    const brandC = await prisma.brand.findUnique({ where: { name: 'Brand C' } });

    // If Brand A exists and Nivea doesn't, update it
    if (brandA && !niveaBrand) {
      await prisma.brand.update({
        where: { id: brandA.id },
        data: { name: 'Nivea' },
      });
      console.log('Updated Brand A to Nivea');
    } else if (brandA && niveaBrand) {
      // If both exist, we need to update all references and then delete Brand A
      console.log('Both Brand A and Nivea exist. Updating references...');
      
      // Update all references from Brand A to Nivea
      await prisma.fiveStarsRating.updateMany({
        where: { brandId: brandA.id },
        data: { brandId: niveaBrand.id },
      });
      
      await prisma.score.updateMany({
        where: { brandId: brandA.id },
        data: { brandId: niveaBrand.id },
      });
      
      // Delete Brand A
      await prisma.brand.delete({
        where: { id: brandA.id },
      });
      
      console.log('Migrated all Brand A references to Nivea and deleted Brand A');
    }

    // Same process for Brand B/Eucerin
    if (brandB && !eucerinBrand) {
      await prisma.brand.update({
        where: { id: brandB.id },
        data: { name: 'Eucerin' },
      });
      console.log('Updated Brand B to Eucerin');
    } else if (brandB && eucerinBrand) {
      console.log('Both Brand B and Eucerin exist. Updating references...');
      
      await prisma.fiveStarsRating.updateMany({
        where: { brandId: brandB.id },
        data: { brandId: eucerinBrand.id },
      });
      
      await prisma.score.updateMany({
        where: { brandId: brandB.id },
        data: { brandId: eucerinBrand.id },
      });
      
      await prisma.brand.delete({
        where: { id: brandB.id },
      });
      
      console.log('Migrated all Brand B references to Eucerin and deleted Brand B');
    }

    // Same process for Brand C/Labello
    if (brandC && !labelloBrand) {
      await prisma.brand.update({
        where: { id: brandC.id },
        data: { name: 'Labello' },
      });
      console.log('Updated Brand C to Labello');
    } else if (brandC && labelloBrand) {
      console.log('Both Brand C and Labello exist. Updating references...');
      
      await prisma.fiveStarsRating.updateMany({
        where: { brandId: brandC.id },
        data: { brandId: labelloBrand.id },
      });
      
      await prisma.score.updateMany({
        where: { brandId: brandC.id },
        data: { brandId: labelloBrand.id },
      });
      
      await prisma.brand.delete({
        where: { id: brandC.id },
      });
      
      console.log('Migrated all Brand C references to Labello and deleted Brand C');
    }

    console.log('Brand names update process completed');
  } catch (error) {
    console.error('Error updating brand names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBrands();
