import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function debugCategoryMatching() {
  console.log('🔍 DEBUGGING: Category matching logic\n');

  try {
    // Load master data
    const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));
    
    // Get database categories
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('🗂️ Database Categories:');
    for (const category of categories) {
      console.log(`   - "${category.name}" (ID: ${category.id})`);
    }
    
    console.log('\n📋 Master Data Range-to-Category Mappings:');
    const rangeToCategories = masterData.rangeToCategories || {};
    for (const [range, category] of Object.entries(rangeToCategories)) {
      console.log(`   - "${range}" → "${category}"`);
    }
    
    // Create category name to ID mapping
    const categoryNameToId = new Map<string, number>();
    for (const category of categories) {
      categoryNameToId.set(category.name, category.id);
    }
    
    console.log('\n🔍 Testing specific cases:');
    
    // Test some specific cases
    const testCases = [
      { range: 'Acne', expectedCategory: rangeToCategories['Acne'] },
      { range: 'Deo', expectedCategory: rangeToCategories['Deo'] },
      { range: 'Lip', expectedCategory: rangeToCategories['Lip'] },
      { range: 'Sun', expectedCategory: rangeToCategories['Sun'] },
      { range: 'Anti Age', expectedCategory: rangeToCategories['Anti Age'] }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Testing: "${testCase.range}"`);
      console.log(`      Expected category: "${testCase.expectedCategory}"`);
      
      if (!testCase.expectedCategory) {
        console.log(`      ❌ No mapping in master data`);
        continue;
      }
      
      const foundId = categoryNameToId.get(testCase.expectedCategory);
      console.log(`      Category ID lookup: ${foundId ? foundId : 'NOT FOUND'}`);
      
      // Check if it's a case sensitivity issue
      const exactMatch = categories.find(c => c.name === testCase.expectedCategory);
      const caseInsensitiveMatch = categories.find(c => c.name.toLowerCase() === testCase.expectedCategory.toLowerCase());
      
      console.log(`      Exact match: ${exactMatch ? 'YES' : 'NO'}`);
      console.log(`      Case-insensitive match: ${caseInsensitiveMatch ? 'YES' : 'NO'}`);
      
      if (caseInsensitiveMatch && !exactMatch) {
        console.log(`      Case mismatch: DB has "${caseInsensitiveMatch.name}", expecting "${testCase.expectedCategory}"`);
      }
    }
    
    // Check if the issue is with multi-category mappings
    console.log('\n🔍 Checking multi-category mappings:');
    for (const [range, category] of Object.entries(rangeToCategories)) {
      if (typeof category === 'string' && category.includes(',')) {
        console.log(`   "${range}" → "${category}" (MULTI-CATEGORY)`);
      }
    }
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

debugCategoryMatching().catch(console.error);