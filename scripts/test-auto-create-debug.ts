import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

async function testAutoCreateDebug() {
  console.log('🔍 DEBUG: Auto-Create and Derma Campaign Detection\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log('📊 Master Data Analysis:');
  console.log(`   Total campaigns: ${Object.keys(masterData.campaignToRangeMap || {}).length}`);
  
  // Find Derma campaigns
  const dermaCampaigns = Object.entries(masterData.campaignToRangeMap || {})
    .filter(([campaign, range]) => {
      const rangeBusinessUnit = masterData.rangeToBusinessUnit?.[range as string];
      return rangeBusinessUnit === 'Derma';
    });
  
  console.log(`   Derma campaigns found: ${dermaCampaigns.length}`);
  dermaCampaigns.forEach(([campaign, range]) => {
    console.log(`      ${campaign} → ${range}`);
  });

  // Initialize validator
  const validator = new AutoCreateValidator(masterData);
  console.log('\n✅ AutoCreateValidator initialized\n');

  // Test scenarios
  const testCases = [
    {
      name: "Valid Derma campaign in correct category",
      record: {
        'Category': 'Acne',
        'Range': 'Acne', 
        'Campaign': 'Acne Fighting Gel', // Known Derma campaign
        'Media': 'Digital',
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedBehavior: "Should validate without critical campaign errors"
    },
    {
      name: "Non-existent campaign for auto-creation",
      record: {
        'Category': 'Acne',
        'Range': 'Acne',
        'Campaign': 'Brand New Campaign 2025', // Non-existent campaign
        'Media': 'Digital', 
        'Media Subtype': 'PM & FF',
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedBehavior: "Should show WARNING for auto-creation, not CRITICAL"
    },
    {
      name: "Cross-business unit violation",
      record: {
        'Category': 'Acne', // Derma
        'Range': 'Acne',   // Derma
        'Campaign': 'Disney', // Nivea campaign
        'Media': 'Digital',
        'Media Subtype': 'PM & FF', 
        'Country': 'India',
        'Total Budget': '100000'
      },
      expectedBehavior: "Should show CRITICAL error for cross-BU violation"
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Test ${i + 1}: ${testCase.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log('Record:', JSON.stringify(testCase.record, null, 2));
    console.log(`Expected: ${testCase.expectedBehavior}\n`);

    try {
      const result = await validator.validateRecord(testCase.record, 0, [testCase.record]);
      
      // Analyze results
      const campaignIssues = result.filter((issue: any) => issue.columnName === 'Campaign');
      const criticalCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'critical');
      const warningCampaignIssues = campaignIssues.filter((issue: any) => issue.severity === 'warning');

      console.log(`📊 Results:`);
      console.log(`   Total issues: ${result.length}`);
      console.log(`   Campaign issues: ${campaignIssues.length}`);
      console.log(`   Critical campaign issues: ${criticalCampaignIssues.length}`);
      console.log(`   Warning campaign issues: ${warningCampaignIssues.length}`);

      if (campaignIssues.length > 0) {
        console.log(`\n📝 Campaign Messages:`);
        campaignIssues.forEach((issue: any, idx: number) => {
          const icon = issue.severity === 'critical' ? '🚨' : '⚠️';
          console.log(`   ${idx + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
        });
      }

      // Test auto-creation for non-existent campaigns
      if (testCase.name.includes('auto-creation')) {
        console.log(`\n🔄 Testing Auto-Creation:`);
        try {
          const autoResult = await validator.validateOrCreateCampaign(testCase.record.Campaign, 'test');
          console.log(`   Auto-create result:`, autoResult);
        } catch (error: any) {
          console.log(`   Auto-create error: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.log(`❌ Validation Error: ${error.message}`);
    }
  }

  // Check what campaigns are available in master data for Derma
  console.log(`\n${'='.repeat(60)}`);
  console.log('🔍 DERMA CAMPAIGN AVAILABILITY CHECK');
  console.log(`${'='.repeat(60)}`);

  const masterDataCampaigns = masterData.campaigns || [];
  console.log(`Master data campaigns array length: ${masterDataCampaigns.length}`);
  
  if (masterDataCampaigns.length === 0) {
    console.log('⚠️  WARNING: No campaigns found in masterData.campaigns array!');
    console.log('This might be why auto-create validation is not working properly.');
  }

  // Check if Derma campaigns are in the campaigns array
  const dermaCampaignNames = dermaCampaigns.map(([name]) => name);
  console.log('\nDerma campaigns from campaignToRangeMap:', dermaCampaignNames);
  
  const foundInCampaignsArray = dermaCampaignNames.filter(name => 
    masterDataCampaigns.some((c: string) => c.toLowerCase() === name.toLowerCase())
  );
  
  console.log('Derma campaigns found in campaigns array:', foundInCampaignsArray);
  console.log('Missing from campaigns array:', dermaCampaignNames.filter(name => 
    !foundInCampaignsArray.includes(name)
  ));

  await validator.disconnect();
}

testAutoCreateDebug().catch(console.error);