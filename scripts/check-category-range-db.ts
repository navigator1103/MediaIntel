import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategoryRangeDB() {
  try {
    console.log('🔍 Checking category-range relationships in database...');

    // Check Men category and range relationship
    const menCategory = await prisma.category.findUnique({
      where: { name: 'Men' },
      include: { 
        ranges: {
          include: { range: true }
        }
      }
    });

    const menRange = await prisma.range.findUnique({
      where: { name: 'Men' }
    });

    console.log('\n📊 Men Category-Range Status:');
    if (menCategory) {
      console.log(`✅ Men category found (ID: ${menCategory.id})`);
      console.log(`   Linked ranges: [${menCategory.ranges.map(r => r.range.name).join(', ')}]`);
      
      const hasMenRange = menCategory.ranges.some(r => r.range.name === 'Men');
      console.log(`   Contains "Men" range: ${hasMenRange ? '✅' : '❌'}`);
    } else {
      console.log('❌ Men category not found');
    }

    if (menRange) {
      console.log(`✅ Men range found (ID: ${menRange.id})`);
    } else {
      console.log('❌ Men range not found');
    }

    // Check Sun category and range relationship
    const sunCategory = await prisma.category.findUnique({
      where: { name: 'Sun' },
      include: { 
        ranges: {
          include: { range: true }
        }
      }
    });

    const sunRange = await prisma.range.findUnique({
      where: { name: 'Sun' }
    });

    console.log('\n📊 Sun Category-Range Status:');
    if (sunCategory) {
      console.log(`✅ Sun category found (ID: ${sunCategory.id})`);
      console.log(`   Linked ranges: [${sunCategory.ranges.map(r => r.range.name).join(', ')}]`);
      
      const hasSunRange = sunCategory.ranges.some(r => r.range.name === 'Sun');
      console.log(`   Contains "Sun" range: ${hasSunRange ? '✅' : '❌'}`);
    } else {
      console.log('❌ Sun category not found');
    }

    if (sunRange) {
      console.log(`✅ Sun range found (ID: ${sunRange.id})`);
    } else {
      console.log('❌ Sun range not found');
    }

    // Check if the CategoryToRange relationship exists in the junction table
    if (menCategory && menRange) {
      const menCategoryRange = await prisma.categoryToRange.findFirst({
        where: {
          categoryId: menCategory.id,
          rangeId: menRange.id
        }
      });
      console.log(`\n🔗 Men Category-Range junction exists: ${menCategoryRange ? '✅' : '❌'}`);
    }

    if (sunCategory && sunRange) {
      const sunCategoryRange = await prisma.categoryToRange.findFirst({
        where: {
          categoryId: sunCategory.id,
          rangeId: sunRange.id
        }
      });
      console.log(`🔗 Sun Category-Range junction exists: ${sunCategoryRange ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Error checking category-range relationships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategoryRangeDB();