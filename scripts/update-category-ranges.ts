import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database update for new categories and ranges...');

  // New categories to add
  const newCategories = [
    { name: 'Anti Age' },
    { name: 'Anti Pigment' },
    { name: 'Dry Skin' }
  ];

  // New ranges to add
  const newRanges = [
    { name: 'Anti Age' },
    { name: 'Anti Pigment' },
    { name: 'Body Lotion' },
    { name: 'Repair' },
    { name: 'Hydration' },
    { name: 'Aquaphor' },
    { name: 'pH5' },
    { name: 'Atopi' },
    { name: 'Brightness' },
    { name: 'Dry Deo' },
    { name: 'Deep Men' },
    { name: 'Derma Control' },
    { name: 'Hijab' },
    { name: 'Brand (Institutional)' },
    { name: 'Anti-Pigment Range' },
    { name: 'Thaimidol Roof' }
  ];

  // Category-Range relationships to create
  const relationships = [
    // Anti Age category relationships
    { categoryName: 'Anti Age', rangeName: 'Anti Age' },
    { categoryName: 'Anti Age', rangeName: 'Epigenetics' },
    
    // Anti Pigment category relationships
    { categoryName: 'Anti Pigment', rangeName: 'Anti Pigment' },
    { categoryName: 'Anti Pigment', rangeName: 'Thaimidol Roof' },
    { categoryName: 'Anti Pigment', rangeName: 'Anti-Pigment Range' },
    
    // Dry Skin category relationships
    { categoryName: 'Dry Skin', rangeName: 'Body Lotion' },
    { categoryName: 'Dry Skin', rangeName: 'Repair' },
    { categoryName: 'Dry Skin', rangeName: 'Hydration' },
    { categoryName: 'Dry Skin', rangeName: 'Aquaphor' },
    { categoryName: 'Dry Skin', rangeName: 'pH5' },
    { categoryName: 'Dry Skin', rangeName: 'Atopi' },
    
    // Hand Body new range
    { categoryName: 'Hand Body', rangeName: 'Brightness' },
    
    // Deo new ranges
    { categoryName: 'Deo', rangeName: 'Dry Deo' },
    { categoryName: 'Deo', rangeName: 'Deep Men' },
    { categoryName: 'Deo', rangeName: 'Derma Control' },
    { categoryName: 'Deo', rangeName: 'Hijab' },
    
    // X-Cat new range
    { categoryName: 'X-Cat', rangeName: 'Brand (Institutional)' },
    
    // Sun new ranges
    { categoryName: 'Sun', rangeName: 'Anti Age' },
    { categoryName: 'Sun', rangeName: 'Anti Pigment' },
    
    // Acne new ranges
    { categoryName: 'Acne', rangeName: 'Anti Age' },
    { categoryName: 'Acne', rangeName: 'Anti Pigment' }
  ];

  try {
    // Create new categories
    for (const category of newCategories) {
      const existingCategory = await prisma.category.findUnique({
        where: { name: category.name }
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: category
        });
        console.log(`Created category: ${category.name}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    }

    // Create new ranges
    for (const range of newRanges) {
      const existingRange = await prisma.range.findUnique({
        where: { name: range.name }
      });

      if (!existingRange) {
        await prisma.range.create({
          data: range
        });
        console.log(`Created range: ${range.name}`);
      } else {
        console.log(`Range already exists: ${range.name}`);
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
