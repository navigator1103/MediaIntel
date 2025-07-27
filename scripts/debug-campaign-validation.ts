import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

async function testCampaignValidation() {
  console.log('🔍 Testing Campaign Validation Behavior\n');
  
  // Load the Singapore file
  const singaporeFile = '/Users/naveedshah/Downloads/game-plans-template_Singapore_less errors_v2.csv';
  
  if (!fs.existsSync(singaporeFile)) {
    console.error('❌ Singapore file not found:', singaporeFile);
    return;
  }
  
  // Parse CSV and get first few records
  const fileContent = fs.readFileSync(singaporeFile, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  // Load master data
  const masterDataPath = path.join(process.cwd(), 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
  
  // Test with first 3 records to see campaign validation
  const testRecords = records.slice(0, 3);
  console.log('Testing with records:');
  testRecords.forEach((record: any, i: number) => {
    console.log(`  ${i + 1}. Campaign: "${record.Campaign}", Range: "${record.Range}", Category: "${record.Category}"`);
  });
  console.log('');
  
  // Check if campaigns exist in master data
  console.log('📊 Checking campaign existence in master data:');
  const uniqueCampaigns = [...new Set(testRecords.map((r: any) => r.Campaign))];
  uniqueCampaigns.forEach(campaign => {
    const exists = masterData.campaigns?.includes(campaign);
    console.log(`  Campaign "${campaign}": ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  });
  console.log('');
  
  // Test with AutoCreateValidator
  console.log('🧪 Testing AutoCreateValidator campaign validation:');
  const autoValidator = new AutoCreateValidator(masterData, 'ABP2025');
  
  // Get campaign-related rules
  const rules = (autoValidator as any).rules;
  const campaignRules = rules.filter((rule: any) => rule.field === 'Campaign');
  console.log(`Found ${campaignRules.length} Campaign rules:`);
  campaignRules.forEach((rule: any, i: number) => {
    console.log(`  ${i + 1}. Type: ${rule.type}, Severity: ${rule.severity}`);
    console.log(`     Message: "${rule.message}"`);
  });
  console.log('');
  
  // Run validation
  console.log('🔬 Running validation on test records:');
  const issues = await autoValidator.validateAll(testRecords);
  const campaignIssues = issues.filter(issue => issue.columnName === 'Campaign');
  
  console.log(`Found ${campaignIssues.length} campaign validation issues:`);
  campaignIssues.forEach((issue, i) => {
    console.log(`  ${i + 1}. Row ${issue.rowIndex + 1}: ${issue.message} (${issue.severity})`);
    console.log(`      Current value: "${issue.currentValue}"`);
  });
  
  if (campaignIssues.length === 0) {
    console.log('  ⚠️  No campaign issues found - this might be the problem!');
  }
  
  console.log('✅ Campaign validation test completed');
}

testCampaignValidation().catch(console.error);