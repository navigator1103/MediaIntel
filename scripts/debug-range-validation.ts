import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';
import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

async function testRangeValidation() {
  console.log('🔍 Testing Range Validation Behavior\n');
  
  // Load the Singapore file that's causing issues
  const singaporeFile = '/Users/naveedshah/Downloads/game-plans-template_Singapore_less errors_v2.csv';
  
  if (!fs.existsSync(singaporeFile)) {
    console.error('❌ Singapore file not found:', singaporeFile);
    return;
  }
  
  // Parse the CSV
  const fileContent = fs.readFileSync(singaporeFile, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`📁 Loaded ${records.length} records from Singapore file`);
  console.log('First record sample:', records[0]);
  console.log('');
  
  // Load master data
  const masterDataPath = path.join(process.cwd(), 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
  
  console.log('📊 Master data ranges (first 10):', masterData.ranges.slice(0, 10));
  console.log('');
  
  // Test 1: Base MediaSufficiencyValidator with auto-create enabled
  console.log('🧪 Test 1: MediaSufficiencyValidator with autoCreate=true');
  const baseValidator = new MediaSufficiencyValidator(masterData, true, 'ABP2025');
  const baseIssues = await baseValidator.validateAll(records);
  const rangeIssuesBase = baseIssues.filter(issue => issue.columnName === 'Range');
  console.log(`Found ${rangeIssuesBase.length} range issues:`);
  rangeIssuesBase.forEach((issue, i) => {
    console.log(`  ${i + 1}. Row ${issue.rowIndex + 1}: ${issue.message} (${issue.severity})`);
  });
  console.log('');
  
  // Test 2: AutoCreateValidator
  console.log('🧪 Test 2: AutoCreateValidator');
  const autoValidator = new AutoCreateValidator(masterData, 'ABP2025');
  const autoIssues = await autoValidator.validateAll(records);
  const rangeIssuesAuto = autoIssues.filter(issue => issue.columnName === 'Range');
  console.log(`Found ${rangeIssuesAuto.length} range issues:`);
  rangeIssuesAuto.forEach((issue, i) => {
    console.log(`  ${i + 1}. Row ${issue.rowIndex + 1}: ${issue.message} (${issue.severity})`);
  });
  console.log('');
  
  // Test 3: Check specific ranges from the file
  console.log('🧪 Test 3: Checking specific ranges from the file');
  const uniqueRanges = [...new Set(records.map((r: any) => r.Range))].filter(Boolean) as string[];
  console.log('Unique ranges in file:', uniqueRanges);
  
  uniqueRanges.forEach((range: string) => {
    const exists = masterData.ranges.includes(range);
    console.log(`  Range "${range}": ${exists ? '✅ EXISTS' : '❌ NOT FOUND'} in master data`);
  });
  console.log('');
  
  console.log('✅ Range validation test completed');
}

testRangeValidation().catch(console.error);