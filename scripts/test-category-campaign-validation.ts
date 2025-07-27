import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

// Test category-to-campaign validation specifically
async function testCategoryCampaignValidation() {
  console.log('🔬 Testing Category-to-Campaign Validation\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  const testCases = [
    {
      name: "INVALID: Disney (Lip campaign) in Acne category",
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Disney', // Disney belongs to Lip category, not Acne
      expectedResult: 'Should show critical error - wrong category for campaign'
    },
    {
      name: "INVALID: Triple Effect (Acne campaign) in Lip category", 
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Triple Effect', // Triple Effect belongs to Acne category, not Lip
      expectedResult: 'Should show critical error - wrong category for campaign'
    },
    {
      name: "VALID: Disney in correct Lip category",
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Disney', // Disney correctly belongs to Lip category
      expectedResult: 'Should be valid - correct category for campaign'
    },
    {
      name: "VALID: Triple Effect in correct Acne category",
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Triple Effect', // Triple Effect correctly belongs to Acne category
      expectedResult: 'Should be valid - correct category for campaign'
    }
  ];

  console.log('Testing category-to-campaign validation...\n');
  console.log('='.repeat(80));

  const validator = new AutoCreateValidator(masterData);

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   BU: ${testCase.businessUnit}, Category: ${testCase.category}, Range: ${testCase.range}, Campaign: ${testCase.campaign}`);
    console.log(`   Expected: ${testCase.expectedResult}`);
    console.log('   ' + '-'.repeat(75));

    const testRecord = {
      'Business Unit': testCase.businessUnit,
      'Category': testCase.category,
      'Range': testCase.range,
      'Campaign': testCase.campaign,
      'Media Type': 'Digital',
      'Media Sub Type': 'Facebook',
      'Country': 'India',
      'Financial Cycle': 'ABP2025',
      'Quarter': 'Q1',
      'Budget': '100000'
    };

    try {
      const result = await validator.validateRecord(testRecord, 0, [testRecord]);
      
      // Look for campaign validation errors
      const campaignValidationErrors = result.filter((issue: any) => {
        return issue.columnName === 'Campaign';
      });

      const allCriticalErrors = result.filter((issue: any) => issue.severity === 'critical');
      const allWarningErrors = result.filter((issue: any) => issue.severity === 'warning');

      console.log(`   📊 Validation Results:`);
      console.log(`      Campaign issues: ${campaignValidationErrors.length}`);
      console.log(`      Total critical: ${allCriticalErrors.length}`);
      console.log(`      Total warnings: ${allWarningErrors.length}`);

      // Show campaign validation messages
      if (campaignValidationErrors.length > 0) {
        console.log(`   📝 Campaign Messages:`);
        campaignValidationErrors.forEach((error: any, idx: number) => {
          const icon = error.severity === 'critical' ? '🚨' : '⚠️';
          console.log(`      ${idx + 1}. ${icon} [${error.severity.toUpperCase()}] ${error.message}`);
        });
      }

      // Determine if this meets expectations
      const shouldBeValid = testCase.expectedResult.includes('Should be valid');
      const hasErrors = allCriticalErrors.length > 0;
      
      const testPassed = shouldBeValid ? !hasErrors : hasErrors;
      const status = testPassed ? '✅ PASS' : '❌ FAIL';
      
      console.log(`   ${status} - ${hasErrors ? 'Has errors' : 'No errors'} (Expected: ${shouldBeValid ? 'valid' : 'errors'})`);

      // Show what the master data says about this campaign-category relationship
      const campaignToRangeMap = masterData.campaignToRangeMap || {};
      const actualRange = campaignToRangeMap[testCase.campaign];
      const rangeToCategories = masterData.rangeToCategories || {};
      const actualCategory = actualRange ? rangeToCategories[actualRange] : undefined;
      
      console.log(`   📍 Master Data Check:`);
      console.log(`      Campaign '${testCase.campaign}' belongs to range: ${actualRange || 'Not found'}`);
      console.log(`      Range '${actualRange}' belongs to category: ${actualCategory || 'Not found'}`);
      console.log(`      Expected category: ${testCase.category}`);
      console.log(`      Category match: ${actualCategory === testCase.category}`);

    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🚨 CRITICAL ISSUE DETECTION:');
  console.log('   We need to ensure that campaigns in wrong categories are flagged!');
  console.log('   For example: Disney (Lip campaign) should NOT be accepted in Acne category');
  console.log('   This is just as important as cross-business unit validation!');

  await validator.disconnect();
}

// Run the test
testCategoryCampaignValidation().catch(console.error);