import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Acne-Acne relationship...');

  try {
    // Find Acne category
    const acneCategory = await prisma.category.findUnique({
      where: { name: 'Acne' }
    });

    // Find Acne range
    const acneRange = await prisma.range.findUnique({
      where: { name: 'Acne' }
    });

    if (acneCategory && acneRange) {
      // Check if relationship already exists
      const existingRelationship = await prisma.categoryToRange.findUnique({
        where: {
          categoryId_rangeId: {
            categoryId: acneCategory.id,
            rangeId: acneRange.id
          }
        }
      });

      if (!existingRelationship) {
        await prisma.categoryToRange.create({
          data: {
            categoryId: acneCategory.id,
            rangeId: acneRange.id
          }
        });
        console.log('Created relationship: Acne -> Acne');
      } else {
        console.log('Relationship already exists: Acne -> Acne');
      }
    } else {
      console.log('Could not find Acne category or range');
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
