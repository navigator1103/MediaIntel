import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// These are actually Derma business unit categories (correction from previous mapping)
const dermaCategories = [
  'Acne',
  'Anti Pigment', 
  'Sun',
  'Anti Age',
  'Aquaphor',
  'X-Cat',
  'Atopi',
  'Body Range',
  'Hydration',
  'pH5',
  'Repair',
  'Dry Skin'
];

async function mapDermaCategories() {
  try {
    console.log('=== Correcting Category Mapping: Moving to Derma Business Unit ===');
    
    // Get Derma business unit ID
    const dermaBusinessUnit = await prisma.businessUnit.findFirst({
      where: { name: 'Derma' }
    });
    
    if (!dermaBusinessUnit) {
      console.error('Derma business unit not found!');
      return;
    }
    
    console.log(`Found Derma business unit with ID: ${dermaBusinessUnit.id}`);
    
    // Get all categories that should be mapped to Derma
    const categoriesToUpdate = await prisma.category.findMany({
      where: {
        name: {
          in: dermaCategories
        }
      }
    });
    
    console.log(`Found ${categoriesToUpdate.length} categories to map to Derma:`);
    categoriesToUpdate.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
    });
    
    if (categoriesToUpdate.length === 0) {
      console.log('No categories found to update');
      return;
    }
    
    // Update categories to link to Derma business unit
    const result = await prisma.category.updateMany({
      where: {
        name: {
          in: dermaCategories
        }
      },
      data: {
        businessUnitId: dermaBusinessUnit.id
      }
    });
    
    console.log(`✅ Successfully updated ${result.count} categories to be linked to Derma business unit`);
    
    // Verify the mapping
    console.log('\n=== Current Business Unit Mappings ===');
    
    // Show Derma categories
    const dermaMappedCategories = await prisma.category.findMany({
      where: {
        businessUnitId: dermaBusinessUnit.id
      },
      include: {
        businessUnit: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nDerma Categories (${dermaMappedCategories.length}):`);
    dermaMappedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
    });
    
    // Show Nivea categories (should be empty now)
    const niveaBusinessUnit = await prisma.businessUnit.findFirst({
      where: { name: 'Nivea' }
    });
    
    if (niveaBusinessUnit) {
      const niveaMappedCategories = await prisma.category.findMany({
        where: {
          businessUnitId: niveaBusinessUnit.id
        },
        orderBy: { name: 'asc' }
      });
      
      console.log(`\nNivea Categories (${niveaMappedCategories.length}):`);
      if (niveaMappedCategories.length === 0) {
        console.log('   (None - ready for Nivea category mapping)');
      } else {
        niveaMappedCategories.forEach((cat, index) => {
          console.log(`${index + 1}. ${cat.name}`);
        });
      }
    }
    
    // Show unmapped categories
    const unmappedCategories = await prisma.category.findMany({
      where: {
        businessUnitId: null
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nUnmapped Categories (${unmappedCategories.length}):`);
    unmappedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
    });
    
  } catch (error) {
    console.error('Error mapping categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mapDermaCategories();