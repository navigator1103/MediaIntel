import fs from 'fs';
import path from 'path';
import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

// Test the specific issue: Disney campaign in Acne range should be flagged
async function testDisneyCampaignValidation() {
  console.log('🧪 Testing Disney campaign validation issue...\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Test both auto-create mode and normal mode
  const testModes = [
    { autoCreateMode: false, name: 'Normal Mode' },
    { autoCreateMode: true, name: 'Auto-Create Mode' }
  ];

  for (const testMode of testModes) {
    console.log(`📋 Testing ${testMode.name}:`);
    
    const validator = new MediaSufficiencyValidator(masterData, testMode.autoCreateMode);

    // Test case: Disney campaign in Acne range (should be invalid)
    const testRecord = {
      'Category': 'Acne',
      'Range': 'Acne', 
      'Campaign': 'Disney', // This belongs to "Deep" range (Nivea), not Acne (Derma)
      'Business Unit': 'Derma',
      'Media Type': 'Digital',
      'Media Sub Type': 'Facebook',
      'Country': 'India',
      'Financial Cycle': 'ABP2025',
      'Quarter': 'Q1',
      'Budget': '100000'
    };

    try {
      const result = await validator.validateRecord(testRecord, 0, [testRecord]);
      
      // Debug: log ALL validation results to understand the structure
      console.log(`  🔍 All validation results (${result.length} total):`);
      result.forEach((issue: any, index: number) => {
        console.log(`    ${index + 1}. Field: "${issue.field}" | Message: "${issue.message}" | Severity: ${issue.severity}`);
      });
      
      // Look for campaign validation errors - check message content (field might be undefined)
      const campaignErrors = result.filter((issue: any) => {
        const messageContent = issue.message.toLowerCase();
        const isValidationFailure = 
          messageContent.includes("campaign 'disney' does not belong to range 'acne'") ||
          messageContent.includes('does not belong to range') ||
          messageContent.includes('not valid for range') ||
          messageContent.includes('valid campaigns for this range');
        
        return isValidationFailure;
      });

      console.log(`  Campaign: ${testRecord.Campaign}`);
      console.log(`  Range: ${testRecord.Range}`);
      console.log(`  Validation Result: ${campaignErrors.length > 0 ? '❌ INVALID (correctly flagged)' : '✅ VALID (incorrectly passed)'}`);
      
      if (campaignErrors.length > 0) {
        console.log(`  Error Message: ${campaignErrors[0].message}`);
        console.log(`  ✅ SUCCESS: Campaign validation is working in ${testMode.name}`);
      } else {
        console.log(`  ❌ PROBLEM: Campaign validation failed in ${testMode.name}`);
        console.log(`  Expected: Disney should be flagged as invalid for Acne range`);
      }
      
    } catch (error: any) {
      console.log(`  ❌ ERROR: ${error.message}`);
    }
    
    console.log();
  }

  // Show what campaigns ARE valid for Acne range
  const acneCampaigns = masterData.rangeToCampaigns['Acne'] || [];
  console.log('📋 Valid campaigns for Acne range:');
  acneCampaigns.forEach((campaign: string, index: number) => {
    console.log(`  ${index + 1}. ${campaign}`);
  });

  // Show where Disney actually belongs
  const disneyCampaignRange = masterData.campaignToRangeMap?.['Disney'];
  console.log(`\n📍 Disney campaign actually belongs to: "${disneyCampaignRange || 'Unknown'}" range`);
}

// Run the test
testDisneyCampaignValidation().catch(console.error);