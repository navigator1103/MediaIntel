import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';
import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';
import fs from 'fs';
import path from 'path';

async function testAutoCreateRules() {
  console.log('🔍 Testing AutoCreate Validator Rules\n');
  
  // Load master data
  const masterDataPath = path.join(process.cwd(), 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
  
  // Test 1: Base validator rules
  console.log('🧪 Test 1: Base MediaSufficiencyValidator rules');
  const baseValidator = new MediaSufficiencyValidator(masterData, true, 'ABP2025');
  
  // Use reflection to access protected rules property
  const baseRules = (baseValidator as any).rules;
  const baseRangeRules = baseRules.filter((rule: any) => rule.field === 'Range');
  
  console.log(`Found ${baseRangeRules.length} Range rules in base validator:`);
  baseRangeRules.forEach((rule: any, i: number) => {
    console.log(`  ${i + 1}. Type: ${rule.type}, Severity: ${rule.severity}`);
    console.log(`     Message: "${rule.message}"`);
  });
  console.log('');
  
  // Test 2: AutoCreateValidator rules
  console.log('🧪 Test 2: AutoCreateValidator rules');
  const autoValidator = new AutoCreateValidator(masterData, 'ABP2025');
  
  // Use reflection to access protected rules property
  const autoRules = (autoValidator as any).rules;
  const autoRangeRules = autoRules.filter((rule: any) => rule.field === 'Range');
  
  console.log(`Found ${autoRangeRules.length} Range rules in AutoCreateValidator:`);
  autoRangeRules.forEach((rule: any, i: number) => {
    console.log(`  ${i + 1}. Type: ${rule.type}, Severity: ${rule.severity}`);
    console.log(`     Message: "${rule.message}"`);
  });
  console.log('');
  
  // Test 3: Test validation with a sample record
  console.log('🧪 Test 3: Testing validation with sample record');
  const sampleRecord = {
    Category: 'Anti Age',
    Range: 'Anti Age',
    Campaign: 'Test Campaign'
  };
  
  console.log('Sample record:', sampleRecord);
  console.log('');
  
  // Test with each validator
  const baseIssues = await baseValidator.validateAll([sampleRecord]);
  const rangeIssuesBase = baseIssues.filter(issue => issue.columnName === 'Range');
  console.log(`Base validator found ${rangeIssuesBase.length} range issues:`);
  rangeIssuesBase.forEach(issue => {
    console.log(`  - ${issue.message} (${issue.severity})`);
  });
  console.log('');
  
  const autoIssues = await autoValidator.validateAll([sampleRecord]);
  const rangeIssuesAuto = autoIssues.filter(issue => issue.columnName === 'Range');
  console.log(`AutoCreate validator found ${rangeIssuesAuto.length} range issues:`);
  rangeIssuesAuto.forEach(issue => {
    console.log(`  - ${issue.message} (${issue.severity})`);
  });
  
  console.log('✅ Rule comparison test completed');
}

testAutoCreateRules().catch(console.error);