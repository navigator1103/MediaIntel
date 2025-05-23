// Script to replace existing brands (A, B, C) with Nivea and Eucerin
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get all brands
    const brands = await prisma.brand.findMany();
    console.log('Current brands in database:');
    console.table(brands);
    
    // Check if we already have the correct brands
    const hasNivea = brands.some(brand => brand.name === 'Nivea');
    const hasEucerin = brands.some(brand => brand.name === 'Eucerin');
    
    if (hasNivea && hasEucerin && brands.length === 2) {
      console.log('Database already has the correct brands (Nivea and Eucerin).');
    } else {
      console.log('Updating existing brands to Nivea and Eucerin...');
      
      // Instead of deleting brands, we'll update the existing ones
      if (brands.length >= 1) {
        // Update first brand to Nivea
        console.log(`Updating brand ${brands[0].name} (ID: ${brands[0].id}) to Nivea`);
        await prisma.brand.update({
          where: { id: brands[0].id },
          data: { name: 'Nivea' }
        });
      }
      
      if (brands.length >= 2) {
        // Update second brand to Eucerin
        console.log(`Updating brand ${brands[1].name} (ID: ${brands[1].id}) to Eucerin`);
        await prisma.brand.update({
          where: { id: brands[1].id },
          data: { name: 'Eucerin' }
        });
      }
      
      // If we have more than 2 brands, we need to handle them
      if (brands.length > 2) {
        // First, reassign all scores from the extra brands to either Nivea or Eucerin
        for (let i = 2; i < brands.length; i++) {
          const brandToRemove = brands[i];
          const targetBrandId = i % 2 === 0 ? brands[0].id : brands[1].id;
          const targetBrandName = i % 2 === 0 ? 'Nivea' : 'Eucerin';
          
          console.log(`Reassigning scores from ${brandToRemove.name} (ID: ${brandToRemove.id}) to ${targetBrandName} (ID: ${targetBrandId})`);
          
          // Update all scores for this brand to point to either Nivea or Eucerin
          await prisma.score.updateMany({
            where: { brandId: brandToRemove.id },
            data: { brandId: targetBrandId }
          });
          
          // Now we can safely delete this brand
          console.log(`Deleting brand ${brandToRemove.name} (ID: ${brandToRemove.id})`);
          await prisma.brand.delete({
            where: { id: brandToRemove.id }
          });
        }
      }
      
      // If we have fewer than 2 brands, create the missing ones
      if (brands.length === 0) {
        console.log('No brands found. Creating Nivea and Eucerin...');
        await prisma.brand.createMany({
          data: [
            { name: 'Nivea' },
            { name: 'Eucerin' }
          ]
        });
      } else if (brands.length === 1) {
        console.log('Only one brand found. Creating Eucerin...');
        await prisma.brand.create({
          data: { name: 'Eucerin' }
        });
      }
      
      // Get updated brands
      const updatedBrands = await prisma.brand.findMany();
      console.log('Updated brands:');
      console.table(updatedBrands);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
