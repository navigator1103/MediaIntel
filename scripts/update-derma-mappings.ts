import fs from 'fs';
import path from 'path';

// Read current masterData.json
const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
const existingData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

// Get the updated categoryToRanges (should include the derma updates we just made)
const categoryToRanges = existingData.categoryToRanges;

// Generate updated reverse mapping
const rangeToCategories: Record<string, string[]> = {};

Object.entries(categoryToRanges).forEach(([category, ranges]) => {
  (ranges as string[]).forEach(range => {
    if (!rangeToCategories[range]) {
      rangeToCategories[range] = [];
    }
    rangeToCategories[range].push(category);
  });
});

// Update the mappings
const updatedData = {
  ...existingData,
  rangeToCategories,
  lastUpdated: new Date().toISOString()
};

// Write updated file
fs.writeFileSync(masterDataPath, JSON.stringify(updatedData, null, 2));

console.log('✅ Derma category-range mappings updated successfully!');
console.log(`📂 Categories: ${Object.keys(categoryToRanges).length}`);
console.log(`📋 Ranges with mappings: ${Object.keys(rangeToCategories).length}`);

// Show derma-related mappings for verification
console.log('\n📊 Derma category mappings:');
console.log('Acne →', categoryToRanges["Acne"]);
console.log('Anti Age →', categoryToRanges["Anti Age"]);
console.log('Anti Pigment →', categoryToRanges["Anti Pigment"]);
console.log('X-Cat →', categoryToRanges["X-Cat"]);
console.log('Dry Skin →', categoryToRanges["Dry Skin"]);

console.log('\n📋 Updated range mappings:');
console.log('Repair →', rangeToCategories["Repair"]);
console.log('Brand (Institutional) →', rangeToCategories["Brand (Institutional)"]);
console.log('Sun →', rangeToCategories["Sun"]);