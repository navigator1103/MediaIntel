import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

async function testGridValidationIssue() {
  console.log('🔍 DEBUG: Grid Validation - Campaign Auto-Creation vs Critical Errors\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Initialize validator (this is what the grid uses)
  const validator = new AutoCreateValidator(masterData);
  console.log('✅ AutoCreateValidator initialized (same as validation grid)\n');

  // Test cases: campaigns that should trigger auto-creation warnings, not critical errors
  const testCases = [
    {
      name: "Completely non-existent campaign",
      record: {
        'Category': 'Acne',
        'Range': 'Acne',
        'Campaign': 'Brand New Never Seen Campaign 2025',
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedBehavior: "Should be WARNING for auto-creation, not CRITICAL"
    },
    {
      name: "Campaign with typo (similar to existing)",
      record: {
        'Category': 'Acne',
        'Range': 'Acne',
        'Campaign': 'Acne Controol', // Typo in "Acne Control"
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedBehavior: "Should be WARNING for auto-creation, not CRITICAL"
    },
    {
      name: "Random campaign name",
      record: {
        'Category': 'Anti Age',
        'Range': 'Anti Age',
        'Campaign': 'My Custom Campaign XYZ',
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedBehavior: "Should be WARNING for auto-creation, not CRITICAL"
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 Test ${i + 1}: ${testCase.name}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Campaign: "${testCase.record.Campaign}"`);
    console.log(`Category/Range: ${testCase.record.Category}/${testCase.record.Range}`);
    console.log(`Expected: ${testCase.expectedBehavior}\n`);

    try {
      const result = await validator.validateRecord(testCase.record, 0, [testCase.record]);
      
      // Focus on campaign-related issues
      const campaignIssues = result.filter((issue: any) => issue.columnName === 'Campaign');
      const criticalCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'critical');
      const warningCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'warning');

      console.log(`📊 Campaign Validation Results:`);
      console.log(`   Total campaign issues: ${campaignIssues.length}`);
      console.log(`   🚨 Critical: ${criticalCampaignIssues.length}`);
      console.log(`   ⚠️  Warning: ${warningCampaignIssues.length}`);

      if (criticalCampaignIssues.length > 0) {
        console.log(`\n🚨 CRITICAL Issues (should be warnings instead):`);
        criticalCampaignIssues.forEach((issue: any, idx: number) => {
          console.log(`   ${idx + 1}. ${issue.message}`);
        });
      }

      if (warningCampaignIssues.length > 0) {
        console.log(`\n⚠️  WARNING Issues (correct for auto-creation):`);
        warningCampaignIssues.forEach((issue: any, idx: number) => {
          console.log(`   ${idx + 1}. ${issue.message}`);
        });
      }

      // Determine if this is working correctly
      const shouldBeWarningOnly = !masterData.campaignToRangeMap?.[testCase.record.Campaign];
      if (shouldBeWarningOnly && criticalCampaignIssues.length > 0) {
        console.log(`\n❌ PROBLEM IDENTIFIED:`);
        console.log(`   Campaign "${testCase.record.Campaign}" doesn't exist in campaignToRangeMap`);
        console.log(`   Should only show warnings for auto-creation, not critical errors`);
        console.log(`   This is the issue you're seeing in the grid!`);
      } else if (shouldBeWarningOnly && warningCampaignIssues.length > 0 && criticalCampaignIssues.length === 0) {
        console.log(`\n✅ WORKING CORRECTLY:`);
        console.log(`   Non-existent campaign correctly shows warnings for auto-creation`);
      }

    } catch (error: any) {
      console.log(`❌ Validation Error: ${error.message}`);
    }
  }

  // Check current validation rules to understand the issue
  console.log(`\n${'='.repeat(70)}`);
  console.log('🔍 VALIDATION RULES ANALYSIS');
  console.log(`${'='.repeat(70)}`);

  const rules = (validator as any).rules || [];
  const campaignRules = rules.filter((rule: any) => rule.field === 'Campaign');
  
  console.log(`Total validation rules: ${rules.length}`);
  console.log(`Campaign-specific rules: ${campaignRules.length}\n`);

  campaignRules.forEach((rule: any, idx: number) => {
    console.log(`${idx + 1}. Field: ${rule.field}`);
    console.log(`   Type: ${rule.type}`);
    console.log(`   Severity: ${rule.severity}`);
    console.log(`   Message: ${rule.message}`);
    console.log('');
  });

  await validator.disconnect();
}

testGridValidationIssue().catch(console.error);