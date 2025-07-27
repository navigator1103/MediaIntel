import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

// Debug what campaign rules exist
async function debugCampaignRules() {
  console.log('🔍 Debugging Campaign Validation Rules\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  const validator = new AutoCreateValidator(masterData);
  
  // Access the rules property to see what campaign rules exist
  const campaignRules = (validator as any).rules.filter((rule: any) => rule.field === 'Campaign');
  
  console.log(`Found ${campaignRules.length} Campaign validation rules:`);
  campaignRules.forEach((rule: any, idx: number) => {
    console.log(`\n${idx + 1}. Field: ${rule.field}`);
    console.log(`   Type: ${rule.type}`);
    console.log(`   Severity: ${rule.severity}`);
    console.log(`   Message: ${rule.message}`);
    console.log(`   Has validate function: ${typeof rule.validate === 'function'}`);
  });

  // Test the campaign validation directly
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing Campaign Validation Directly');
  
  const testRecord = {
    'Business Unit': 'Derma',
    'Category': 'Acne', 
    'Range': 'Acne',
    'Campaign': 'Disney',
    'Media Type': 'Digital',
    'Media Sub Type': 'Facebook',
    'Country': 'India',
    'Financial Cycle': 'ABP2025',
    'Quarter': 'Q1',
    'Budget': '100000'
  };

  console.log(`\nTesting record: Disney (Nivea campaign) in Derma context`);
  
  for (let i = 0; i < campaignRules.length; i++) {
    const rule = campaignRules[i];
    console.log(`\n--- Testing Rule ${i + 1} ---`);
    console.log(`Message: ${rule.message}`);
    
    try {
      const result = await rule.validate('Disney', testRecord, [testRecord], masterData);
      console.log(`Result: ${JSON.stringify(result)}`);
      
      if (typeof result === 'object' && result !== null && !result.isValid) {
        console.log(`❌ VALIDATION FAILED: ${result.message}`);
        if (result.severity) {
          console.log(`Severity: ${result.severity}`);
        } else {
          console.log(`Default Severity: ${rule.severity}`);
        }
      } else if (result === true) {
        console.log(`✅ VALIDATION PASSED`);
      } else {
        console.log(`⚠️  VALIDATION RETURNED: ${result}`);
      }
    } catch (error: any) {
      console.log(`❌ ERROR: ${error.message}`);
    }
  }

  await validator.disconnect();
}

// Run the debug
debugCampaignRules().catch(console.error);