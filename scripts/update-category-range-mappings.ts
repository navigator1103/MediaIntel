import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCategoryRangeMappings() {
  try {
    console.log('Updating category-range mappings...');
    
    // Clear existing mappings
    await prisma.categoryToRange.deleteMany();
    console.log('Cleared existing category-range mappings');
    
    // Define the correct mappings based on your provided data
    const categoryRangeMappings = {
      'Deo': [
        'Black & White', 'Bliss', 'Clinical', 'Cool Kick', 'Deo Even Tone', 
        'Deo Men', 'Dry Rollon', 'Hijab', 'Men Deep', 'Pearl & Beauty', 
        'Skin Hero', 'X-Range'
      ],
      'Face Care': [
        'Cellular', 'Epigenetics', 'Facial', 'Luminous 630', 'Q10', 'C&HYA'
      ],
      'Face Cleansing': [
        'Acne', 'Rose Care', 'C&HYA', 'Micellar', 'Daily Essentials'
      ],
      'Hand Body': [
        'APC', 'Body Aloe', 'Body Milk', 'Dark Skin', 'Extra Bright', 
        'Luminous 630', 'Natural Glow', 'Q10', 'Repair & Care', 'Vitamin Range'
      ],
      'Lip': [
        'Lip'
      ],
      'Men': [
        'Acne', 'Deep', 'Extra Bright', 'Men', 'Sensitive'
      ],
      'Sun': [
        'Protect & Moisture', 'Sun', 'UV Face'
      ],
      'X-Cat': [
        'X-Range'
      ]
    };
    
    // Create the mappings
    for (const [categoryName, rangeNames] of Object.entries(categoryRangeMappings)) {
      // Find the category
      const category = await prisma.category.findUnique({
        where: { name: categoryName }
      });
      
      if (!category) {
        console.log(`Warning: Category '${categoryName}' not found`);
        continue;
      }
      
      for (const rangeName of rangeNames) {
        // Find the range
        const range = await prisma.range.findUnique({
          where: { name: rangeName }
        });
        
        if (!range) {
          console.log(`Warning: Range '${rangeName}' not found for category '${categoryName}'`);
          continue;
        }
        
        // Create the mapping
        await prisma.categoryToRange.create({
          data: {
            categoryId: category.id,
            rangeId: range.id
          }
        });
        
        console.log(`✅ Mapped: ${categoryName} -> ${rangeName}`);
      }
    }
    
    console.log('Category-range mappings updated successfully!');
    
    // Verify the mappings
    const handBodyMappings = await prisma.categoryToRange.findMany({
      where: {
        category: { name: 'Hand Body' }
      },
      include: {
        category: true,
        range: true
      }
    });
    
    console.log('\nHand Body category now includes these ranges:');
    handBodyMappings.forEach(mapping => {
      console.log(`  - ${mapping.range.name}`);
    });
    
  } catch (error) {
    console.error('Error updating category-range mappings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateCategoryRangeMappings();