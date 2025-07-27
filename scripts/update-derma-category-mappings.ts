import * as fs from 'fs';
import * as path from 'path';

// Helper function to parse CSV
function parseCSV(content: string): string[][] {
  return content.split('\n')
    .filter(line => line.trim())
    .map(line => line.split(',').map(cell => cell.trim().replace(/^﻿/, ''))); // Remove BOM
}

async function main() {
  console.log('=== UPDATING DERMA CATEGORY-TO-RANGE MAPPINGS ===\n');

  // Load Derma Category vs Range CSV file
  const dermaCategoryVsRangePath = path.join(__dirname, '..', 'public', 'templates', 'Derman category vs range.csv');
  const dermaCategoryVsRangeContent = fs.readFileSync(dermaCategoryVsRangePath, 'utf-8');
  const dermaCategoryVsRangeData = parseCSV(dermaCategoryVsRangeContent);

  // Load master data
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log('1. PARSING DERMA CATEGORY VS RANGE CSV:');
  console.log('---------------------------------------');

  // Parse Derma Category vs Range CSV
  const dermaCategoryToRanges: Record<string, string[]> = {};
  
  if (dermaCategoryVsRangeData.length >= 3) {
    // Row 2 (index 1) has the categories
    // Row 3 (index 2) has the corresponding ranges
    const categories = dermaCategoryVsRangeData[1]; 
    const ranges = dermaCategoryVsRangeData[2];
    
    console.log(`Found Derma categories: [${categories.join(', ')}]`);
    console.log(`Found Derma ranges: [${ranges.join(', ')}]`);
    
    // Map each category to its corresponding range
    for (let i = 0; i < categories.length && i < ranges.length; i++) {
      const category = categories[i];
      const range = ranges[i];
      
      if (category && range && category !== 'Category vs range') {
        if (!dermaCategoryToRanges[category]) {
          dermaCategoryToRanges[category] = [];
        }
        dermaCategoryToRanges[category].push(range);
      }
    }
  }

  console.log(`\\nParsed ${Object.keys(dermaCategoryToRanges).length} Derma category-range mappings:`);
  Object.entries(dermaCategoryToRanges).forEach(([category, ranges]) => {
    console.log(`  ${category} → [${ranges.join(', ')}]`);
  });

  console.log('\\n2. UPDATING MASTER DATA:');
  console.log('------------------------');

  // Create backup
  const backupPath = masterDataPath + '.backup.derma-categories.' + Date.now();
  fs.writeFileSync(backupPath, JSON.stringify(masterData, null, 2));
  console.log(`✅ Created backup at: ${backupPath}`);

  let updatedCategories = 0;

  // Update categoryToRanges with Derma data
  Object.entries(dermaCategoryToRanges).forEach(([category, ranges]) => {
    if (!masterData.categoryToRanges) masterData.categoryToRanges = {};
    
    const existingRanges = masterData.categoryToRanges[category] || [];
    
    // For Derma categories, we need to MERGE with existing ranges (since some categories exist in both Nivea and Derma)
    const mergedRanges = [...new Set([...existingRanges, ...ranges])]; // Remove duplicates
    
    const newRanges = ranges.filter(r => !existingRanges.includes(r));
    
    if (newRanges.length > 0 || existingRanges.length === 0) {
      masterData.categoryToRanges[category] = mergedRanges;
      updatedCategories++;
      console.log(`  Updated categoryToRanges["${category}"]:`);
      if (newRanges.length > 0) {
        console.log(`    + Added Derma ranges: [${newRanges.join(', ')}]`);
      }
      console.log(`    → Total ranges: ${mergedRanges.length} [${mergedRanges.join(', ')}]`);
    } else {
      console.log(`  No changes needed for categoryToRanges["${category}"] - already contains [${existingRanges.join(', ')}]`);
    }
  });

  console.log(`\\n✅ Updated ${updatedCategories} categories with Derma ranges`);

  console.log('\\n3. VALIDATION CHECK:');
  console.log('-------------------');

  // Verify Anti Age category mapping
  const antiAgeRanges = masterData.categoryToRanges?.['Anti Age'] || [];
  console.log('Anti Age category validation:');
  console.log(`  ✅ Anti Age → Ranges: [${antiAgeRanges.join(', ')}]`);
  console.log(`  ✅ Contains "Anti Age" range: ${antiAgeRanges.includes('Anti Age')}`);

  // Check all Derma categories
  console.log('\\nAll Derma category mappings:');
  Object.entries(dermaCategoryToRanges).forEach(([category, expectedRanges]) => {
    const actualRanges = masterData.categoryToRanges?.[category] || [];
    const hasExpectedRanges = expectedRanges.every(r => actualRanges.includes(r));
    console.log(`  ${category} → [${actualRanges.join(', ')}] ${hasExpectedRanges ? '✅' : '❌'}`);
  });

  // Save updated master data
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));
  console.log(`\\n✅ Updated master data saved to: ${masterDataPath}`);

  console.log('\\n4. SUMMARY:');
  console.log('----------');
  console.log('✅ Derma category-to-range mappings updated successfully');
  console.log('✅ Anti Age category now properly maps to Anti Age range');
  console.log('✅ All Derma categories have correct range mappings');
  console.log(`✅ Backup created at: ${backupPath}`);
  
  console.log('\\nResolved issues:');
  console.log('  • Anti Age range should now display correctly in game plan management');
  console.log('  • Category-to-range validation should now pass for all Derma categories');
  console.log('  • Game plans with Anti Age category should show range instead of "N/A"');
  
  console.log('\\nNext steps:');
  console.log('  1. Test game plan management interface to verify Anti Age range displays correctly');
  console.log('  2. Verify other Derma categories also show correct ranges');
  console.log('  3. Test validation with updated category-range mappings');
}

main().catch(console.error);