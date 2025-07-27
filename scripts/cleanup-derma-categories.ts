import fs from 'fs';
import path from 'path';

// Remove Derma categories that don't have campaign mappings, keep only the 7 with campaigns
async function cleanupDermaCategories() {
  console.log('🧹 Cleaning up Derma categories - keeping only those with campaigns...\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // The 7 Derma categories/ranges that have campaign mappings
  const validDermaCategories = [
    'Acne',
    'Anti Pigment', 
    'Sun',
    'Anti Age',
    'Aquaphor',
    'X-Cat',
    'Dry Skin'
  ];

  console.log('✅ Keeping these 7 Derma categories with campaigns:');
  validDermaCategories.forEach((category, index) => {
    const campaignCount = (masterData.rangeToCampaigns[category] || []).length;
    console.log(`  ${index + 1}. ${category} (${campaignCount} campaigns)`);
  });

  // Find Derma categories to remove
  const currentDermaCategories = Object.entries(masterData.categoryToBusinessUnit)
    .filter(([category, businessUnit]) => businessUnit === 'Derma')
    .map(([category]) => category);

  const categoriesToRemove = currentDermaCategories.filter(
    category => !validDermaCategories.includes(category)
  );

  console.log('\n❌ Removing these Derma categories (no campaigns):');
  categoriesToRemove.forEach((category, index) => {
    console.log(`  ${index + 1}. ${category}`);
  });

  // Remove from categoryToRanges
  console.log('\n🔄 Updating categoryToRanges...');
  categoriesToRemove.forEach(category => {
    if (masterData.categoryToRanges[category]) {
      delete masterData.categoryToRanges[category];
      console.log(`  ✅ Removed ${category} from categoryToRanges`);
    }
  });

  // Remove from categoryToBusinessUnit
  console.log('\n🔄 Updating categoryToBusinessUnit...');
  categoriesToRemove.forEach(category => {
    if (masterData.categoryToBusinessUnit[category]) {
      delete masterData.categoryToBusinessUnit[category];
      console.log(`  ✅ Removed ${category} from categoryToBusinessUnit`);
    }
  });

  // Remove corresponding ranges from rangeToCategories
  console.log('\n🔄 Updating rangeToCategories...');
  categoriesToRemove.forEach(category => {
    // For Derma, category and range names are the same
    if (masterData.rangeToCategories[category]) {
      delete masterData.rangeToCategories[category];
      console.log(`  ✅ Removed ${category} from rangeToCategories`);
    }
  });

  // Remove from categories array if it exists
  if (masterData.categories && Array.isArray(masterData.categories)) {
    console.log('\n🔄 Updating categories array...');
    const originalLength = masterData.categories.length;
    masterData.categories = masterData.categories.filter(
      (category: string) => !categoriesToRemove.includes(category)
    );
    const newLength = masterData.categories.length;
    console.log(`  ✅ Removed ${originalLength - newLength} categories from categories array`);
  }

  // Remove from ranges array if it exists
  if (masterData.ranges && Array.isArray(masterData.ranges)) {
    console.log('\n🔄 Updating ranges array...');
    const originalLength = masterData.ranges.length;
    masterData.ranges = masterData.ranges.filter(
      (range: string) => !categoriesToRemove.includes(range)
    );
    const newLength = masterData.ranges.length;
    console.log(`  ✅ Removed ${originalLength - newLength} ranges from ranges array`);
  }

  // Write the updated masterData.json
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

  console.log('\n✅ Successfully cleaned up Derma categories!');
  
  // Verify the cleanup
  console.log('\n🔍 Verification - Remaining Derma categories:');
  const remainingDermaCategories = Object.entries(masterData.categoryToBusinessUnit)
    .filter(([category, businessUnit]) => businessUnit === 'Derma')
    .map(([category]) => category)
    .sort();

  remainingDermaCategories.forEach((category, index) => {
    const ranges = masterData.categoryToRanges[category] || [];
    const campaignCount = (masterData.rangeToCampaigns[category] || []).length;
    console.log(`  ${index + 1}. ${category} → [${ranges.join(', ')}] (${campaignCount} campaigns)`);
  });

  console.log(`\n📊 Final count: ${remainingDermaCategories.length} Derma categories (should be 7)`);
  
  if (remainingDermaCategories.length === 7) {
    console.log('🎉 Perfect! Exactly 7 Derma categories remain.');
  } else {
    console.log('⚠️  Expected 7 categories, but found ' + remainingDermaCategories.length);
  }
}

// Run the cleanup
cleanupDermaCategories().catch(console.error);