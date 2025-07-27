import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

async function testFinalValidation() {
  console.log('🔍 Final Validation Test - Singapore File\n');
  
  // Load the Singapore file
  const singaporeFile = '/Users/naveedshah/Downloads/game-plans-template_Singapore_less errors_v2.csv';
  
  if (!fs.existsSync(singaporeFile)) {
    console.error('❌ Singapore file not found:', singaporeFile);
    return;
  }
  
  // Parse CSV
  const fileContent = fs.readFileSync(singaporeFile, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  // Load master data
  const masterDataPath = path.join(process.cwd(), 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
  
  // Test with first 5 records
  const testRecords = records.slice(0, 5);
  console.log(`Testing with ${testRecords.length} records from Singapore file\n`);
  
  // Run validation with AutoCreateValidator
  const autoValidator = new AutoCreateValidator(masterData, 'ABP2025');
  const issues = await autoValidator.validateAll(testRecords);
  
  // Filter for Campaign and Range issues only
  const campaignIssues = issues.filter(issue => issue.columnName === 'Campaign');
  const rangeIssues = issues.filter(issue => issue.columnName === 'Range');
  
  console.log('📋 **CAMPAIGN VALIDATION RESULTS**:');
  if (campaignIssues.length > 0) {
    campaignIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. Row ${issue.rowIndex + 1}: "${issue.currentValue}"`);
      console.log(`     ${issue.severity.toUpperCase()}: ${issue.message}`);
    });
  } else {
    console.log('  ✅ No campaign issues found');
  }
  
  console.log('\n📋 **RANGE VALIDATION RESULTS**:');
  if (rangeIssues.length > 0) {
    rangeIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. Row ${issue.rowIndex + 1}: "${issue.currentValue}"`);
      console.log(`     ${issue.severity.toUpperCase()}: ${issue.message}`);
    });
  } else {
    console.log('  ✅ No range issues found');
  }
  
  console.log('\n📊 **SUMMARY**:');
  console.log(`Total issues: ${issues.length}`);
  console.log(`Campaign warnings: ${campaignIssues.length}`);
  console.log(`Range errors: ${rangeIssues.length}`);
  
  console.log('\n✅ Final validation test completed');
}

testFinalValidation().catch(console.error);