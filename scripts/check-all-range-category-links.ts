import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function checkAllRangeCategoryLinks() {
  console.log('🔍 CHECKING: All range-category links in database\n');

  try {
    // Load master data to see what the correct mappings should be
    const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));
    
    console.log('📊 Master Data Analysis:');
    console.log(`   Ranges in master data: ${Object.keys(masterData.rangeToCampaigns || {}).length}`);
    console.log(`   Category to Range mappings: ${Object.keys(masterData.categoryToRanges || {}).length}`);
    console.log(`   Range to Category mappings: ${Object.keys(masterData.rangeToCategories || {}).length}`);
    
    // Get all ranges from database
    const ranges = await prisma.range.findMany({
      where: { status: { not: 'archived' } },
      orderBy: { name: 'asc' }
    });
    
    // Get all categories from database
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n💾 Database Analysis:`);
    console.log(`   Active ranges in database: ${ranges.length}`);
    console.log(`   Categories in database: ${categories.length}`);
    
    // Create category name to ID mapping
    const categoryNameToId = new Map<string, number>();
    for (const category of categories) {
      categoryNameToId.set(category.name, category.id);
    }
    
    // Check each range's category link
    console.log(`\n🔍 Range-Category Link Analysis:`);
    
    let totalRanges = 0;
    let linkedRanges = 0;
    let unlinkedRanges = 0;
    let wronglyLinkedRanges = 0;
    let fixableRanges = 0;
    
    const unlinkedList: Array<{range: string, shouldLinkTo?: string, categoryId?: number}> = [];
    const wronglyLinkedList: Array<{range: string, currentCategory: string, shouldLinkTo: string}> = [];
    
    for (const range of ranges) {
      totalRanges++;
      
      // What category should this range be linked to according to master data?
      const expectedCategory = masterData.rangeToCategories?.[range.name];
      
      if (range.category_id === null) {
        unlinkedRanges++;
        
        if (expectedCategory && categoryNameToId.has(expectedCategory)) {
          const categoryId = categoryNameToId.get(expectedCategory)!;
          unlinkedList.push({
            range: range.name,
            shouldLinkTo: expectedCategory,
            categoryId: categoryId
          });
          fixableRanges++;
        } else {
          unlinkedList.push({
            range: range.name,
            shouldLinkTo: expectedCategory || 'UNKNOWN'
          });
        }
      } else {
        linkedRanges++;
        
        // Check if it's linked to the correct category
        const currentCategory = categories.find(c => c.id === range.category_id);
        if (expectedCategory && currentCategory && currentCategory.name !== expectedCategory) {
          wronglyLinkedRanges++;
          wronglyLinkedList.push({
            range: range.name,
            currentCategory: currentCategory.name,
            shouldLinkTo: expectedCategory
          });
        }
      }
    }
    
    console.log(`   Total ranges: ${totalRanges}`);
    console.log(`   Properly linked: ${linkedRanges - wronglyLinkedRanges}`);
    console.log(`   Unlinked (category_id = null): ${unlinkedRanges}`);
    console.log(`   Wrongly linked: ${wronglyLinkedRanges}`);
    console.log(`   Fixable with master data: ${fixableRanges}`);
    
    // Show unlinked ranges
    if (unlinkedList.length > 0) {
      console.log(`\n❌ UNLINKED RANGES (${unlinkedList.length}):`);
      for (const item of unlinkedList) {
        if (item.categoryId) {
          console.log(`   - "${item.range}" → should link to "${item.shouldLinkTo}" (ID: ${item.categoryId}) ✅ FIXABLE`);
        } else {
          console.log(`   - "${item.range}" → category "${item.shouldLinkTo}" not found ❌ NEEDS MANUAL FIX`);
        }
      }
    }
    
    // Show wrongly linked ranges
    if (wronglyLinkedList.length > 0) {
      console.log(`\n⚠️ WRONGLY LINKED RANGES (${wronglyLinkedList.length}):`);
      for (const item of wronglyLinkedList) {
        console.log(`   - "${item.range}" → currently "${item.currentCategory}" but should be "${item.shouldLinkTo}"`);
      }
    }
    
    // Summary
    const successRate = Math.round(((linkedRanges - wronglyLinkedRanges) / totalRanges) * 100);
    console.log(`\n🎯 Range-Category Link Health: ${successRate}%`);
    
    if (fixableRanges > 0) {
      console.log(`\n🔧 ${fixableRanges} ranges can be automatically fixed using master data`);
      console.log(`Would you like me to generate a fix script?`);
    }
    
    // Show categories that exist in master data but not in database
    console.log(`\n🔍 Categories in Master Data vs Database:`);
    const masterCategories = new Set(Object.keys(masterData.categoryToRanges || {}));
    const dbCategoryNames = new Set(categories.map(c => c.name));
    
    const missingInDb = Array.from(masterCategories).filter(cat => !dbCategoryNames.has(cat));
    const extraInDb = Array.from(dbCategoryNames).filter(cat => !masterCategories.has(cat));
    
    if (missingInDb.length > 0) {
      console.log(`   Categories in master data but missing in DB: ${missingInDb.join(', ')}`);
    }
    
    if (extraInDb.length > 0) {
      console.log(`   Categories in DB but not in master data: ${extraInDb.join(', ')}`);
    }
    
    return {
      totalRanges,
      unlinkedRanges,
      wronglyLinkedRanges,
      fixableRanges,
      fixableList: unlinkedList.filter(item => item.categoryId)
    };
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

checkAllRangeCategoryLinks().catch(console.error);