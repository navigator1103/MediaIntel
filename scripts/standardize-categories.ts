import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function standardizeCategories() {
  console.log('Starting category standardization...');

  try {
    // Fetch all categories
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} categories to process`);

    // Group categories by lowercase name
    const categoryMap = new Map<string, typeof categories>();
    categories.forEach(category => {
      const lowerName = category.name.toLowerCase();
      if (!categoryMap.has(lowerName)) {
        categoryMap.set(lowerName, []);
      }
      categoryMap.get(lowerName)?.push(category);
    });

    // Process each unique category name
    for (const [lowerName, cats] of categoryMap.entries()) {
      // Skip if there's only one category with this name and it's already in the correct format
      if (cats.length === 1) {
        const cat = cats[0];
        let standardizedName: string;
        
        if (lowerName.length <= 3) {
          // Short names should be ALL UPPERCASE
          standardizedName = lowerName.toUpperCase();
        } else {
          // Longer names should be Title Case
          standardizedName = lowerName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        
        // Only update if the name needs to be standardized
        if (cat.name !== standardizedName) {
          console.log(`Standardizing category: "${cat.name}" → "${standardizedName}"`);
          await prisma.category.update({
            where: { id: cat.id },
            data: { name: standardizedName }
          });
        }
      } 
      // If there are multiple categories with the same name (case-insensitive)
      else if (cats.length > 1) {
        console.log(`Found duplicate category: ${lowerName} with ${cats.length} variations`);
        
        // Determine the preferred case format
        let standardizedName: string;
        if (lowerName.length <= 3) {
          // Short names (like DEO) should be ALL UPPERCASE
          standardizedName = lowerName.toUpperCase();
        } else {
          // Longer names should be Title Case
          standardizedName = lowerName.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        
        // Instead of merging, just standardize the case of all categories
        for (const cat of cats) {
          if (cat.name !== standardizedName) {
            console.log(`Standardizing category: "${cat.name}" → "${standardizedName}"`);
            await prisma.category.update({
              where: { id: cat.id },
              data: { name: standardizedName }
            });
          }
        }
      }
    }

    console.log('Category standardization completed successfully!');
  } catch (error) {
    console.error('Error standardizing categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
standardizeCategories()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
