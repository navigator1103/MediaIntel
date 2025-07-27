import fs from 'fs';
import path from 'path';

// Fix all mapping inconsistencies found by the validation script
async function fixAllMappingInconsistencies() {
  console.log('🔧 Fixing all mapping inconsistencies...\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log('1️⃣ Fixing category-range mapping inconsistencies...');

  // Fix 1: Acne range should only belong to Acne category, not Face Cleansing or Men
  if (masterData.rangeToCategories['Acne']) {
    masterData.rangeToCategories['Acne'] = ['Acne'];
    console.log('  ✅ Fixed Acne range to only map to Acne category');
  }

  // Fix 2: Remove Acne from Face Cleansing and Men categories  
  if (masterData.categoryToRanges['Face Cleansing']) {
    masterData.categoryToRanges['Face Cleansing'] = masterData.categoryToRanges['Face Cleansing'].filter((r: string) => r !== 'Acne');
    console.log('  ✅ Removed Acne from Face Cleansing category');
  }
  
  if (masterData.categoryToRanges['Men']) {
    masterData.categoryToRanges['Men'] = masterData.categoryToRanges['Men'].filter((r: string) => r !== 'Acne');
    console.log('  ✅ Removed Acne from Men category');
  }

  // Fix 3: Fix Sun category inconsistencies - Sun should be Derma, remove from Nivea
  console.log('\n2️⃣ Fixing business unit inconsistencies...');
  
  if (masterData.niveaCategories && masterData.niveaCategories.includes('Sun')) {
    masterData.niveaCategories = masterData.niveaCategories.filter((c: string) => c !== 'Sun');
    console.log('  ✅ Removed Sun from niveaCategories array');
  }

  // Fix 4: X-Cat is Derma, remove from Nivea if present
  if (masterData.niveaCategories && masterData.niveaCategories.includes('X-Cat')) {
    masterData.niveaCategories = masterData.niveaCategories.filter((c: string) => c !== 'X-Cat');
    console.log('  ✅ Removed X-Cat from niveaCategories array');
  }

  console.log('\n3️⃣ Fixing orphaned ranges...');

  // Clean up orphaned ranges that were removed from categories but still have campaigns
  const orphanedRanges = [
    'Atopi', 'Body Lotion', 'Body Range', 'Hydration', 'Repair', 'pH5'
  ];

  orphanedRanges.forEach(range => {
    if (masterData.rangeToCampaigns[range]) {
      delete masterData.rangeToCampaigns[range];
      console.log(`  ✅ Removed campaigns for orphaned range: ${range}`);
    }
  });

  // Fix range-category mismatches
  console.log('\n4️⃣ Fixing specific range-category mismatches...');

  // Fix Body Star - should be in Hand Body category
  if (masterData.rangeToCategories['Body Star'] && !masterData.categoryToRanges['Hand Body']?.includes('Body Star')) {
    if (!masterData.categoryToRanges['Hand Body']) {
      masterData.categoryToRanges['Hand Body'] = [];
    }
    if (!masterData.categoryToRanges['Hand Body'].includes('Body Star')) {
      masterData.categoryToRanges['Hand Body'].push('Body Star');
      console.log('  ✅ Added Body Star to Hand Body category');
    }
  }

  // Fix UV Face and Protect & Moisture - these should be Sun ranges under Nivea
  const sunRangesForNivea = ['Protect & Moisture', 'UV Face'];
  sunRangesForNivea.forEach(range => {
    if (masterData.rangeToCategories[range]) {
      // These should map to Sun category under Nivea, not Derma
      // But since we have Sun as Derma, let's create a proper Nivea Sun category
      if (!masterData.categoryToRanges['Sun (Nivea)']) {
        masterData.categoryToRanges['Sun (Nivea)'] = [];
        masterData.categoryToBusinessUnit['Sun (Nivea)'] = 'Nivea';
        if (!masterData.niveaCategories.includes('Sun (Nivea)')) {
          masterData.niveaCategories.push('Sun (Nivea)');
        }
      }
      masterData.categoryToRanges['Sun (Nivea)'].push(range);
      masterData.rangeToCategories[range] = ['Sun (Nivea)'];
      console.log(`  ✅ Fixed ${range} to map to Sun (Nivea) category`);
    }
  });

  // Fix X-Range should map to X-Cat
  if (masterData.rangeToCategories['X-Range'] && !masterData.categoryToRanges['X-Cat']?.includes('X-Range')) {
    if (!masterData.categoryToRanges['X-Cat'].includes('X-Range')) {
      masterData.categoryToRanges['X-Cat'].push('X-Range');
      console.log('  ✅ Added X-Range to X-Cat category');
    }
  }

  console.log('\n5️⃣ Cleaning up arrays...');

  // Update categories array
  if (masterData.categories) {
    const validCategories = Object.keys(masterData.categoryToRanges);
    masterData.categories = masterData.categories.filter((cat: string) => validCategories.includes(cat));
    
    // Add any missing categories
    validCategories.forEach(cat => {
      if (!masterData.categories.includes(cat)) {
        masterData.categories.push(cat);
      }
    });
    masterData.categories.sort();
    console.log('  ✅ Updated categories array');
  }

  // Update ranges array
  if (masterData.ranges) {
    const validRanges = Object.keys(masterData.rangeToCategories);
    masterData.ranges = masterData.ranges.filter((range: string) => validRanges.includes(range));
    
    // Add any missing ranges
    validRanges.forEach(range => {
      if (!masterData.ranges.includes(range)) {
        masterData.ranges.push(range);
      }
    });
    masterData.ranges.sort();
    console.log('  ✅ Updated ranges array');
  }

  // Write the updated masterData.json
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

  console.log('\n✅ All mapping inconsistencies have been fixed!');
  console.log('\n🔍 Summary of fixes:');
  console.log('  • Fixed Acne range to only belong to Acne category');
  console.log('  • Removed Sun and X-Cat from Nivea business unit (they belong to Derma)');
  console.log('  • Cleaned up orphaned ranges that no longer have categories');
  console.log('  • Fixed range-category bidirectional mappings');
  console.log('  • Created Sun (Nivea) category for Nivea sun ranges');
  console.log('  • Updated all arrays to match the mappings');

  console.log('\n🎯 Run the validation script again to verify all issues are resolved!');
}

// Run the fix
fixAllMappingInconsistencies().catch(console.error);