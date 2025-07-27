import fs from 'fs';
import path from 'path';
import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

// Comprehensive test for ALL campaign validation scenarios
async function comprehensiveCampaignValidationTest() {
  console.log('🔬 COMPREHENSIVE Campaign Validation Test - All Permutations\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Test cases covering all permutations
  const testCases = [
    // SCENARIO 1: VALID - Campaign belongs to correct business unit and range
    {
      scenario: "VALID: Derma campaign in Derma range",
      category: 'Acne',
      range: 'Acne', 
      campaign: 'Triple Effect', // This IS a valid Acne campaign
      businessUnit: 'Derma',
      expectedSeverity: 'none', // Should have no campaign validation errors
      description: 'Campaign correctly belongs to specified range and business unit'
    },
    {
      scenario: "VALID: Nivea campaign in Nivea range",
      category: 'Lip',
      range: 'Lip', 
      campaign: 'Disney', // This IS a valid Lip campaign  
      businessUnit: 'Nivea',
      expectedSeverity: 'none',
      description: 'Campaign correctly belongs to specified range and business unit'
    },

    // SCENARIO 2: WRONG RANGE - Campaign exists but in different range within same business unit
    {
      scenario: "WRONG RANGE: Derma campaign in wrong Derma range",
      category: 'Sun',
      range: 'Sun', 
      campaign: 'Triple Effect', // This belongs to Acne, not Sun (both Derma)
      businessUnit: 'Derma',
      expectedSeverity: 'critical',
      description: 'Campaign exists in Derma but belongs to different range'
    },
    {
      scenario: "WRONG RANGE: Nivea campaign in wrong Nivea range",
      category: 'Deo',
      range: 'Black & White', 
      campaign: 'Disney', // This belongs to Lip, not Black & White (both Nivea)
      businessUnit: 'Nivea',
      expectedSeverity: 'critical',
      description: 'Campaign exists in Nivea but belongs to different range'
    },

    // SCENARIO 3: CROSS BUSINESS UNIT - Campaign exists but belongs to different business unit
    {
      scenario: "CROSS BUSINESS UNIT: Derma campaign uploaded as Nivea",
      category: 'Lip',
      range: 'Lip', 
      campaign: 'Triple Effect', // This is a Derma campaign being uploaded to Nivea
      businessUnit: 'Nivea',
      expectedSeverity: 'critical',
      description: 'Campaign belongs to Derma but being uploaded to Nivea business unit'
    },
    {
      scenario: "CROSS BUSINESS UNIT: Nivea campaign uploaded as Derma",
      category: 'Acne',
      range: 'Acne', 
      campaign: 'Disney', // This is a Nivea campaign being uploaded to Derma
      businessUnit: 'Derma',
      expectedSeverity: 'critical',
      description: 'Campaign belongs to Nivea but being uploaded to Derma business unit'
    },

    // SCENARIO 4: NON-EXISTENT CAMPAIGN
    {
      scenario: "NON-EXISTENT: Campaign doesn't exist anywhere",
      category: 'Acne',
      range: 'Acne', 
      campaign: 'Totally Made Up Campaign Name 12345',
      businessUnit: 'Derma',
      expectedSeverity: 'warning', // Should be warning for auto-creation
      description: 'Campaign does not exist in any mappings - should be auto-created'
    },

    // SCENARIO 5: COMPLEX CROSS VALIDATION
    {
      scenario: "COMPLEX: Valid Nivea campaign but wrong category/range combination",
      category: 'Face Care',
      range: 'Cellular', 
      campaign: 'Disney', // Disney is valid Nivea campaign but belongs to Lip, not Cellular
      businessUnit: 'Nivea',
      expectedSeverity: 'critical',
      description: 'Campaign exists in correct business unit but wrong range within that BU'
    }
  ];

  console.log(`Testing ${testCases.length} comprehensive scenarios...\n`);
  console.log('='.repeat(100));

  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`\n${i + 1}. ${testCase.scenario}`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   Category: ${testCase.category} | Range: ${testCase.range} | Campaign: ${testCase.campaign} | BU: ${testCase.businessUnit}`);
    console.log('   ' + '-'.repeat(90));

    // Test with both auto-create modes
    for (const autoCreateMode of [false, true]) {
      const modeName = autoCreateMode ? 'Auto-Create Mode' : 'Normal Mode';
      console.log(`\n   📋 ${modeName}:`);

      const validator = new MediaSufficiencyValidator(masterData, autoCreateMode);

      const testRecord = {
        'Category': testCase.category,
        'Range': testCase.range,
        'Campaign': testCase.campaign,
        'Business Unit': testCase.businessUnit,
        'Media Type': 'Digital',
        'Media Sub Type': 'Facebook',
        'Country': 'India',
        'Financial Cycle': 'ABP2025',
        'Quarter': 'Q1',
        'Budget': '100000'
      };

      try {
        const result = await validator.validateRecord(testRecord, 0, [testRecord]);
        
        // Filter campaign-related validation issues
        const campaignIssues = result.filter((issue: any) => {
          const messageContent = issue.message.toLowerCase();
          return (
            messageContent.includes('campaign') ||
            messageContent.includes(testCase.campaign.toLowerCase())
          );
        });

        const criticalCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'critical');
        const warningCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'warning');

        console.log(`      Campaign Issues Found: ${campaignIssues.length} total (${criticalCampaignIssues.length} critical, ${warningCampaignIssues.length} warnings)`);

        // Log all campaign-related issues
        campaignIssues.forEach((issue: any, idx: number) => {
          const severityIcon = issue.severity === 'critical' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`      ${idx + 1}. ${severityIcon} [${issue.severity.toUpperCase()}] ${issue.message}`);
        });

        // Determine if test passed based on expected severity
        let testPassed = false;
        if (testCase.expectedSeverity === 'none') {
          testPassed = criticalCampaignIssues.length === 0;
        } else if (testCase.expectedSeverity === 'critical') {
          testPassed = criticalCampaignIssues.length > 0;
        } else if (testCase.expectedSeverity === 'warning') {
          testPassed = warningCampaignIssues.length > 0 && criticalCampaignIssues.length === 0;
        }

        const statusIcon = testPassed ? '✅' : '❌';
        const statusText = testPassed ? 'PASS' : 'FAIL';
        console.log(`      Result: ${statusIcon} ${statusText} (Expected: ${testCase.expectedSeverity}, Got: ${criticalCampaignIssues.length > 0 ? 'critical' : warningCampaignIssues.length > 0 ? 'warning' : 'none'})`);

        if (testPassed) passedTests++;

        // Show where campaign actually belongs (for debugging)
        const actualRange = masterData.campaignToRangeMap?.[testCase.campaign];
        const actualBusinessUnit = masterData.campaignToBusinessUnit?.[testCase.campaign];
        
        if (actualRange || actualBusinessUnit) {
          console.log(`      📍 Campaign '${testCase.campaign}' actually belongs to: Range="${actualRange || 'Unknown'}", BusinessUnit="${actualBusinessUnit || 'Unknown'}"`);
        } else {
          console.log(`      📍 Campaign '${testCase.campaign}' not found in any mappings (will be auto-created)`);
        }

      } catch (error: any) {
        console.log(`      ❌ ERROR: ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log(`\n📊 COMPREHENSIVE TEST RESULTS:`);
  console.log(`Tests Passed: ${passedTests}/${totalTests * 2} (${Math.round((passedTests / (totalTests * 2)) * 100)}%)`);
  
  if (passedTests === totalTests * 2) {
    console.log('🎉 ALL TESTS PASSED! Campaign validation is working correctly for all scenarios.');
  } else {
    console.log('⚠️  Some tests failed. Campaign validation needs improvement.');
    console.log('\n🔧 Issues to investigate:');
    console.log('   1. Cross-business unit validation may not be working');
    console.log('   2. Campaign validation rules may have gaps');
    console.log('   3. Validation results may not be collected properly');
  }

  // Show summary of what should be happening
  console.log('\n📋 EXPECTED BEHAVIOR SUMMARY:');
  console.log('✅ VALID cases: No campaign validation errors');
  console.log('🚨 WRONG RANGE cases: Critical errors flagging wrong range');
  console.log('🚨 CROSS BUSINESS UNIT cases: Critical errors flagging wrong business unit');
  console.log('⚠️  NON-EXISTENT cases: Warnings about auto-creation');
}

// Run the comprehensive test
comprehensiveCampaignValidationTest().catch(console.error);