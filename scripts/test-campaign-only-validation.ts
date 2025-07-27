import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

// Test ONLY campaign validation, ignoring other validation errors
async function testCampaignOnlyValidation() {
  console.log('🔬 Testing ONLY Campaign Validation (Ignoring Other Errors)\n');

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
      expectedResult: 'Should show critical campaign error - wrong category'
    },
    {
      name: "INVALID: Triple Effect (Acne campaign) in Lip category", 
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Triple Effect', // Triple Effect belongs to Acne category, not Lip
      expectedResult: 'Should show critical campaign error - wrong category'
    },
    {
      name: "VALID: Disney in correct Lip category",
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Disney', // Disney correctly belongs to Lip category
      expectedResult: 'Should have NO campaign errors'
    },
    {
      name: "VALID: Triple Effect in correct Acne category",
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Triple Effect', // Triple Effect correctly belongs to Acne category
      expectedResult: 'Should have NO campaign errors'
    },
    {
      name: "WARNING: Non-existent campaign for auto-creation",
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Made Up Campaign 123', // Does not exist anywhere
      expectedResult: 'Should show warning for auto-creation'
    }
  ];

  console.log('Testing ONLY campaign validation (ignoring range, budget, etc. errors)...\n');
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
      
      // ONLY look for campaign validation errors
      const campaignValidationErrors = result.filter((issue: any) => {
        return issue.columnName === 'Campaign';
      });

      const campaignCriticalErrors = campaignValidationErrors.filter((issue: any) => issue.severity === 'critical');
      const campaignWarningErrors = campaignValidationErrors.filter((issue: any) => issue.severity === 'warning');

      console.log(`   📊 Campaign Validation Only:`);
      console.log(`      Campaign critical errors: ${campaignCriticalErrors.length}`);
      console.log(`      Campaign warning errors: ${campaignWarningErrors.length}`);

      // Show campaign validation messages
      if (campaignValidationErrors.length > 0) {
        console.log(`   📝 Campaign Messages:`);
        campaignValidationErrors.forEach((error: any, idx: number) => {
          const icon = error.severity === 'critical' ? '🚨' : '⚠️';
          console.log(`      ${idx + 1}. ${icon} [${error.severity.toUpperCase()}] ${error.message}`);
        });
      } else {
        console.log(`   📝 No campaign validation errors`);
      }

      // Determine test result based ONLY on campaign validation
      let testPassed = false;
      if (testCase.expectedResult.includes('Should have NO campaign errors')) {
        testPassed = campaignValidationErrors.length === 0;
      } else if (testCase.expectedResult.includes('Should show critical campaign error')) {
        testPassed = campaignCriticalErrors.length > 0;
      } else if (testCase.expectedResult.includes('Should show warning')) {
        testPassed = campaignWarningErrors.length > 0 && campaignCriticalErrors.length === 0;
      }
      
      const status = testPassed ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${status} - Campaign validation result matches expectation`);

      // Show what the master data says about this campaign
      const campaignToRangeMap = masterData.campaignToRangeMap || {};
      const actualRange = campaignToRangeMap[testCase.campaign];
      const rangeToCategories = masterData.rangeToCategories || {};
      const actualCategories = actualRange ? (rangeToCategories[actualRange] || []) : [];
      
      console.log(`   📍 Master Data Check:`);
      console.log(`      Campaign '${testCase.campaign}' belongs to range: ${actualRange || 'Not found'}`);
      console.log(`      Range '${actualRange}' belongs to categories: ${actualCategories.join(', ') || 'Not found'}`);
      console.log(`      Expected category: ${testCase.category}`);
      const categoryMatch = actualCategories.some((cat: string) => cat.toLowerCase() === testCase.category.toLowerCase());
      console.log(`      Category match: ${categoryMatch}`);

    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 CAMPAIGN VALIDATION SUMMARY:');
  console.log('   This test focuses ONLY on campaign validation to verify:');
  console.log('   1. Campaigns in wrong categories → CRITICAL ERROR');
  console.log('   2. Campaigns in correct categories → NO CAMPAIGN ERRORS');
  console.log('   3. Non-existent campaigns → WARNING for auto-creation');
  console.log('   4. Cross-business unit campaigns → CRITICAL ERROR');

  await validator.disconnect();
}

// Run the test
testCampaignOnlyValidation().catch(console.error);