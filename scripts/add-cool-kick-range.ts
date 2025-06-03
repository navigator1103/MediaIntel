import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Cool Kick range and relationship...');

  try {
    // Create Cool Kick range if it doesn't exist
    let coolKickRange = await prisma.range.findUnique({
      where: { name: 'Cool Kick' }
    });

    if (!coolKickRange) {
      coolKickRange = await prisma.range.create({
        data: { name: 'Cool Kick' }
      });
      console.log('Created range: Cool Kick');
    } else {
      console.log('Range already exists: Cool Kick');
    }

    // Get Cool Kick category
    const coolKickCategory = await prisma.category.findUnique({
      where: { name: 'Cool Kick' }
    });

    if (coolKickCategory && coolKickRange) {
      // Create relationship between Cool Kick category and Cool Kick range
      const existingRelationship = await prisma.categoryToRange.findUnique({
        where: {
          categoryId_rangeId: {
            categoryId: coolKickCategory.id,
            rangeId: coolKickRange.id
          }
        }
      });

      if (!existingRelationship) {
        await prisma.categoryToRange.create({
          data: {
            categoryId: coolKickCategory.id,
            rangeId: coolKickRange.id
          }
        });
        console.log('Created relationship: Cool Kick -> Cool Kick');
      } else {
        console.log('Relationship already exists: Cool Kick -> Cool Kick');
      }
    } else {
      console.log('Could not find Cool Kick category or range');
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
