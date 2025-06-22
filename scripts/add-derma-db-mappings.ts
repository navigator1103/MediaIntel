import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDermaCategoryRangeMappings() {
  try {
    console.log('🔄 Adding derma category-range mappings to database...');

    // Additional derma mappings to add
    const additionalMappings = {
      "Anti Pigment": ["Repair"],  // Repair was already in Dry Skin
      "X-Cat": ["Brand (Institutional)"]  // Brand (Institutional) was already mapped to X-Cat
    };

    // Get all categories and ranges from database
    const categories = await prisma.category.findMany();
    const ranges = await prisma.range.findMany();

    const categoryMap = new Map(categories.map(c => [c.name, c.id]));
    const rangeMap = new Map(ranges.map(r => [r.name, r.id]));

    let mappingsAdded = 0;

    // Create new mappings
    for (const [categoryName, rangeNames] of Object.entries(additionalMappings)) {
      const categoryId = categoryMap.get(categoryName);
      
      if (!categoryId) {
        console.log(`⚠️  Category not found: ${categoryName}`);
        continue;
      }

      for (const rangeName of rangeNames) {
        const rangeId = rangeMap.get(rangeName);
        
        if (!rangeId) {
          console.log(`⚠️  Range not found: ${rangeName}`);
          continue;
        }

        try {
          // Check if mapping already exists
          const existing = await prisma.categoryToRange.findFirst({
            where: {
              categoryId,
              rangeId
            }
          });

          if (!existing) {
            await prisma.categoryToRange.create({
              data: {
                categoryId,
                rangeId
              }
            });
            mappingsAdded++;
            console.log(`✅ Added mapping: ${categoryName} → ${rangeName}`);
          } else {
            console.log(`ℹ️  Mapping already exists: ${categoryName} → ${rangeName}`);
          }
        } catch (error: any) {
          console.log(`⚠️  Error creating mapping ${categoryName} → ${rangeName}: ${error.message}`);
        }
      }
    }

    console.log(`✅ Added ${mappingsAdded} new derma category-range mappings`);
    
    // Verify the updated mappings
    const updatedMappings = await prisma.categoryToRange.findMany({
      where: {
        OR: [
          { category: { name: "Anti Pigment" } },
          { category: { name: "X-Cat" } }
        ]
      },
      include: {
        category: { select: { name: true } },
        range: { select: { name: true } }
      }
    });
    
    console.log('\n📊 Updated derma mappings in database:');
    const groupedMappings = updatedMappings.reduce((acc, mapping) => {
      const categoryName = mapping.category.name;
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(mapping.range.name);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(groupedMappings).forEach(([category, ranges]) => {
      console.log(`${category} → [${ranges.join(', ')}]`);
    });

  } catch (error) {
    console.error('❌ Error updating derma category-range mappings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDermaCategoryRangeMappings();