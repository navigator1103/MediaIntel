import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

// Comprehensive stress test with crazy user combinations
async function stressTestValidationGrid() {
  console.log('🧨 STRESS TEST: Validation Grid with Crazy User Combinations');
  console.log('===============================================================\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log('📊 Master Data Analysis:');
  console.log(`   - Campaigns: ${Object.keys(masterData.campaignToRangeMap || {}).length}`);
  console.log(`   - Categories: ${masterData.categories?.length || 0}`);
  console.log(`   - Nivea categories: ${masterData.niveaCategories?.length || 0}`);
  console.log(`   - Derma categories: ${masterData.dermaCategories?.length || 0}`);

  // Get some real campaigns and categories from master data
  const niveaCampaigns = Object.entries(masterData.campaignToRangeMap || {})
    .filter(([campaign, range]) => {
      const rangeBusinessUnit = masterData.rangeToBusinessUnit?.[range as string];
      return rangeBusinessUnit === 'Nivea';
    })
    .map(([campaign]) => campaign)
    .slice(0, 10);

  const dermaCampaigns = Object.entries(masterData.campaignToRangeMap || {})
    .filter(([campaign, range]) => {
      const rangeBusinessUnit = masterData.rangeToBusinessUnit?.[range as string];
      return rangeBusinessUnit === 'Derma';
    })
    .map(([campaign]) => campaign)
    .slice(0, 10);

  const niveaCategories = masterData.categoryToBusinessUnit ? 
    Object.entries(masterData.categoryToBusinessUnit)
      .filter(([cat, bu]) => bu === 'Nivea')
      .map(([cat]) => cat) : [];

  const dermaCategories = masterData.categoryToBusinessUnit ? 
    Object.entries(masterData.categoryToBusinessUnit)
      .filter(([cat, bu]) => bu === 'Derma')
      .map(([cat]) => cat) : [];

  console.log(`   - Found ${niveaCampaigns.length} Nivea campaigns, ${dermaCampaigns.length} Derma campaigns`);
  console.log(`   - Found ${niveaCategories.length} Nivea categories, ${dermaCategories.length} Derma categories\n`);

  // Crazy test combinations that users might try
  const crazyTestCases = [
    // 1. CROSS-BUSINESS UNIT CHAOS
    {
      name: "🧨 CHAOS: All Nivea campaigns in all Derma categories",
      generateTests: () => {
        const tests = [];
        for (const niveaCampaign of niveaCampaigns.slice(0, 5)) {
          for (const dermaCategory of dermaCategories.slice(0, 3)) {
            const dermaRanges = masterData.categoryToRanges?.[dermaCategory] || [];
            if (dermaRanges.length > 0) {
              tests.push({
                name: `${niveaCampaign} (Nivea) in ${dermaCategory} (Derma)`,
                category: dermaCategory,
                range: dermaRanges[0],
                campaign: niveaCampaign,
                expectedSeverity: 'critical',
                expectedReason: 'Cross-business unit violation'
              });
            }
          }
        }
        return tests;
      }
    },

    // 2. REVERSE CHAOS
    {
      name: "🔄 REVERSE CHAOS: All Derma campaigns in all Nivea categories", 
      generateTests: () => {
        const tests = [];
        for (const dermaCampaign of dermaCampaigns.slice(0, 5)) {
          for (const niveaCategory of niveaCategories.slice(0, 3)) {
            const niveaRanges = masterData.categoryToRanges?.[niveaCategory] || [];
            if (niveaRanges.length > 0) {
              tests.push({
                name: `${dermaCampaign} (Derma) in ${niveaCategory} (Nivea)`,
                category: niveaCategory,
                range: niveaRanges[0],
                campaign: dermaCampaign,
                expectedSeverity: 'critical',
                expectedReason: 'Cross-business unit violation'
              });
            }
          }
        }
        return tests;
      }
    },

    // 3. CATEGORY-RANGE MISMATCHES
    {
      name: "💥 MISMATCH: Campaigns with mismatched category-range pairs",
      generateTests: () => {
        const tests = [];
        const allCategories = masterData.categories || [];
        const allRanges = masterData.ranges || [];
        
        // Try campaigns with categories that don't match their ranges
        for (const campaign of [...niveaCampaigns.slice(0, 3), ...dermaCampaigns.slice(0, 3)]) {
          const actualRange = masterData.campaignToRangeMap?.[campaign];
          const actualCategories = masterData.rangeToCategories?.[actualRange] || [];
          
          // Find categories that this campaign's range is NOT in
          const incompatibleCategories = allCategories.filter((cat: string) => 
            !actualCategories.some((ac: string) => ac.toLowerCase() === cat.toLowerCase())
          );
          
          for (const badCategory of incompatibleCategories.slice(0, 2)) {
            const badRanges = masterData.categoryToRanges?.[badCategory] || [];
            if (badRanges.length > 0) {
              tests.push({
                name: `${campaign} with mismatched ${badCategory}/${badRanges[0]}`,
                category: badCategory,
                range: badRanges[0],
                campaign: campaign,
                expectedSeverity: 'critical',
                expectedReason: 'Campaign-category mismatch'
              });
            }
          }
        }
        return tests.slice(0, 15); // Limit to prevent overwhelming
      }
    },

    // 4. NON-EXISTENT COMBINATIONS
    {
      name: "👻 GHOST DATA: Non-existent campaigns, ranges, categories",
      generateTests: () => [
        {
          name: "Completely fake campaign in real category",
          category: niveaCategories[0] || 'Lip',
          range: (masterData.categoryToRanges?.[niveaCategories[0]]?.[0]) || 'Lip',
          campaign: 'Fake Campaign That Never Existed 2025',
          expectedSeverity: 'warning',
          expectedReason: 'Auto-creation warning'
        },
        {
          name: "Real campaign in fake category (if it existed)",
          category: 'Completely Fake Category XYZ',
          range: 'Fake Range ABC',
          campaign: niveaCampaigns[0] || 'Disney',
          expectedSeverity: 'critical',
          expectedReason: 'Invalid category/range'
        },
        {
          name: "Mix of real and fake data",
          category: dermaCategories[0] || 'Acne',
          range: 'Made Up Range 123',
          campaign: 'Made Up Campaign 456',
          expectedSeverity: 'critical',
          expectedReason: 'Invalid range'
        }
      ]
    },

    // 5. EDGE CASE CHAOS
    {
      name: "🎯 EDGE CASES: Case sensitivity, special characters, etc.",
      generateTests: () => {
        const tests = [];
        const testCampaign = niveaCampaigns[0] || 'Disney';
        const testCategory = niveaCategories[0] || 'Lip';
        const testRange = (masterData.categoryToRanges?.[testCategory]?.[0]) || 'Lip';
        
        return [
          {
            name: "UPPERCASE CAMPAIGN in lowercase category",
            category: testCategory.toLowerCase(),
            range: testRange,
            campaign: testCampaign.toUpperCase(),
            expectedSeverity: 'varies',
            expectedReason: 'Case sensitivity test'
          },
          {
            name: "Campaign with extra spaces",
            category: testCategory,
            range: testRange,
            campaign: `  ${testCampaign}  `,
            expectedSeverity: 'none',
            expectedReason: 'Should handle trimming'
          },
          {
            name: "Category with different casing",
            category: testCategory.toUpperCase(),
            range: testRange.toLowerCase(),
            campaign: testCampaign,
            expectedSeverity: 'varies',
            expectedReason: 'Case sensitivity in categories'
          },
          {
            name: "Empty strings test",
            category: '',
            range: '',
            campaign: '',
            expectedSeverity: 'critical',
            expectedReason: 'Required field validation'
          },
          {
            name: "Special characters in campaign",
            category: testCategory,
            range: testRange,
            campaign: 'Special@#$%Campaign&*()2025',
            expectedSeverity: 'warning',
            expectedReason: 'Non-existent campaign with special chars'
          }
        ];
      }
    },

    // 6. REAL WORLD CHAOS SCENARIOS
    {
      name: "🌪️ REAL WORLD: What users actually do wrong",
      generateTests: () => [
        {
          name: "User uploads Nivea data but changes category to Derma",
          category: 'Acne', // Derma category
          range: 'Acne',   // Derma range
          campaign: 'Disney', // Nivea campaign - CLASSIC USER ERROR
          expectedSeverity: 'critical',
          expectedReason: 'Classic cross-BU error'
        },
        {
          name: "User copies campaign name wrong (typo)",
          category: 'Lip',
          range: 'Lip', 
          campaign: 'Disnay', // Typo in Disney
          expectedSeverity: 'warning',
          expectedReason: 'Typo leads to auto-creation'
        },
        {
          name: "User mixes up similar campaign names",
          category: 'Hand Body',
          range: 'Body Milk',
          campaign: 'Body Lotion', // Similar but different from Body Milk 5 in 1
          expectedSeverity: 'varies',
          expectedReason: 'Campaign confusion'
        },
        {
          name: "User tries to force incompatible combination", 
          category: 'Anti Age', // Derma
          range: 'Anti Age',   // Derma
          campaign: 'Cool Kick', // Nivea DEO campaign in Derma ANTI-AGE
          expectedSeverity: 'critical',
          expectedReason: 'Completely wrong business unit'
        }
      ]
    }
  ];

  // Initialize validator
  const validator = new AutoCreateValidator(masterData);
  console.log('✅ AutoCreateValidator initialized\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let criticalIssuesFound = 0;
  let warningIssuesFound = 0;

  // Run all test categories
  for (const testCategory of crazyTestCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 ${testCategory.name}`);
    console.log(`${'='.repeat(80)}`);

    const tests = testCategory.generateTests();
    console.log(`Generated ${tests.length} test cases\n`);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      totalTests++;

      console.log(`\n${i + 1}. ${test.name}`);
      console.log(`   Category: ${test.category} | Range: ${test.range} | Campaign: ${test.campaign}`);
      console.log(`   Expected: ${test.expectedSeverity} (${test.expectedReason})`);

      try {
        const testRecord = {
          'Category': test.category,
          'Range': test.range,
          'Campaign': test.campaign,
          'Media': 'Digital',
          'Media Subtype': 'PM & FF',
          'Country': 'India',
          'Total Budget': '100000'
        };

        const result = await validator.validateRecord(testRecord, 0, [testRecord]);
        const campaignIssues = result.filter((issue: any) => issue.columnName === 'Campaign');
        const criticalCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'critical');
        const warningCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'warning');

        let actualSeverity = 'none';
        if (criticalCampaignIssues.length > 0) {
          actualSeverity = 'critical';
          criticalIssuesFound++;
        } else if (warningCampaignIssues.length > 0) {
          actualSeverity = 'warning';
          warningIssuesFound++;
        }

        console.log(`   Actual: ${actualSeverity} (${campaignIssues.length} campaign issues, ${result.length} total issues)`);

        // Show first few campaign messages
        if (campaignIssues.length > 0) {
          console.log(`   Messages: ${campaignIssues.slice(0, 2).map((i: any) => `${i.severity.toUpperCase()}: ${i.message.substring(0, 60)}...`).join(' | ')}`);
        }

        // Determine if test passed based on expectation
        let testPassed = false;
        if (test.expectedSeverity === 'varies') {
          testPassed = true; // Accept any result for edge cases
        } else if (test.expectedSeverity === actualSeverity) {
          testPassed = true;
        } else if (test.expectedSeverity === 'critical' && actualSeverity === 'critical') {
          testPassed = true;
        } else if (test.expectedSeverity === 'warning' && actualSeverity === 'warning') {
          testPassed = true;
        }

        if (testPassed) {
          console.log(`   ✅ PASS`);
          passedTests++;
        } else {
          console.log(`   ❌ FAIL (Expected ${test.expectedSeverity}, got ${actualSeverity})`);
          failedTests++;
        }

      } catch (error: any) {
        console.log(`   💥 ERROR: ${error.message}`);
        failedTests++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('🏆 STRESS TEST SUMMARY');
  console.log('='.repeat(100));
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`❌ Failed: ${failedTests} (${Math.round((failedTests / totalTests) * 100)}%)`);
  console.log(`🚨 Critical Issues Found: ${criticalIssuesFound}`);
  console.log(`⚠️  Warning Issues Found: ${warningIssuesFound}`);

  if (failedTests === 0) {
    console.log('\n🎉 INCREDIBLE! Validation system survived the stress test!');
    console.log('💪 Your validation is robust enough to handle crazy user behavior!');
  } else {
    console.log(`\n⚠️  Found ${failedTests} issues that need attention:`);
    console.log('🔧 Review failed test cases to strengthen validation rules');
  }

  // Recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  console.log('1. Monitor real user behavior for new edge cases');
  console.log('2. Add more specific error messages for common mistakes'); 
  console.log('3. Consider adding data sanitization (trim, case normalization)');
  console.log('4. Test with different master data configurations');
  console.log('5. Add performance tests for large datasets');

  await validator.disconnect();
}

// Run the stress test
stressTestValidationGrid().catch(console.error);