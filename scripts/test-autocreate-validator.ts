import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

// Test AutoCreateValidator to ensure it preserves multi-dimensional validation
async function testAutoCreateValidator() {
  console.log('🔬 Testing AutoCreateValidator - Multi-Dimensional Validation Preservation\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Test the specific scenario the user reported
  const criticalTestCases = [
    {
      name: "USER REPORTED ISSUE: Disney (Nivea campaign) uploaded as Derma Acne",
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Disney', // This is a Nivea campaign
      expectedResult: 'Should be flagged as critical cross-business unit error'
    },
    {
      name: "VALID CASE: Disney in correct Nivea context",
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Disney',
      expectedResult: 'Should be valid with no critical errors'
    },
    {
      name: "CROSS-BU: Triple Effect (Derma) uploaded as Nivea",
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Triple Effect', // This is a Derma campaign
      expectedResult: 'Should be flagged as critical cross-business unit error'
    }
  ];

  console.log('Testing AutoCreateValidator (used by validation grid)...\n');
  console.log('='.repeat(80));

  const validator = new AutoCreateValidator(masterData);

  for (const testCase of criticalTestCases) {
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
        const msg = issue.message.toLowerCase();
        return (
          msg.includes('campaign') &&
          (msg.includes('cross-business unit') ||
           msg.includes('belongs to range') ||
           msg.includes('business unit') ||
           msg.includes('wrong range'))
        );
      });

      const criticalErrors = campaignValidationErrors.filter((issue: any) => issue.severity === 'critical');
      const warningErrors = campaignValidationErrors.filter((issue: any) => issue.severity === 'warning');

      console.log(`   📊 Results:`);
      console.log(`      Total campaign issues: ${campaignValidationErrors.length}`);
      console.log(`      Critical errors: ${criticalErrors.length}`);
      console.log(`      Warning errors: ${warningErrors.length}`);

      // Check if this meets expectations
      const shouldHaveCriticalError = testCase.expectedResult.includes('critical');
      const actuallyHasCriticalError = criticalErrors.length > 0;
      
      const testPassed = shouldHaveCriticalError === actuallyHasCriticalError;
      const status = testPassed ? '✅ PASS' : '❌ FAIL';
      
      console.log(`   ${status} - ${actuallyHasCriticalError ? 'Has critical error' : 'No critical error'}`);

      // Show all campaign validation messages
      if (campaignValidationErrors.length > 0) {
        console.log(`   📝 Validation Messages:`);
        campaignValidationErrors.forEach((error: any, idx: number) => {
          const icon = error.severity === 'critical' ? '🚨' : '⚠️';
          console.log(`      ${idx + 1}. ${icon} [${error.severity.toUpperCase()}] ${error.message}`);
        });
      } else {
        console.log(`   📝 No campaign validation issues found`);
      }

      // Show where campaign actually belongs
      const actualRange = masterData.campaignToRangeMap?.[testCase.campaign];
      const actualBusinessUnit = masterData.campaignToBusinessUnit?.[testCase.campaign];
      
      if (actualRange || actualBusinessUnit) {
        console.log(`   📍 Campaign '${testCase.campaign}' actually belongs to: Range="${actualRange || 'Unknown'}", BU="${actualBusinessUnit || 'Unknown'}"`);
      } else {
        console.log(`   📍 Campaign '${testCase.campaign}' not found in mappings`);
      }

      if (!testPassed) {
        console.log(`   ❌ ISSUE: Expected ${shouldHaveCriticalError ? 'critical error' : 'no critical error'} but got ${actuallyHasCriticalError ? 'critical error' : 'no critical error'}`);
      }

    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 KEY EXPECTATION: The Disney-in-Derma case should show CRITICAL error');
  console.log('   This is the exact scenario the user reported as not working in the validation grid.');
  console.log('   If this test passes, the AutoCreateValidator fix is working correctly.');

  await validator.disconnect();
}

// Run the test
testAutoCreateValidator().catch(console.error);