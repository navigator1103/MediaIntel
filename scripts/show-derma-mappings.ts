import fs from 'fs';
import path from 'path';

// Show all Derma category-to-range mappings for verification
async function showDermaMappings() {
  console.log('📋 DERMA Category-to-Range Mappings\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  const categoryToRanges = masterData.categoryToRanges || {};
  const categoryToBusinessUnit = masterData.categoryToBusinessUnit || {};

  // Find all Derma categories
  const dermaCategories = Object.entries(categoryToBusinessUnit)
    .filter(([category, businessUnit]) => businessUnit === 'Derma')
    .map(([category]) => category)
    .sort();

  console.log('🔴 DERMA Categories and their Ranges:');
  console.log('=' .repeat(60));

  dermaCategories.forEach((category, index) => {
    const ranges = categoryToRanges[category] || [];
    console.log(`${index + 1}. ${category}:`);
    
    if (ranges.length === 0) {
      console.log('   ❌ No ranges mapped');
    } else {
      ranges.forEach((range: string, rangeIndex: number) => {
        console.log(`   ${rangeIndex + 1}) ${range}`);
      });
    }
    console.log();
  });

  // Summary counts
  console.log('📊 SUMMARY:');
  console.log(`Total Derma Categories: ${dermaCategories.length}`);
  
  let totalDermaRanges = 0;
  dermaCategories.forEach(category => {
    const ranges = categoryToRanges[category] || [];
    totalDermaRanges += ranges.length;
  });
  console.log(`Total Ranges under Derma: ${totalDermaRanges}`);

  // Show categories with most ranges
  console.log('\n🔝 Categories with Most Ranges:');
  const categoriesWithCounts = dermaCategories.map(category => ({
    category,
    count: (categoryToRanges[category] || []).length
  })).sort((a, b) => b.count - a.count);

  categoriesWithCounts.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. ${item.category}: ${item.count} range${item.count !== 1 ? 's' : ''}`);
  });
}

// Run the display
showDermaMappings().catch(console.error);