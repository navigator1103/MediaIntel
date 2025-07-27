import fs from 'fs';
import path from 'path';

// Fix missing range-to-business-unit mappings
async function fixMissingRangeBusinessUnits() {
  console.log('🔧 Fixing Missing Range-to-Business-Unit Mappings\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  const categoryToBusinessUnit = masterData.categoryToBusinessUnit || {};
  const rangeToCategories = masterData.rangeToCategories || {};
  const rangeToBusinessUnit = masterData.rangeToBusinessUnit || {};

  console.log('📊 Current Status:');
  console.log(`   - Categories with BU mappings: ${Object.keys(categoryToBusinessUnit).length}`);
  console.log(`   - Ranges with category mappings: ${Object.keys(rangeToCategories).length}`);
  console.log(`   - Ranges with BU mappings: ${Object.keys(rangeToBusinessUnit).length}`);

  // Find missing mappings
  const missingRanges: string[] = [];
  const addedMappings: Record<string, string> = {};

  for (const range of masterData.ranges || []) {
    if (!rangeToBusinessUnit[range]) {
      missingRanges.push(range);
      
      // Try to infer business unit from categories
      const categories = rangeToCategories[range] || [];
      let inferredBU: string | null = null;
      
      for (const category of categories) {
        const categoryBU = categoryToBusinessUnit[category];
        if (categoryBU) {
          if (!inferredBU) {
            inferredBU = categoryBU;
          } else if (inferredBU !== categoryBU) {
            console.log(`   ⚠️  Range '${range}' has categories from multiple BUs: ${inferredBU} vs ${categoryBU}`);
          }
        }
      }
      
      if (inferredBU) {
        addedMappings[range] = inferredBU;
        console.log(`   ✅ Range '${range}' → BU '${inferredBU}' (inferred from categories: ${categories.join(', ')})`);
      } else {
        console.log(`   ❌ Cannot infer BU for range '${range}' (categories: ${categories.join(', ')})`);
      }
    }
  }

  console.log(`\n📋 Summary:`);
  console.log(`   - Missing ranges found: ${missingRanges.length}`);
  console.log(`   - Mappings inferred: ${Object.keys(addedMappings).length}`);
  console.log(`   - Ranges still missing: ${missingRanges.length - Object.keys(addedMappings).length}`);

  // Add the inferred mappings
  for (const [range, bu] of Object.entries(addedMappings)) {
    rangeToBusinessUnit[range] = bu;
  }

  // Special manual mappings for key ranges that couldn't be inferred
  const manualMappings = {
    'Acne': 'Derma',           // Key Derma range
    'Anti Age': 'Derma',       // Key Derma range  
    'Anti Pigment': 'Derma',   // Key Derma range
    'Deo': 'Nivea',           // Key Nivea range
    'Face Care': 'Nivea',      // Key Nivea range
    'Hand Body': 'Nivea',      // Key Nivea range
    'Lip': 'Nivea',           // Key Nivea range
    'Men': 'Nivea',           // Key Nivea range
    'Sun': 'Nivea'            // Key Nivea range
  };

  console.log(`\n🔧 Adding manual mappings for key ranges:`);
  for (const [range, bu] of Object.entries(manualMappings)) {
    if (!rangeToBusinessUnit[range]) {
      rangeToBusinessUnit[range] = bu;
      console.log(`   ✅ Range '${range}' → BU '${bu}' (manual mapping)`);
    }
  }

  // Update masterData
  masterData.rangeToBusinessUnit = rangeToBusinessUnit;

  // Write back to file
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));
  
  console.log(`\n✅ Updated masterData.json with ${Object.keys(rangeToBusinessUnit).length} range-to-BU mappings`);
  
  // Verify key ranges now have mappings
  console.log(`\n🔍 Verification of key ranges:`);
  const keyRanges = ['Acne', 'Lip', 'Body Milk', 'Deep', 'Deo', 'Hand Body'];
  for (const range of keyRanges) {
    const bu = masterData.rangeToBusinessUnit[range];
    console.log(`   ${range} → ${bu || 'STILL MISSING'}`);
  }
}

// Run the fix
fixMissingRangeBusinessUnits().catch(console.error);