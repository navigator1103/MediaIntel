import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function fixAllRangeCategoryLinks() {
  console.log('🔧 FIXING: All range-category links in database\n');

  try {
    // Load master data
    const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));
    
    // Get current database state
    const ranges = await prisma.range.findMany({
      where: { status: { not: 'archived' } },
      orderBy: { name: 'asc' }
    });
    
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Starting State:`);
    console.log(`   Ranges in database: ${ranges.length}`);
    console.log(`   Categories in database: ${categories.length}`);
    console.log(`   Range-category mappings in master data: ${Object.keys(masterData.rangeToCategories || {}).length}`);
    
    // Create category name to ID mapping
    const categoryNameToId = new Map<string, number>();
    for (const category of categories) {
      categoryNameToId.set(category.name, category.id);
    }
    
    console.log(`\n🔍 Available categories in database:`);
    for (const category of categories) {
      console.log(`   - "${category.name}" (ID: ${category.id})`);
    }
    
    // Process each range and try to link it
    console.log(`\n🔗 Linking ranges to categories...`);
    
    let totalProcessed = 0;
    let successfullyLinked = 0;
    let alreadyLinked = 0;
    let cannotLink = 0;
    
    for (const range of ranges) {
      totalProcessed++;
      
      // What category should this range be linked to according to master data?
      const expectedCategory = masterData.rangeToCategories?.[range.name];
      
      if (!expectedCategory) {
        console.log(`   ⚠️  "${range.name}" - no category mapping in master data`);
        cannotLink++;
        continue;
      }
      
      // Check if range is already linked correctly
      if (range.category_id !== null) {
        const currentCategory = categories.find(c => c.id === range.category_id);
        if (currentCategory && currentCategory.name === expectedCategory) {
          console.log(`   ✅ "${range.name}" - already correctly linked to "${expectedCategory}"`);
          alreadyLinked++;
          continue;
        }
      }
      
      // Try to find the category in database
      const categoryId = categoryNameToId.get(expectedCategory);
      
      if (!categoryId) {
        console.log(`   ❌ "${range.name}" → category "${expectedCategory}" not found in database`);
        cannotLink++;
        continue;
      }
      
      // Link the range to the category
      try {
        await prisma.range.update({
          where: { id: range.id },
          data: { category_id: categoryId }
        });
        
        console.log(`   🔗 "${range.name}" → linked to "${expectedCategory}" (ID: ${categoryId})`);
        successfullyLinked++;
        
      } catch (error: any) {
        console.log(`   ❌ Failed to link "${range.name}": ${error.message}`);
        cannotLink++;
      }
    }
    
    // Final verification
    console.log(`\n🔍 Final Verification:`);
    const updatedRanges = await prisma.range.findMany({
      where: { status: { not: 'archived' } }
    });
    
    let linkedCount = 0;
    let unlinkedCount = 0;
    
    for (const range of updatedRanges) {
      if (range.category_id !== null) {
        linkedCount++;
      } else {
        unlinkedCount++;
      }
    }
    
    console.log(`   Total ranges: ${updatedRanges.length}`);
    console.log(`   Linked ranges: ${linkedCount}`);
    console.log(`   Unlinked ranges: ${unlinkedCount}`);
    
    const successRate = Math.round((linkedCount / updatedRanges.length) * 100);
    console.log(`\n🎯 Final Success Rate: ${successRate}%`);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Processed: ${totalProcessed}`);
    console.log(`   Successfully linked: ${successfullyLinked}`);
    console.log(`   Already linked: ${alreadyLinked}`);
    console.log(`   Could not link: ${cannotLink}`);
    
    if (cannotLink > 0) {
      console.log(`\n⚠️  ${cannotLink} ranges could not be linked - likely need category creation or master data updates`);
    }
    
    if (successRate === 100) {
      console.log(`\n🎉 PERFECT! All ranges are now linked to categories!`);
    } else if (successRate > 90) {
      console.log(`\n✅ EXCELLENT! ${successRate}% of ranges are now properly linked!`);
    } else {
      console.log(`\n⚠️  More work needed to reach full linking. Consider creating missing categories.`);
    }
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllRangeCategoryLinks().catch(console.error);