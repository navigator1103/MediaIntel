import fs from 'fs';
import path from 'path';
import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

// Debug why campaign-to-range mapping might be breaking
async function debugMappingIssues() {
  console.log('🕵️ Debugging campaign-to-range mapping issues...\n');

  // Load masterData manually to avoid import issues
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // 1. Check if rangeToCampaigns exists and is properly structured
  console.log('1️⃣ Checking rangeToCampaigns structure:');
  const rangeToCampaigns = masterData.rangeToCampaigns;
  
  if (!rangeToCampaigns) {
    console.log('❌ rangeToCampaigns is missing from masterData.json');
    return;
  }
  
  console.log(`✅ rangeToCampaigns exists with ${Object.keys(rangeToCampaigns).length} ranges`);
  
  // 2. Check Derma ranges specifically
  console.log('\n2️⃣ Checking Derma ranges:');
  const dermaRanges = ['Acne', 'Anti Pigment', 'Sun', 'Anti Age', 'Aquaphor', 'X-Cat', 'Dry Skin'];
  
  dermaRanges.forEach(range => {
    const campaigns = rangeToCampaigns[range];
    if (campaigns && Array.isArray(campaigns)) {
      console.log(`✅ ${range}: ${campaigns.length} campaigns`);
      console.log(`   First few: ${campaigns.slice(0, 3).join(', ')}`);
    } else {
      console.log(`❌ ${range}: Missing from rangeToCampaigns`);
    }
  });
  
  // 3. Check for case sensitivity issues
  console.log('\n3️⃣ Checking for case sensitivity issues:');
  const allRangeKeys = Object.keys(rangeToCampaigns);
  const caseVariations: Record<string, string[]> = {};
  
  allRangeKeys.forEach(key => {
    const lowerKey = key.toLowerCase();
    if (!caseVariations[lowerKey]) {
      caseVariations[lowerKey] = [];
    }
    caseVariations[lowerKey].push(key);
  });
  
  Object.entries(caseVariations).forEach(([lowerKey, variations]) => {
    if (variations.length > 1) {
      console.log(`⚠️  Case variations found for "${lowerKey}": ${variations.join(', ')}`);
    }
  });
  
  // 4. Test validation with some known campaigns
  console.log('\n4️⃣ Testing validation with known campaigns:');
  const validator = new MediaSufficiencyValidator(masterData);
  
  const testCases = [
    { range: 'Acne', campaign: 'Dermopure Body (Bacne)', businessUnit: 'Derma', category: 'Face Care' },
    { range: 'Anti Pigment', campaign: 'Alice - Body', businessUnit: 'Derma', category: 'Face Care' },
    { range: 'Sun', campaign: 'Sun Range', businessUnit: 'Derma', category: 'Face Care' },
    { range: 'Anti Age', campaign: 'Golden Age (Gold Revamp)', businessUnit: 'Derma', category: 'Face Care' }
  ];
  
  for (const testCase of testCases) {
    const testRecord = {
      'Range': testCase.range,
      'Campaign': testCase.campaign,
      'Business Unit': testCase.businessUnit,
      'Category': testCase.category,
      'Media Type': 'Digital',
      'Media Sub Type': 'Facebook',
      'Country': 'India',
      'Financial Cycle': 'ABP2025',
      'Quarter': 'Q1',
      'Budget': '100000'
    };
    
    try {
      const result = await validator.validateRecord(testRecord, 0, [testRecord]);
      const campaignErrors = result.filter((issue: any) => issue.field === 'Campaign');
      const status = campaignErrors.length === 0 ? '✅ VALID' : '❌ INVALID';
      
      console.log(`${testCase.range} → ${testCase.campaign}: ${status}`);
      
      if (campaignErrors.length > 0) {
        console.log(`   Errors: ${campaignErrors.map((e: any) => e.message).join(', ')}`);
      }
    } catch (error: any) {
      console.log(`${testCase.range} → ${testCase.campaign}: ❌ ERROR - ${error.message}`);
    }
  }
  
  // 5. Check other mappings that might interfere
  console.log('\n5️⃣ Checking other mapping structures:');
  const otherMappings = [
    'rangeToCampaignsMap',
    'campaignToRangeMap', 
    'campaignCompatibilityMap',
    'categoryToRanges',
    'rangeToCategories'
  ];
  
  otherMappings.forEach(mapping => {
    if (masterData[mapping]) {
      console.log(`✅ ${mapping}: ${Object.keys(masterData[mapping]).length} entries`);
    } else {
      console.log(`❌ ${mapping}: Missing`);
    }
  });
  
  console.log('\n🏁 Debug analysis complete!');
}

// Run the debug
debugMappingIssues().catch(console.error);