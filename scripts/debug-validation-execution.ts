import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

// Debug which validation rules are being executed
async function debugValidationExecution() {
  console.log('🔍 DEBUG: Validation Rule Execution\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Initialize validator
  const validator = new AutoCreateValidator(masterData);

  // Test record that should trigger campaign validation issues
  const testRecord = {
    'Category': 'Acne',      // Derma business unit
    'Range': 'Acne',        // Derma business unit
    'Campaign': 'Disney',   // Should be Nivea/Lip campaign -> CRITICAL ERROR
    'Media': 'Digital',
    'Media Subtype': 'PM & FF',
    'Country': 'India',
    'Total Budget': '100000'
  };

  console.log('🧪 Test Record:');
  Object.entries(testRecord).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  console.log('\n⚡ Running validation with detailed logging...\n');

  try {
    // Monkey patch the validator to add detailed logging
    const originalValidateRecord = validator.validateRecord.bind(validator);
    
    // Get access to the internal rules (this is a hack for debugging)
    const rules = (validator as any).rules || [];
    console.log(`📋 Total validation rules available: ${rules.length}\n`);

    // Show all campaign-related rules
    const campaignRules = rules.filter((rule: any) => rule.field === 'Campaign');
    console.log(`🎯 Campaign-specific rules found: ${campaignRules.length}`);
    campaignRules.forEach((rule: any, index: number) => {
      console.log(`   ${index + 1}. Field: ${rule.field}, Type: ${rule.type}, Severity: ${rule.severity}`);
      console.log(`      Message: ${rule.message}\n`);
    });

    // Run validation
    const result = await validator.validateRecord(testRecord, 0, [testRecord]);
    
    console.log('📊 Validation Results:');
    console.log(`   Total issues: ${result.length}`);
    
    // Group by field
    const issuesByField = result.reduce((acc: any, issue: any) => {
      if (!acc[issue.columnName]) acc[issue.columnName] = [];
      acc[issue.columnName].push(issue);
      return acc;
    }, {});

    Object.entries(issuesByField).forEach(([field, issues]) => {
      const issueArray = issues as any[];
      console.log(`\n   📝 ${field} issues (${issueArray.length}):`);
      issueArray.forEach((issue: any, index: number) => {
        const icon = issue.severity === 'critical' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`      ${index + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.message}`);
      });
    });

    // Specifically check for campaign issues
    const campaignIssues = result.filter((issue: any) => issue.columnName === 'Campaign');
    console.log(`\n🎯 Campaign Issues Summary:`);
    console.log(`   Critical: ${campaignIssues.filter((i: any) => i.severity === 'critical').length}`);
    console.log(`   Warning: ${campaignIssues.filter((i: any) => i.severity === 'warning').length}`);
    console.log(`   Suggestion: ${campaignIssues.filter((i: any) => i.severity === 'suggestion').length}`);

    if (campaignIssues.length === 0) {
      console.log('\n❌ NO CAMPAIGN ISSUES FOUND - This is the problem!');
      console.log('\n🔧 Debugging steps:');
      console.log('1. Check if campaign validation rules are being filtered out');
      console.log('2. Check if rules are failing silently');
      console.log('3. Verify masterData contains required mappings');
      
      // Check masterData structure
      console.log('\n📊 Master Data Analysis:');
      console.log(`   campaignToRangeMap entries: ${Object.keys(masterData.campaignToRangeMap || {}).length}`);
      console.log(`   rangeToCategories entries: ${Object.keys(masterData.rangeToCategories || {}).length}`);
      console.log(`   Disney mapping: ${masterData.campaignToRangeMap?.Disney}`);
      console.log(`   Acne range categories: ${(masterData.rangeToCategories?.Acne || []).join(', ')}`);
      
      // Manual validation check
      console.log('\n🔍 Manual Campaign Validation Check:');
      const campaignName = 'Disney';
      const categoryName = 'Acne';
      const campaignRange = masterData.campaignToRangeMap?.[campaignName];
      const validCategories = masterData.rangeToCategories?.[campaignRange] || [];
      const isValidCategory = validCategories.some((cat: string) => 
        cat.toLowerCase() === categoryName.toLowerCase()
      );
      
      console.log(`   Campaign '${campaignName}' belongs to range '${campaignRange}'`);
      console.log(`   Range '${campaignRange}' valid for categories: [${validCategories.join(', ')}]`);
      console.log(`   Selected category: '${categoryName}'`);
      console.log(`   Is valid combination: ${isValidCategory}`);
      console.log(`   Should trigger error: ${!isValidCategory}`);
    }

  } catch (error: any) {
    console.log(`❌ Validation error: ${error.message}`);
    console.log(error.stack);
  }

  await validator.disconnect();
}

// Run the debug
debugValidationExecution().catch(console.error);