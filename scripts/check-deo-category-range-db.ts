import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDeoCategoryRangeDB() {
  try {
    console.log('🔍 Checking Deo category-range relationship in database...');

    // Check if Deo category exists and what ranges it's linked to
    const deoCategory = await prisma.category.findUnique({
      where: { name: 'Deo' },
      include: { 
        ranges: {
          include: { range: true }
        }
      }
    });

    console.log('\n📊 Deo Category Database Status:');
    if (deoCategory) {
      console.log(`✅ Deo category found (ID: ${deoCategory.id})`);
      console.log(`   Linked ranges in DB: [${deoCategory.ranges.map(r => r.range.name).join(', ')}]`);
      
      const hasDryDeoRange = deoCategory.ranges.some(r => r.range.name === 'Dry Deo');
      console.log(`   Contains "Dry Deo" range: ${hasDryDeoRange ? '✅' : '❌'}`);
      
      if (!hasDryDeoRange) {
        console.log('\n⚠️  ISSUE FOUND: Deo category is missing Dry Deo range in database!');
        
        // Check if Dry Deo range exists
        const dryDeoRange = await prisma.range.findUnique({
          where: { name: 'Dry Deo' }
        });
        
        if (dryDeoRange) {
          console.log(`✅ Dry Deo range exists (ID: ${dryDeoRange.id})`);
          
          // Check if the CategoryToRange junction exists
          const junction = await prisma.categoryToRange.findFirst({
            where: {
              categoryId: deoCategory.id,
              rangeId: dryDeoRange.id
            }
          });
          
          console.log(`🔗 CategoryToRange junction exists: ${junction ? '✅' : '❌'}`);
          
          if (!junction) {
            console.log('\n🔧 FIXING: Adding missing CategoryToRange relationship...');
            
            try {
              await prisma.categoryToRange.create({
                data: {
                  categoryId: deoCategory.id,
                  rangeId: dryDeoRange.id
                }
              });
              console.log('✅ Added Deo → Dry Deo relationship to database');
            } catch (error) {
              console.log(`❌ Error adding relationship: ${error}`);
            }
          }
        } else {
          console.log('❌ Dry Deo range not found in database');
        }
      }
    } else {
      console.log('❌ Deo category not found');
    }

    // Also check Lip category while we're here
    console.log('\n📊 Lip Category Database Status:');
    const lipCategory = await prisma.category.findUnique({
      where: { name: 'Lip' },
      include: { 
        ranges: {
          include: { range: true }
        }
      }
    });

    if (lipCategory) {
      console.log(`✅ Lip category found (ID: ${lipCategory.id})`);
      console.log(`   Linked ranges in DB: [${lipCategory.ranges.map(r => r.range.name).join(', ')}]`);
      
      const hasLipRange = lipCategory.ranges.some(r => r.range.name === 'Lip');
      console.log(`   Contains "Lip" range: ${hasLipRange ? '✅' : '❌'}`);
    } else {
      console.log('❌ Lip category not found');
    }

  } catch (error) {
    console.error('❌ Error checking category-range relationships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeoCategoryRangeDB();