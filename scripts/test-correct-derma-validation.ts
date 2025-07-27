import fs from 'fs';
import path from 'path';
import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

// Test campaign validation with correct Derma category-range mapping
async function testCorrectDermaValidation() {
  console.log('🧪 Testing Derma campaign validation with CORRECT mappings...\n');

  // Load masterData manually
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));
  const validator = new MediaSufficiencyValidator(masterData);

  // Test cases with CORRECT category-range mappings for Derma
  const testCases = [
    // Valid campaigns that should pass - using correct categories
    { 
      category: 'Acne',  // Using Acne as category
      range: 'Acne',     // Using Acne as range  
      campaign: 'Dermopure Body (Bacne)', // Valid campaign for Acne
      businessUnit: 'Derma',
      expected: 'VALID' 
    },
    { 
      category: 'Acne', 
      range: 'Acne', 
      campaign: 'Triple Effect', // Valid campaign for Acne
      businessUnit: 'Derma',
      expected: 'VALID' 
    },
    { 
      category: 'Anti Pigment', 
      range: 'Anti Pigment', 
      campaign: 'Alice - Body', // Valid campaign for Anti Pigment
      businessUnit: 'Derma',
      expected: 'VALID' 
    },
    { 
      category: 'Sun', 
      range: 'Sun', 
      campaign: 'Sun Range', // Valid campaign for Sun
      businessUnit: 'Derma',
      expected: 'VALID' 
    },
    { 
      category: 'Anti Age', 
      range: 'Anti Age', 
      campaign: 'Golden Age (Gold Revamp)', // Valid campaign for Anti Age
      businessUnit: 'Derma',
      expected: 'VALID' 
    },

    // Invalid campaigns that should be flagged - wrong campaigns for the range
    { 
      category: 'Acne',
      range: 'Acne',
      campaign: 'Alice - Body', // This belongs to Anti Pigment, not Acne
      businessUnit: 'Derma',
      expected: 'INVALID' 
    },
    { 
      category: 'Anti Pigment',
      range: 'Anti Pigment',  
      campaign: 'Sun Range', // This belongs to Sun, not Anti Pigment
      businessUnit: 'Derma',
      expected: 'INVALID' 
    },
    { 
      category: 'Sun',
      range: 'Sun',
      campaign: 'Triple Effect', // This belongs to Acne, not Sun
      businessUnit: 'Derma',
      expected: 'INVALID' 
    },
    { 
      category: 'Anti Age',
      range: 'Anti Age',
      campaign: 'Totally Random Campaign', // Doesn't exist anywhere
      businessUnit: 'Derma',
      expected: 'INVALID' 
    }
  ];

  console.log('📋 Test Cases with Correct Category-Range Mappings:');
  console.log('Category/Range → Campaign | Expected | Result | Status');
  console.log('-'.repeat(65));

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    const testRecord = {
      'Category': testCase.category,
      'Range': testCase.range,
      'Campaign': testCase.campaign,
      'Business Unit': testCase.businessUnit,
      'Media Type': 'Digital',
      'Media Sub Type': 'Facebook',
      'Country': 'India',
      'Financial Cycle': 'ABP2025',
      'Quarter': 'Q1',
      'Budget': '100000'
    };

    try {
      const result = await validator.validateRecord(testRecord, 0, [testRecord]);
      
      // Check specifically for campaign-range validation errors
      const campaignRangeErrors = result.filter((issue: any) => 
        issue.field === 'Campaign' && 
        issue.message.includes('does not belong to range') ||
        issue.message.includes('Campaign') && issue.severity === 'critical'
      );

      const hasValidationErrors = campaignRangeErrors.length > 0;
      const actualResult = hasValidationErrors ? 'INVALID' : 'VALID';
      const testPassed = actualResult === testCase.expected;

      if (testPassed) passedTests++;

      const status = testPassed ? '✅ PASS' : '❌ FAIL';
      const categoryRange = `${testCase.category}/${testCase.range}`;
      const campaignName = testCase.campaign.length > 18 ? testCase.campaign.substring(0, 15) + '...' : testCase.campaign;
      
      console.log(`${categoryRange.padEnd(20)} → ${campaignName.padEnd(18)} | ${testCase.expected.padEnd(8)} | ${actualResult.padEnd(7)} | ${status}`);
      
      if (!testPassed) {
        console.log(`   Expected: ${testCase.expected}, Got: ${actualResult}`);
        if (hasValidationErrors) {
          console.log(`   Campaign-Range Errors: ${campaignRangeErrors.map((e: any) => e.message).join(', ')}`);
        }
        console.log(`   All Errors: ${result.map((e: any) => `${e.field}: ${e.message}`).join('; ')}`);
      }
    } catch (error: any) {
      console.log(`${testCase.category}/${testCase.range} → ${testCase.campaign}: ❌ ERROR - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(65));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Campaign-range validation is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Campaign-range validation needs fixing.');
    
    // Show what campaigns are available for each range
    console.log('\n📋 Available Campaigns by Range (from masterData.json):');
    const dermaRanges = ['Acne', 'Anti Pigment', 'Sun', 'Anti Age', 'Aquaphor', 'X-Cat', 'Dry Skin'];
    
    dermaRanges.forEach(range => {
      const campaigns = masterData.rangeToCampaigns[range] || [];
      console.log(`${range}: ${campaigns.length} campaigns`);
      if (campaigns.length > 0) {
        console.log(`  - ${campaigns.slice(0, 5).join(', ')}${campaigns.length > 5 ? '...' : ''}`);
      }
    });
  }
}

// Run the test
testCorrectDermaValidation().catch(console.error);