import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

// Comprehensive validation grid test with step-by-step error logging
async function comprehensiveValidationGridTest() {
  console.log('🧪 COMPREHENSIVE VALIDATION GRID TEST');
  console.log('=====================================\n');

  // Load masterData from API simulation
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log('📋 Master Data Loaded:');
  console.log(`   - ${Object.keys(masterData.campaignToRangeMap || {}).length} campaign-to-range mappings`);
  console.log(`   - ${Object.keys(masterData.categoryToBusinessUnit || {}).length} category-to-business-unit mappings`);
  console.log(`   - ${Object.keys(masterData.rangeToBusinessUnit || {}).length} range-to-business-unit mappings`);
  console.log(`   - ${Object.keys(masterData.rangeToCampaigns || {}).length} range-to-campaigns mappings\n`);

  // Initialize validator
  const validator = new AutoCreateValidator(masterData);
  console.log('✅ AutoCreateValidator initialized\n');

  // Test cases designed to catch cross-business unit validation issues
  const testCases = [
    {
      name: "CRITICAL: Disney (Nivea/Lip campaign) in Derma/Acne category",
      record: {
        'Category': 'Acne',           // Derma business unit
        'Range': 'Acne',             // Derma business unit
        'Campaign': 'Disney',        // Should be Nivea/Lip campaign
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedSeverity: 'critical',
      expectedIssue: 'Campaign belongs to wrong business unit/category'
    },

    {
      name: "CRITICAL: Triple Effect (Derma/Acne campaign) in Nivea/Lip category", 
      record: {
        'Category': 'Lip',            // Nivea business unit
        'Range': 'Lip',              // Nivea business unit
        'Campaign': 'Triple Effect', // Should be Derma/Acne campaign
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedSeverity: 'critical',
      expectedIssue: 'Campaign belongs to wrong business unit/category'
    },

    {
      name: "VALID: Disney in correct Nivea/Lip category",
      record: {
        'Category': 'Lip',     // Correct: Nivea business unit
        'Range': 'Lip',       // Correct: Nivea business unit
        'Campaign': 'Disney', // Correct: Nivea campaign
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedSeverity: 'none',
      expectedIssue: 'Should have no campaign validation errors'
    },

    {
      name: "VALID: Triple Effect in correct Derma/Acne category",
      record: {
        'Category': 'Acne',           // Correct: Derma business unit
        'Range': 'Acne',             // Correct: Derma business unit  
        'Campaign': 'Triple Effect', // Correct: Derma campaign
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedSeverity: 'none',
      expectedIssue: 'Should have no campaign validation errors'
    },

    {
      name: "WARNING: Non-existent campaign for auto-creation",
      record: {
        'Category': 'Acne',
        'Range': 'Acne',
        'Campaign': 'Completely Made Up Campaign XYZ123', // Doesn't exist anywhere
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedSeverity: 'warning',
      expectedIssue: 'Should warn for auto-creation'
    },

    {
      name: "CRITICAL: Body Milk 5 in 1 (Nivea/Hand Body campaign) in Derma/Acne category",
      record: {
        'Category': 'Acne',                // Wrong: Derma business unit
        'Range': 'Acne',                  // Wrong: Derma business unit
        'Campaign': 'Body Milk 5 in 1',  // Should be Nivea/Hand Body campaign
        'Media': 'Traditional',
        'Media Subtype': 'Open TV',
        'Country': 'India', 
        'Total Budget': '120000',
        'Total TRPs': '150',
        'Total R3+ (%)': '65%'
      },
      expectedSeverity: 'critical',
      expectedIssue: 'Campaign belongs to wrong business unit/category'
    },

    {
      name: "VALID: Body Milk 5 in 1 in correct Nivea/Hand Body category",
      record: {
        'Category': 'Hand Body',          // Correct: Nivea business unit
        'Range': 'Body Milk',            // Correct: Nivea business unit
        'Campaign': 'Body Milk 5 in 1', // Correct: Nivea campaign
        'Media': 'Traditional',
        'Media Subtype': 'Open TV',
        'Country': 'India',
        'Total Budget': '120000',
        'Total TRPs': '150',
        'Total R3+ (%)': '65%'
      },
      expectedSeverity: 'none',
      expectedIssue: 'Should have no campaign validation errors'
    }
  ];

  console.log(`🎯 Running ${testCases.length} validation test cases...\n`);
  console.log('='.repeat(100));

  let passedTests = 0;
  let failedTests = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🧪 TEST ${i + 1}: ${testCase.name}`);
    console.log('-'.repeat(80));
    
    // Show test record details
    console.log('📝 Test Record:');
    console.log(`   Category: ${testCase.record.Category}`);
    console.log(`   Range: ${testCase.record.Range}`);
    console.log(`   Campaign: ${testCase.record.Campaign}`);
    console.log(`   Expected: ${testCase.expectedIssue}`);
    
    try {
      // Step 1: Check master data mappings for this campaign
      console.log('\n🔍 Step 1: Master Data Analysis');
      const campaignName = testCase.record.Campaign;
      const categoryName = testCase.record.Category;
      const rangeName = testCase.record.Range;
      
      // Check campaign-to-range mapping
      const actualCampaignRange = masterData.campaignToRangeMap?.[campaignName];
      console.log(`   Campaign '${campaignName}' → Range '${actualCampaignRange || 'NOT FOUND'}'`);
      
      // Check category-to-business-unit mapping
      const categoryBusinessUnit = masterData.categoryToBusinessUnit?.[categoryName];
      console.log(`   Category '${categoryName}' → Business Unit '${categoryBusinessUnit || 'NOT FOUND'}'`);
      
      // Check range-to-business-unit mapping  
      const rangeBusinessUnit = masterData.rangeToBusinessUnit?.[rangeName];
      console.log(`   Range '${rangeName}' → Business Unit '${rangeBusinessUnit || 'NOT FOUND'}'`);
      
      // Check if campaign belongs to this range
      const rangeCampaigns = masterData.rangeToCampaigns?.[rangeName] || [];
      const campaignInRange = rangeCampaigns.includes(campaignName);
      console.log(`   Campaign '${campaignName}' in range '${rangeName}' campaigns: ${campaignInRange}`);
      
      // Check business unit consistency
      const campaignActualRange = actualCampaignRange;
      const campaignActualBU = campaignActualRange ? masterData.rangeToBusinessUnit?.[campaignActualRange] : 'UNKNOWN';
      console.log(`   Campaign '${campaignName}' actual business unit: '${campaignActualBU}'`);
      
      // Identify potential issues
      console.log('\n📊 Step 2: Issue Analysis');
      let predictedIssues = [];
      
      if (!actualCampaignRange) {
        predictedIssues.push('Campaign not found in master data → Should trigger auto-creation warning');
      } else if (actualCampaignRange !== rangeName) {
        predictedIssues.push(`Campaign belongs to range '${actualCampaignRange}' not '${rangeName}' → Should trigger critical error`);
      } else if (campaignActualBU !== categoryBusinessUnit) {
        predictedIssues.push(`Business unit mismatch: Campaign BU '${campaignActualBU}' vs Category BU '${categoryBusinessUnit}' → Should trigger critical error`);
      } else {
        predictedIssues.push('All mappings appear correct → Should have no campaign errors');
      }
      
      predictedIssues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
      });

      // Step 3: Run actual validation
      console.log('\n⚡ Step 3: Running AutoCreateValidator');
      const validationResult = await validator.validateRecord(testCase.record, 0, [testCase.record]);
      
      // Filter only campaign validation issues
      const campaignIssues = validationResult.filter((issue: any) => issue.columnName === 'Campaign');
      const criticalCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'critical');
      const warningCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'warning');
      
      console.log(`   Total validation issues: ${validationResult.length}`);
      console.log(`   Campaign-specific issues: ${campaignIssues.length}`);
      console.log(`   Campaign critical issues: ${criticalCampaignIssues.length}`);
      console.log(`   Campaign warning issues: ${warningCampaignIssues.length}`);
      
      // Show campaign validation messages
      if (campaignIssues.length > 0) {
        console.log('\n📝 Campaign Validation Messages:');
        campaignIssues.forEach((issue: any, idx: number) => {
          const icon = issue.severity === 'critical' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`   ${idx + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
        });
      } else {
        console.log('   ✅ No campaign validation issues found');
      }

      // Step 4: Test result evaluation
      console.log('\n🎯 Step 4: Test Result Evaluation');
      let testPassed = false;
      let actualSeverity = 'none';
      
      if (criticalCampaignIssues.length > 0) {
        actualSeverity = 'critical';
      } else if (warningCampaignIssues.length > 0) {
        actualSeverity = 'warning';
      }
      
      console.log(`   Expected severity: ${testCase.expectedSeverity}`);
      console.log(`   Actual severity: ${actualSeverity}`);
      
      if (testCase.expectedSeverity === actualSeverity) {
        testPassed = true;
        console.log('   ✅ TEST PASSED - Validation behavior matches expectation');
        passedTests++;
      } else {
        testPassed = false;
        console.log('   ❌ TEST FAILED - Validation behavior does not match expectation');
        failedTests++;
        
        // Additional debugging for failed tests
        console.log('\n🔧 Debugging Failed Test:');
        if (testCase.expectedSeverity === 'critical' && actualSeverity !== 'critical') {
          console.log('   Expected critical error but got none or warning');
          console.log('   This suggests validation rules are not catching cross-business unit issues');
        } else if (testCase.expectedSeverity === 'none' && actualSeverity !== 'none') {
          console.log('   Expected no errors but got validation issues');
          console.log('   This suggests validation rules are too strict or mappings are incorrect');
        } else if (testCase.expectedSeverity === 'warning' && actualSeverity !== 'warning') {
          console.log('   Expected warning for auto-creation but got different result');
          console.log('   This suggests auto-creation logic is not working properly');
        }
      }
      
    } catch (error: any) {
      console.log(`   ❌ TEST ERROR: ${error.message}`);
      failedTests++;
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(100));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(100));
  console.log(`✅ Passed Tests: ${passedTests}/${testCases.length}`);
  console.log(`❌ Failed Tests: ${failedTests}/${testCases.length}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / testCases.length) * 100)}%\n`);

  if (failedTests > 0) {
    console.log('🔧 RECOMMENDED FIXES:');
    console.log('1. Check AutoCreateValidator campaign validation logic');
    console.log('2. Verify master data mappings are correct and complete');
    console.log('3. Ensure API returns complete business unit mappings');
    console.log('4. Test validation grid with real session data');
  } else {
    console.log('🎉 ALL TESTS PASSED! Validation grid should work correctly.');
  }

  await validator.disconnect();
}

// Run the comprehensive test
comprehensiveValidationGridTest().catch(console.error);