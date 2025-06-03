import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding additional category-range relationships...');

  // Define the relationships to create
  const relationships = [
    // Aquaphor as category
    { categoryName: 'Aquaphor', rangeName: 'Aquaphor' },
    { categoryName: 'Aquaphor', rangeName: 'Hydration' },
    
    // Hydration as category
    { categoryName: 'Hydration', rangeName: 'Hydration' },
    { categoryName: 'Hydration', rangeName: 'Aquaphor' },
    
    // Cool Kick as category
    { categoryName: 'Cool Kick', rangeName: 'Cool Kick' }
  ];

  try {
    // Create categories if they don't exist
    const categoriesToCreate = ['Aquaphor', 'Hydration', 'Cool Kick'];
    
    for (const categoryName of categoriesToCreate) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: categoryName }
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: { name: categoryName }
        });
        console.log(`Created category: ${categoryName}`);
      } else {
        console.log(`Category already exists: ${categoryName}`);
      }
    }

    // Create relationships
    for (const rel of relationships) {
      const category = await prisma.category.findUnique({
        where: { name: rel.categoryName }
      });

      const range = await prisma.range.findUnique({
        where: { name: rel.rangeName }
      });

      if (category && range) {
        // Check if relationship already exists
        const existingRelationship = await prisma.categoryToRange.findUnique({
          where: {
            categoryId_rangeId: {
              categoryId: category.id,
              rangeId: range.id
            }
          }
        });

        if (!existingRelationship) {
          await prisma.categoryToRange.create({
            data: {
              categoryId: category.id,
              rangeId: range.id
            }
          });
          console.log(`Created relationship: ${rel.categoryName} -> ${rel.rangeName}`);
        } else {
          console.log(`Relationship already exists: ${rel.categoryName} -> ${rel.rangeName}`);
        }
      } else {
        console.log(`Could not create relationship: ${rel.categoryName} -> ${rel.rangeName} (category or range not found)`);
      }
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
