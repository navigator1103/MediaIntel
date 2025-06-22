import fs from 'fs';
import path from 'path';

// Updated category to ranges mapping based on your latest structure
const categoryToRanges = {
  "Hand Body": [
    "Soft", "Aloe", "Milk", "Vitamin Range", "Vitamin Serum", 
    "Radiant Beauty", "Crème", "Luminous 630", "Q10", "Brightness", 
    "Repair & Care", "Even Tone Core", "Natural Glow"
  ],
  "Deo": [
    "Pearl & Beauty", "Black & White", "Deep", "Even Tone", "Skin Hero", 
    "Dry Deo", "Deep Men", "Derma Control", "Clinical", "Hijab", "Cool Kick"
  ],
  "Face Care": [
    "Luminous 630", "Cellular", "Epigenetics", "Q10", "Facial", "Acne"
  ],
  "X-Cat": [
    "All"
  ],
  "Face Cleansing": [
    "Acne", "Micellar", "Daily Essentials"
  ],
  "Men": [
    "Deep", "Cool Kick", "Men", "Sensitive", "Extra Bright", "Acne"
  ],
  "Sun": [
    "UV Face", "Protect & Moisture", "Sun"
  ],
  "Lip": [
    "Lip"
  ],
  // Keep existing derma categories
  "Acne": ["Acne"],
  "Anti Age": ["Anti Age"],
  "Anti Pigment": ["Anti Pigment"],
  "Dry Skin": ["Body Lotion", "Hydration", "Aquaphor", "pH5", "Atopi", "Repair"]
};

// Generate reverse mapping
const rangeToCategories: Record<string, string[]> = {};

Object.entries(categoryToRanges).forEach(([category, ranges]) => {
  ranges.forEach(range => {
    if (!rangeToCategories[range]) {
      rangeToCategories[range] = [];
    }
    rangeToCategories[range].push(category);
  });
});

// Read existing masterData.json
const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
const existingData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

// Update the mappings
const updatedData = {
  ...existingData,
  categoryToRanges,
  rangeToCategories,
  lastUpdated: new Date().toISOString()
};

// Write updated file
fs.writeFileSync(masterDataPath, JSON.stringify(updatedData, null, 2));

console.log('✅ Category-range mappings updated successfully!');
console.log(`📂 Categories: ${Object.keys(categoryToRanges).length}`);
console.log(`📋 Ranges with mappings: ${Object.keys(rangeToCategories).length}`);

// Show some mappings for verification
console.log('\n📊 Sample mappings:');
console.log('Face Care →', categoryToRanges["Face Care"]);
console.log('Luminous 630 →', rangeToCategories["Luminous 630"]);
console.log('Acne →', rangeToCategories["Acne"]);