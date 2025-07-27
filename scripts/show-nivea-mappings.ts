import fs from 'fs';
import path from 'path';

// Show all Nivea category-to-range mappings for verification
async function showNiveaMappings() {
  console.log('📋 NIVEA Category-to-Range Mappings\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  const categoryToRanges = masterData.categoryToRanges || {};
  const categoryToBusinessUnit = masterData.categoryToBusinessUnit || {};

  // Find all Nivea categories
  const niveaCategories = Object.entries(categoryToBusinessUnit)
    .filter(([category, businessUnit]) => businessUnit === 'Nivea')
    .map(([category]) => category)
    .sort();

  console.log('🔵 NIVEA Categories and their Ranges:');
  console.log('=' .repeat(60));

  niveaCategories.forEach((category, index) => {
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
  console.log(`Total Nivea Categories: ${niveaCategories.length}`);
  
  let totalNiveaRanges = 0;
  niveaCategories.forEach(category => {
    const ranges = categoryToRanges[category] || [];
    totalNiveaRanges += ranges.length;
  });
  console.log(`Total Ranges under Nivea: ${totalNiveaRanges}`);

  // Show categories with most ranges
  console.log('\n🔝 Categories with Most Ranges:');
  const categoriesWithCounts = niveaCategories.map(category => ({
    category,
    count: (categoryToRanges[category] || []).length
  })).sort((a, b) => b.count - a.count);

  categoriesWithCounts.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. ${item.category}: ${item.count} ranges`);
  });
}

// Run the display
showNiveaMappings().catch(console.error);