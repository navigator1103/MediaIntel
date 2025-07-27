import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

async function debugSpecificCampaign() {
  console.log('🔍 DEBUG: Specific Campaign Issue\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log('📊 Master Data Check:');
  console.log(`   Total campaigns in campaignToRangeMap: ${Object.keys(masterData.campaignToRangeMap || {}).length}`);
  console.log(`   Total campaigns in campaigns array: ${(masterData.campaigns || []).length}`);

  // Initialize validator
  const validator = new AutoCreateValidator(masterData);
  console.log('✅ AutoCreateValidator initialized\n');

  // Test specific campaigns that should show as warnings
  const testCampaigns = [
    {
      name: "Bla Bla",  // User's specific test case
      category: "Lip",
      range: "Lip"
    },
    {
      name: "Random Test Campaign 123",
      category: "Acne", 
      range: "Acne"
    },
    {
      name: "Non Existent Campaign XYZ",
      category: "Anti Age",
      range: "Anti Age"
    }
  ];

  for (const test of testCampaigns) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 Testing: "${test.name}" in ${test.category}/${test.range}`);
    console.log(`${'='.repeat(70)}`);

    // Check if campaign exists in master data
    const existsInMapping = Object.keys(masterData.campaignToRangeMap || {}).some(
      key => key.toLowerCase() === test.name.toLowerCase()
    );
    const existsInArray = (masterData.campaigns || []).some((c: string) => 
      c.toLowerCase() === test.name.toLowerCase()
    );

    console.log(`Campaign exists in campaignToRangeMap: ${existsInMapping}`);
    console.log(`Campaign exists in campaigns array: ${existsInArray}`);
    console.log(`Should show WARNING for auto-creation: ${!existsInMapping && !existsInArray}\n`);

    const testRecord = {
      'Category': test.category,
      'Range': test.range,
      'Campaign': test.name,
      'Media': 'Digital',
      'Media Subtype': 'PM & FF',
      'Country': 'India',
      'Total Budget': '100000'
    };

    try {
      const result = await validator.validateRecord(testRecord, 0, [testRecord]);
      
      // Focus only on campaign issues
      const campaignIssues = result.filter((issue: any) => issue.columnName === 'Campaign');
      const criticalCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'critical');
      const warningCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'warning');

      console.log(`📊 Campaign Issues:`);
      console.log(`   Total: ${campaignIssues.length}`);
      console.log(`   Critical: ${criticalCampaignIssues.length}`);
      console.log(`   Warning: ${warningCampaignIssues.length}\n`);

      if (criticalCampaignIssues.length > 0) {
        console.log(`🚨 CRITICAL Issues (these should be warnings!):`);
        criticalCampaignIssues.forEach((issue: any, idx: number) => {
          console.log(`   ${idx + 1}. ${issue.message}`);
        });
        console.log('');
      }

      if (warningCampaignIssues.length > 0) {
        console.log(`⚠️  WARNING Issues (correct):`);
        warningCampaignIssues.forEach((issue: any, idx: number) => {
          console.log(`   ${idx + 1}. ${issue.message}`);
        });
        console.log('');
      }

      // Detailed rule execution for debugging
      console.log(`🔍 Rule Execution Details:`);
      const rules = (validator as any).rules || [];
      const campaignRules = rules.filter((rule: any) => rule.field === 'Campaign');
      
      for (const rule of campaignRules) {
        try {
          const ruleResult = rule.validate(test.name, testRecord, [testRecord], masterData);
          const passed = ruleResult === true || (typeof ruleResult === 'object' && ruleResult.isValid !== false);
          const status = passed ? '✅ PASS' : '❌ FAIL';
          console.log(`   ${status} [${rule.severity}] ${rule.message}`);
          if (!passed && typeof ruleResult === 'object') {
            console.log(`      → ${ruleResult.message || 'Validation failed'}`);
          }
        } catch (error: any) {
          console.log(`   💥 ERROR [${rule.severity}] ${rule.message}: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.log(`❌ Validation Error: ${error.message}`);
    }
  }

  await validator.disconnect();
}

debugSpecificCampaign().catch(console.error);