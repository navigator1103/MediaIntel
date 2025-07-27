import fs from 'fs';
import path from 'path';

// Validate mapping consistency to prevent breakage
interface ValidationError {
  type: string;
  message: string;
  severity: 'critical' | 'warning';
}

async function validateMappingConsistency() {
  console.log('🔍 Validating mapping consistency to prevent future breakage...\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  const errors: ValidationError[] = [];

  // 1. Check categoryToRanges vs rangeToCategories consistency
  console.log('1️⃣ Checking categoryToRanges ↔ rangeToCategories consistency...');
  
  const categoryToRanges = masterData.categoryToRanges || {};
  const rangeToCategories = masterData.rangeToCategories || {};

  // Check forward mapping (category → ranges)
  Object.entries(categoryToRanges).forEach(([category, ranges]) => {
    const rangeArray = Array.isArray(ranges) ? ranges : [];
    rangeArray.forEach((range: string) => {
      const categoriesForRange = rangeToCategories[range] || [];
      if (!categoriesForRange.includes(category)) {
        errors.push({
          type: 'MAPPING_INCONSISTENCY',
          message: `Category "${category}" maps to range "${range}", but range "${range}" doesn't map back to category "${category}"`,
          severity: 'critical'
        });
      }
    });
  });

  // Check reverse mapping (range → categories)
  Object.entries(rangeToCategories).forEach(([range, categories]) => {
    const categoryArray = Array.isArray(categories) ? categories : [];
    categoryArray.forEach((category: string) => {
      const rangesForCategory = categoryToRanges[category] || [];
      if (!rangesForCategory.includes(range)) {
        errors.push({
          type: 'MAPPING_INCONSISTENCY',
          message: `Range "${range}" maps to category "${category}", but category "${category}" doesn't map back to range "${range}"`,
          severity: 'critical'
        });
      }
    });
  });

  // 2. Check categoryToBusinessUnit consistency
  console.log('2️⃣ Checking categoryToBusinessUnit consistency...');
  
  const categoryToBusinessUnit = masterData.categoryToBusinessUnit || {};
  const dermaCategories = masterData.dermaCategories || [];
  const niveaCategories = masterData.niveaCategories || [];

  // Check Derma categories
  dermaCategories.forEach((category: string) => {
    const businessUnit = categoryToBusinessUnit[category];
    if (businessUnit !== 'Derma') {
      errors.push({
        type: 'BUSINESS_UNIT_MISMATCH',
        message: `Category "${category}" is in dermaCategories array but maps to "${businessUnit}" business unit, not "Derma"`,
        severity: 'critical'
      });
    }
  });

  // Check Nivea categories
  niveaCategories.forEach((category: string) => {
    const businessUnit = categoryToBusinessUnit[category];
    if (businessUnit !== 'Nivea') {
      errors.push({
        type: 'BUSINESS_UNIT_MISMATCH',
        message: `Category "${category}" is in niveaCategories array but maps to "${businessUnit}" business unit, not "Nivea"`,
        severity: 'critical'
      });
    }
  });

  // 3. Check rangeToCampaigns consistency
  console.log('3️⃣ Checking rangeToCampaigns coverage...');
  
  const rangeToCampaigns = masterData.rangeToCampaigns || {};

  // Check if all Derma ranges have campaigns
  const dermaRanges = dermaCategories; // For Derma, categories = ranges
  dermaRanges.forEach((range: string) => {
    const campaigns = rangeToCampaigns[range];
    if (!campaigns || campaigns.length === 0) {
      errors.push({
        type: 'MISSING_CAMPAIGNS',
        message: `Derma range "${range}" has no campaigns in rangeToCampaigns`,
        severity: 'warning'
      });
    }
  });

  // 4. Check for orphaned ranges (exist in rangeToCampaigns but not in any category)
  console.log('4️⃣ Checking for orphaned ranges...');
  
  const allRangesInCategories = Object.values(categoryToRanges).flat();
  const rangesWithCampaigns = Object.keys(rangeToCampaigns);

  rangesWithCampaigns.forEach(range => {
    if (!allRangesInCategories.includes(range)) {
      errors.push({
        type: 'ORPHANED_RANGE',
        message: `Range "${range}" has campaigns but is not mapped to any category`,
        severity: 'warning'
      });
    }
  });

  // 5. Check arrays consistency
  console.log('5️⃣ Checking arrays consistency...');
  
  const categoriesArray = masterData.categories || [];
  const rangesArray = masterData.ranges || [];

  // Check if all categories in categoryToRanges exist in categories array
  Object.keys(categoryToRanges).forEach(category => {
    if (!categoriesArray.includes(category)) {
      errors.push({
        type: 'MISSING_FROM_ARRAY',
        message: `Category "${category}" exists in categoryToRanges but not in categories array`,
        severity: 'warning'
      });
    }
  });

  // Check if all ranges in rangeToCategories exist in ranges array
  Object.keys(rangeToCategories).forEach(range => {
    if (!rangesArray.includes(range)) {
      errors.push({
        type: 'MISSING_FROM_ARRAY',
        message: `Range "${range}" exists in rangeToCategories but not in ranges array`,
        severity: 'warning'
      });
    }
  });

  // Report results
  console.log('\n📊 VALIDATION RESULTS:');
  console.log('=' .repeat(60));

  if (errors.length === 0) {
    console.log('🎉 ALL MAPPINGS ARE CONSISTENT! No issues found.');
  } else {
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    const warnings = errors.filter(e => e.severity === 'warning');

    console.log(`❌ Found ${errors.length} issues (${criticalErrors.length} critical, ${warnings.length} warnings):\n`);

    if (criticalErrors.length > 0) {
      console.log('🚨 CRITICAL ERRORS (must fix):');
      criticalErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.message}`);
      });
      console.log();
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS (should fix):');
      warnings.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.message}`);
      });
      console.log();
    }
  }

  // Summary statistics
  console.log('📈 MAPPING STATISTICS:');
  console.log(`Categories: ${Object.keys(categoryToRanges).length}`);
  console.log(`Ranges: ${Object.keys(rangeToCategories).length}`);
  console.log(`Derma categories: ${dermaCategories.length}`);
  console.log(`Nivea categories: ${niveaCategories.length}`);
  console.log(`Ranges with campaigns: ${Object.keys(rangeToCampaigns).length}`);

  return errors.length === 0;
}

// Run the validation
if (require.main === module) {
  validateMappingConsistency()
    .then(isValid => {
      process.exit(isValid ? 0 : 1);
    })
    .catch(console.error);
}

export { validateMappingConsistency };