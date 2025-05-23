import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCategoriesAndRanges() {
  try {
    console.log('Seeding Categories and Ranges data...');
    
    // Define categories and their ranges based on the provided image
    const categoriesWithRanges = [
      {
        name: 'Face Care',
        ranges: ['Cellular', 'Epigenetics', 'Facial', 'Luminous 630', 'Q10', 'Rose Care']
      },
      {
        name: 'Hand Body',
        ranges: [
          'Aloe', 'Crème', 'Deep', 'Even Tone Care', 'Luminous 630', 'Milk', 
          'Natural Glow', 'Ozoino', 'Q10', 'Radiant Beauty', 'Repair & Care', 
          'Soft', 'Vitamin Range', 'Vitamin Serum'
        ]
      },
      {
        name: 'Face Cleansing',
        ranges: ['Acne', 'Daily Essentials', 'Luminous 630', 'Micellar']
      },
      {
        name: 'Sun',
        ranges: ['Protect & Moisture', 'Sun', 'UV Face']
      },
      {
        name: 'Men',
        ranges: ['Acne', 'Extra Bright', 'Men', 'Sensitive']
      },
      {
        name: 'Deo',
        ranges: [
          'Black & White', 'Deep', 'Cool Kick', 'Deo Male', 
          'Even Tone', 'Hijab Fresh', 'Pearl & Beauty', 'Skin Hero'
        ]
      },
      {
        name: 'Lip',
        ranges: ['All', 'Lip']
      },
      {
        name: 'X-Cat',
        ranges: ['All']
      }
    ];
    
    // Create or update categories and ranges
    for (const categoryData of categoriesWithRanges) {
      // Create or update the category
      const category = await prisma.category.upsert({
        where: { name: categoryData.name },
        update: {},
        create: { name: categoryData.name }
      });
      
      console.log(`Created/Updated Category: ${categoryData.name}`);
      
      // Create or update ranges for this category
      for (const rangeName of categoryData.ranges) {
        await prisma.range.upsert({
          where: {
            name_categoryId: {
              name: rangeName,
              categoryId: category.id
            }
          },
          update: {},
          create: {
            name: rangeName,
            categoryId: category.id
          }
        });
        
        console.log(`Created/Updated Range: ${rangeName} for Category: ${categoryData.name}`);
      }
    }
    
    console.log('Categories and Ranges seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding Categories and Ranges:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export { seedCategoriesAndRanges };
