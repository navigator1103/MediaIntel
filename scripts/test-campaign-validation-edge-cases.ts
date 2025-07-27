import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';
import fs from 'fs';
import path from 'path';

async function testEdgeCases() {
  console.log('🧪 Testing Campaign Validation Edge Cases\n');
  
  const masterDataPath = path.join(process.cwd(), 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
  
  // Test cases that could break validation
  const testCases = [
    { name: 'Normal campaign', value: 'Elasticity Motown', expected: true },
    { name: 'Non-existent campaign', value: 'NonExistent', expected: false },
    { name: 'Empty string', value: '', expected: true },
    { name: 'Null value', value: null, expected: true },
    { name: 'Undefined value', value: undefined, expected: true },
    { name: 'Number value', value: 123, expected: false },
    { name: 'Whitespace only', value: '   ', expected: true },
    { name: 'Case mismatch', value: 'ELASTICITY MOTOWN', expected: true },
    { name: 'Special characters', value: 'Test & Campaign', expected: false },
  ];
  
  const validator = new AutoCreateValidator(masterData, 'ABP2025');
  const rules = (validator as any).rules;
  const campaignRule = rules.find((r: any) => r.field === 'Campaign' && r.type === 'relationship');
  
  if (!campaignRule) {
    console.error('❌ Campaign validation rule not found!');
    return;
  }
  
  console.log('🔍 Testing edge cases:');
  
  for (const testCase of testCases) {
    try {
      const result = campaignRule.validate(testCase.value, {}, [], masterData);
      const status = result === testCase.expected ? '✅' : '❌';
      console.log(`${status} ${testCase.name}: ${testCase.value} -> ${result} (expected: ${testCase.expected})`);
      
      if (result !== testCase.expected) {
        console.log(`   ⚠️ MISMATCH: Expected ${testCase.expected}, got ${result}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: THREW ERROR:`, (error as Error).message);
    }
  }
  
  // Test with corrupted master data
  console.log('\n🧪 Testing with corrupted master data:');
  
  const corruptedCases = [
    { name: 'No campaigns array', masterData: { ...masterData, campaigns: undefined } },
    { name: 'Empty campaigns array', masterData: { ...masterData, campaigns: [] } },
    { name: 'Non-array campaigns', masterData: { ...masterData, campaigns: 'not an array' } },
    { name: 'Campaigns with non-strings', masterData: { ...masterData, campaigns: ['Valid', null, 123, 'Another'] } },
  ];
  
  for (const corruptedCase of corruptedCases) {
    try {
      const result = campaignRule.validate('Test Campaign', {}, [], corruptedCase.masterData);
      console.log(`✅ ${corruptedCase.name}: ${result} (handled gracefully)`);
    } catch (error) {
      console.log(`❌ ${corruptedCase.name}: THREW ERROR:`, (error as Error).message);
    }
  }
  
  console.log('\n✅ Edge case testing completed');
}

testEdgeCases().catch(console.error);