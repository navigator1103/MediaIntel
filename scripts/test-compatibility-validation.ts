import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';
import fs from 'fs';
import path from 'path';

async function testCompatibilityValidation() {
  console.log('🧪 Testing campaign compatibility validation...');

  // Load master data
  const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

  // Create validator
  const validator = new MediaSufficiencyValidator(masterData);

  // Test cases that should now be valid
  const testCases = [
    // Primary mapping (should work)
    { Campaign: 'Body Aloe Summer', Range: 'Milk', description: 'Primary mapping' },
    { Campaign: 'Body Milk 5 in 1', Range: 'Milk', description: 'Primary mapping' },
    
    // Compatibility mapping (should work with new system)
    { Campaign: 'Body Aloe Summer', Range: 'Aloe', description: 'Compatibility mapping' },
    { Campaign: 'Body Milk 5 in 1', Range: 'Luminous 630', description: 'Compatibility mapping' },
    
    // Other compatibility tests
    { Campaign: 'Q10 Body', Range: 'Q10', description: 'Q10 primary' },
    { Campaign: 'Q10 Body', Range: 'Body Lotion', description: 'Q10 compatibility' },
    { Campaign: 'UV Face', Range: 'UV Face', description: 'UV Face primary' },
    { Campaign: 'UV Face', Range: 'Sun', description: 'UV Face compatibility' },
    
    // Invalid case (should fail)
    { Campaign: 'Body Aloe Summer', Range: 'Deep', description: 'Invalid mapping' }
  ];

  console.log('\n🔍 Testing validation cases:');
  
  for (const testCase of testCases) {
    try {
      const issues = validator.validateRecord(testCase, 0, [testCase]);
      const campaignRangeErrors = issues.filter(issue => 
        issue.field === 'Campaign' && 
        issue.message.includes('does not match the specified Range')
      );
      
      const isValid = campaignRangeErrors.length === 0;
      const status = isValid ? '✅' : '❌';
      const expected = testCase.description === 'Invalid mapping' ? '❌' : '✅';
      const result = status === expected ? 'PASS' : 'FAIL';
      
      console.log(`${status} ${testCase.Campaign} → ${testCase.Range} (${testCase.description}) [${result}]`);
      
      if (campaignRangeErrors.length > 0) {
        campaignRangeErrors.forEach(error => {
          console.log(`     Error: ${error.message}`);
        });
      }
    } catch (error) {
      console.log(`❌ ${testCase.Campaign} → ${testCase.Range} (${testCase.description}) [ERROR]`);
      console.log(`     Exception: ${error}`);
    }
  }

  console.log('\n📊 Compatibility mappings loaded:');
  console.log(`Campaign compatibility map: ${Object.keys(masterData.campaignCompatibilityMap || {}).length} campaigns`);
  console.log(`Range compatible campaigns: ${Object.keys(masterData.rangeCompatibleCampaigns || {}).length} ranges`);
  
  console.log('\n🔍 Specific compatibility for Body Aloe Summer:');
  const bodyAloeCompatibility = masterData.campaignCompatibilityMap?.['Body Aloe Summer'];
  if (bodyAloeCompatibility) {
    console.log(`Body Aloe Summer → [${bodyAloeCompatibility.join(', ')}]`);
  } else {
    console.log('Body Aloe Summer → No compatibility mapping found');
  }

  console.log('\n🎯 Compatibility validation test complete!');
}

testCompatibilityValidation().catch(console.error);