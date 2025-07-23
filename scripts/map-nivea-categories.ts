import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nivea business unit categories based on the provided mapping
const niveaCategories = [
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

async function mapNiveaCategories() {
  try {
    console.log('=== Mapping Nivea Categories to Business Unit ===');
    
    // Get Nivea business unit ID
    const niveaBusinessUnit = await prisma.businessUnit.findFirst({
      where: { name: 'Nivea' }
    });
    
    if (!niveaBusinessUnit) {
      console.error('Nivea business unit not found!');
      return;
    }
    
    console.log(`Found Nivea business unit with ID: ${niveaBusinessUnit.id}`);
    
    // Get all categories that should be mapped to Nivea
    const categoriesToUpdate = await prisma.category.findMany({
      where: {
        name: {
          in: niveaCategories
        }
      }
    });
    
    console.log(`Found ${categoriesToUpdate.length} categories to map to Nivea:`);
    categoriesToUpdate.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id})`);
    });
    
    if (categoriesToUpdate.length === 0) {
      console.log('No categories found to update');
      return;
    }
    
    // Update categories to link to Nivea business unit
    const result = await prisma.category.updateMany({
      where: {
        name: {
          in: niveaCategories
        }
      },
      data: {
        businessUnitId: niveaBusinessUnit.id
      }
    });
    
    console.log(`✅ Successfully updated ${result.count} categories to be linked to Nivea business unit`);
    
    // Verify the mapping
    console.log('\n=== Verification ===');
    const mappedCategories = await prisma.category.findMany({
      where: {
        businessUnitId: niveaBusinessUnit.id
      },
      include: {
        businessUnit: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Categories now mapped to Nivea (${mappedCategories.length}):`);
    mappedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} -> ${cat.businessUnit?.name}`);
    });
    
    // Show categories not mapped to any business unit
    const unmappedCategories = await prisma.category.findMany({
      where: {
        businessUnitId: null
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nCategories not mapped to any business unit (${unmappedCategories.length}):`);
    unmappedCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name}`);
    });
    
  } catch (error) {
    console.error('Error mapping categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

mapNiveaCategories();