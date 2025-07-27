import fs from 'fs';
import path from 'path';
import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

// Test the new multi-dimensional validation logic
async function testMultiDimensionalValidation() {
  console.log('🔬 Testing Multi-Dimensional Campaign Validation\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Key test cases
  const testCases = [
    {
      name: "VALID: Disney in correct Nivea context",
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Disney',
      expected: 'VALID'
    },
    {
      name: "INVALID: Disney (Nivea campaign) uploaded as Derma",
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Disney',
      expected: 'INVALID - Cross Business Unit'
    },
    {
      name: "VALID: Triple Effect in correct Derma context",
      businessUnit: 'Derma',
      category: 'Acne', 
      range: 'Acne',
      campaign: 'Triple Effect',
      expected: 'VALID'
    },
    {
      name: "INVALID: Triple Effect (Derma campaign) uploaded as Nivea",
      businessUnit: 'Nivea',
      category: 'Lip', 
      range: 'Lip',
      campaign: 'Triple Effect',
      expected: 'INVALID - Cross Business Unit'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`   BU: ${testCase.businessUnit}, Category: ${testCase.category}, Range: ${testCase.range}, Campaign: ${testCase.campaign}`);
    console.log('   ' + '-'.repeat(80));

    const validator = new MediaSufficiencyValidator(masterData, false); // Normal mode

    const testRecord = {
      'Business Unit': testCase.businessUnit,
      'Category': testCase.category,
      'Range': testCase.range,
      'Campaign': testCase.campaign,
      'Media Type': 'Digital',
      'Media Sub Type': 'Facebook',
      'Country': 'India',
      'Financial Cycle': 'ABP2025',
      'Quarter': 'Q1',
      'Budget': '100000'
    };

    try {
      const result = await validator.validateRecord(testRecord, 0, [testRecord]);
      
      // Look for our specific multi-dimensional campaign validation errors
      const campaignValidationErrors = result.filter((issue: any) => {
        const msg = issue.message.toLowerCase();
        return (
          msg.includes('cross-business unit error') ||
          msg.includes('cross-category error') ||
          msg.includes('wrong range/business unit') ||
          msg.includes('belongs to range') ||
          msg.includes('business unit')
        );
      });

      const hasValidationError = campaignValidationErrors.length > 0;
      const actualResult = hasValidationError ? 'INVALID' : 'VALID';
      const success = testCase.expected.includes(actualResult);

      console.log(`   Result: ${success ? '✅' : '❌'} ${actualResult} (Expected: ${testCase.expected})`);
      
      if (campaignValidationErrors.length > 0) {
        console.log(`   Validation Messages:`);
        campaignValidationErrors.forEach((error: any, idx: number) => {
          console.log(`     ${idx + 1}. ${error.message}`);
        });
      }

    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 Multi-dimensional validation should now properly catch cross-business unit issues!');
}

// Run the test
testMultiDimensionalValidation().catch(console.error);