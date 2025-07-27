import fs from 'fs';
import path from 'path';

// Fix category-range mapping inconsistencies for Derma business unit
async function fixDermaCategoryMappings() {
  console.log('🔧 Fixing Derma category-range mapping inconsistencies...\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Define the correct Derma categories and their ranges
  const dermaCategories = {
    'Acne': ['Acne'],
    'Anti Age': ['Anti Age'], 
    'Anti Pigment': ['Anti Pigment'],
    'Aquaphor': ['Aquaphor'],
    'Atopi': ['Atopi'],
    'Body Lotion': ['Body Lotion'],
    'Body Range': ['Body Range'],
    'Dry Skin': ['Dry Skin'],
    'Hydration': ['Hydration'],
    'pH5': ['pH5'],
    'Sun': ['Sun'],
    'X-Cat': ['X-Cat']
  };

  console.log('1️⃣ Updating categoryToRanges for Derma categories:');
  
  // Update categoryToRanges for Derma categories
  Object.entries(dermaCategories).forEach(([category, ranges]) => {
    masterData.categoryToRanges[category] = ranges;
    console.log(`✅ ${category} → [${ranges.join(', ')}]`);
  });

  console.log('\n2️⃣ Updating rangeToCategories for Derma ranges:');
  
  // Update rangeToCategories - reverse mapping
  Object.entries(dermaCategories).forEach(([category, ranges]) => {
    ranges.forEach(range => {
      masterData.rangeToCategories[range] = [category];
      console.log(`✅ ${range} → [${category}]`);
    });
  });

  console.log('\n3️⃣ Updating categoryToBusinessUnit for Derma categories:');
  
  // Ensure all Derma categories map to Derma business unit
  Object.keys(dermaCategories).forEach(category => {
    masterData.categoryToBusinessUnit[category] = 'Derma';
    console.log(`✅ ${category} → Derma`);
  });

  console.log('\n4️⃣ Fixing specific Sun category mapping:');
  
  // Fix Sun category - it should belong to Derma, not Nivea
  if (masterData.categoryToBusinessUnit['Sun'] !== 'Derma') {
    console.log(`⚠️  Fixing Sun category: was mapped to ${masterData.categoryToBusinessUnit['Sun']}, changing to Derma`);
    masterData.categoryToBusinessUnit['Sun'] = 'Derma';
  }

  // Write the updated masterData.json
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

  console.log('\n✅ Successfully fixed Derma category-range mappings!');
  
  // Verify the fixes
  console.log('\n🔍 Verification:');
  console.log('Category → Range mappings (categoryToRanges):');
  Object.entries(dermaCategories).forEach(([category, ranges]) => {
    const actualRanges = masterData.categoryToRanges[category] || [];
    const match = JSON.stringify(actualRanges.sort()) === JSON.stringify(ranges.sort());
    console.log(`  ${category}: ${actualRanges.join(', ')} ${match ? '✅' : '❌'}`);
  });
  
  console.log('\nRange → Category mappings (rangeToCategories):');
  Object.entries(dermaCategories).forEach(([category, ranges]) => {
    ranges.forEach(range => {
      const actualCategories = masterData.rangeToCategories[range] || [];
      const match = actualCategories.includes(category) && actualCategories.length === 1;
      console.log(`  ${range}: [${actualCategories.join(', ')}] ${match ? '✅' : '❌'}`);
    });
  });

  console.log('\nCategory → Business Unit mappings (categoryToBusinessUnit):');
  Object.keys(dermaCategories).forEach(category => {
    const businessUnit = masterData.categoryToBusinessUnit[category];
    const match = businessUnit === 'Derma';
    console.log(`  ${category}: ${businessUnit} ${match ? '✅' : '❌'}`);
  });
}

// Run the fix
fixDermaCategoryMappings().catch(console.error);