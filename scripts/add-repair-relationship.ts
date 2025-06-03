import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Repair-Repair relationship...');

  try {
    // Find or create Repair category
    let repairCategory = await prisma.category.findUnique({
      where: { name: 'Repair' }
    });

    if (!repairCategory) {
      repairCategory = await prisma.category.create({
        data: { name: 'Repair' }
      });
      console.log('Created category: Repair');
    } else {
      console.log('Category already exists: Repair');
    }

    // Find or create Repair range
    let repairRange = await prisma.range.findUnique({
      where: { name: 'Repair' }
    });

    if (!repairRange) {
      repairRange = await prisma.range.create({
        data: { name: 'Repair' }
      });
      console.log('Created range: Repair');
    } else {
      console.log('Range already exists: Repair');
    }

    // Create relationship between Repair category and Repair range
    const existingRelationship = await prisma.categoryToRange.findUnique({
      where: {
        categoryId_rangeId: {
          categoryId: repairCategory.id,
          rangeId: repairRange.id
        }
      }
    });

    if (!existingRelationship) {
      await prisma.categoryToRange.create({
        data: {
          categoryId: repairCategory.id,
          rangeId: repairRange.id
        }
      });
      console.log('Created relationship: Repair -> Repair');
    } else {
      console.log('Relationship already exists: Repair -> Repair');
    }

    console.log('Database update completed successfully!');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
