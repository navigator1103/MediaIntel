import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingCategories() {
  try {
    console.log('🔄 Adding missing categories and mappings...');

    // 1. Create missing categories
    const missingCategories = ['Q10', 'UV Face'];
    
    for (const categoryName of missingCategories) {
      try {
        // Check if category already exists
        const existingCategory = await prisma.category.findUnique({
          where: { name: categoryName }
        });
        
        if (existingCategory) {
          console.log(`ℹ️  Category '${categoryName}' already exists (ID: ${existingCategory.id})`);
        } else {
          const newCategory = await prisma.category.create({
            data: { name: categoryName }
          });
          console.log(`✅ Created category '${categoryName}' (ID: ${newCategory.id})`);
        }
      } catch (error) {
        console.log(`❌ Error creating category '${categoryName}': ${error}`);
      }
    }

    // 2. Set up category-range mappings
    const categoryRangeMappings = {
      'Q10': ['Q10', 'Body Lotion', 'Face Care', 'Anti Age'], // Q10 can span multiple ranges
      'UV Face': ['UV Face', 'Sun'] // UV Face can be in both UV Face and Sun ranges
    };

    // Get all categories and ranges
    const allCategories = await prisma.category.findMany();
    const allRanges = await prisma.range.findMany();
    
    const categoryMap = new Map(allCategories.map(c => [c.name, c.id]));
    const rangeMap = new Map(allRanges.map(r => [r.name, r.id]));

    for (const [categoryName, rangeNames] of Object.entries(categoryRangeMappings)) {
      const categoryId = categoryMap.get(categoryName);
      
      if (!categoryId) {
        console.log(`⚠️  Category '${categoryName}' not found`);
        continue;
      }

      for (const rangeName of rangeNames) {
        const rangeId = rangeMap.get(rangeName);
        
        if (!rangeId) {
          console.log(`⚠️  Range '${rangeName}' not found`);
          continue;
        }

        try {
          // Check if mapping already exists
          const existingMapping = await prisma.categoryToRange.findUnique({
            where: {
              categoryId_rangeId: {
                categoryId: categoryId,
                rangeId: rangeId
              }
            }
          });

          if (!existingMapping) {
            await prisma.categoryToRange.create({
              data: {
                categoryId: categoryId,
                rangeId: rangeId
              }
            });
            console.log(`✅ Added mapping: ${categoryName} → ${rangeName}`);
          } else {
            console.log(`ℹ️  Mapping already exists: ${categoryName} → ${rangeName}`);
          }
        } catch (error) {
          console.log(`❌ Error creating mapping ${categoryName} → ${rangeName}: ${error}`);
        }
      }
    }

    // 3. Verify the new mappings
    console.log('\n🔍 Verifying new category mappings:');
    
    for (const categoryName of missingCategories) {
      const category = await prisma.category.findUnique({
        where: { name: categoryName },
        include: {
          ranges: {
            include: { range: true }
          }
        }
      });

      if (category) {
        const rangeNames = category.ranges.map(r => r.range.name);
        console.log(`${categoryName} → [${rangeNames.join(', ')}]`);
      }
    }

    console.log('\n🎯 Missing categories and mappings added successfully!');

  } catch (error) {
    console.error('❌ Error adding missing categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingCategories();