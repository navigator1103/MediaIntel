import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

// Test the simplified campaign validation logic
async function testSimplifiedCampaignLogic() {
  console.log('🔬 Testing Simplified Campaign Validation Logic\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  const testCases = [
    {
      name: "CRITICAL: Disney (exists in Nivea) uploaded as Derma",
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Disney', // EXISTS in mappings but wrong BU
      expectedResult: 'CRITICAL - exists but wrong place'
    },
    {
      name: "WARNING: Non-existent campaign should be auto-created", 
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Totally Made Up Campaign 12345', // DOES NOT EXIST anywhere
      expectedResult: 'WARNING - auto-create'
    },
    {
      name: "VALID: Disney in correct context",
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Disney', // EXISTS and in correct place
      expectedResult: 'VALID - no errors'
    }
  ];

  console.log('Testing the simple rule: Campaign exists? If yes but wrong place = CRITICAL, if no = WARNING\n');
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

      const criticalErrors = campaignValidationErrors.filter((issue: any) => issue.severity === 'critical');
      const warningErrors = campaignValidationErrors.filter((issue: any) => issue.severity === 'warning');

      console.log(`   📊 Campaign Validation Results:`);
      console.log(`      Campaign issues: ${campaignValidationErrors.length}`);
      console.log(`      Critical: ${criticalErrors.length}`);
      console.log(`      Warnings: ${warningErrors.length}`);

      // Show campaign validation messages
      campaignValidationErrors.forEach((error: any, idx: number) => {
        const icon = error.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`      ${idx + 1}. ${icon} [${error.severity.toUpperCase()}] ${error.message}`);
      });

      // Determine test result
      let testPassed = false;
      let actualResult = '';
      
      if (criticalErrors.length > 0) {
        actualResult = 'CRITICAL';
        testPassed = testCase.expectedResult.includes('CRITICAL');
      } else if (warningErrors.length > 0) {
        actualResult = 'WARNING';
        testPassed = testCase.expectedResult.includes('WARNING');
      } else {
        actualResult = 'VALID';
        testPassed = testCase.expectedResult.includes('VALID');
      }

      const statusIcon = testPassed ? '✅' : '❌';
      console.log(`   ${statusIcon} Result: ${actualResult} (Expected: ${testCase.expectedResult})`);

      // Show where campaign actually exists
      const campaignExists = Object.keys(masterData.campaignToRangeMap || {}).some(
        key => key.toLowerCase() === testCase.campaign.toLowerCase()
      );
      
      if (campaignExists) {
        const actualRange = masterData.campaignToRangeMap?.[Object.keys(masterData.campaignToRangeMap).find(
          key => key.toLowerCase() === testCase.campaign.toLowerCase()
        ) || ''];
        const actualBusinessUnit = masterData.campaignToBusinessUnit?.[Object.keys(masterData.campaignToRangeMap).find(
          key => key.toLowerCase() === testCase.campaign.toLowerCase()
        ) || ''];
        console.log(`   📍 Campaign '${testCase.campaign}' EXISTS in mappings: Range="${actualRange}", BU="${actualBusinessUnit}"`);
      } else {
        console.log(`   📍 Campaign '${testCase.campaign}' DOES NOT EXIST in mappings - will auto-create`);
      }

    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 SIMPLE RULE SUMMARY:');
  console.log('   1. Campaign DOES NOT EXIST anywhere → WARNING (auto-create)');
  console.log('   2. Campaign EXISTS but wrong BU/range → CRITICAL (validation error)');
  console.log('   3. Campaign EXISTS and correct place → VALID (no error)');

  await validator.disconnect();
}

// Run the test
testSimplifiedCampaignLogic().catch(console.error);