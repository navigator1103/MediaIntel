// Test the specific problematic combinations mentioned by the user
const problematicCases = [
  // Anti Age range with Epigenetics (should now work due to compatibility)
  { range: "Anti Age", campaign: "Epigenetics", expected: "✅ Should work now" },
  
  // Brand (Institutional) range with various campaigns
  { range: "Brand (Institutional)", campaign: "Brand (Institutional)", expected: "✅ Primary mapping" },
  { range: "Brand (Institutional)", campaign: "Search AWON", expected: "✅ Should work with compatibility" },
  
  // Men range with various campaigns (should now work since we added campaigns)
  { range: "Men", campaign: "Deep", expected: "✅ Should work now" },
  { range: "Men", campaign: "Extra Bright", expected: "✅ Should work now" },
  { range: "Men", campaign: "Sensitive Cleansing", expected: "✅ Should work now" },
  
  // Test some compatibility mappings
  { range: "Face Care", campaign: "Epigenetics", expected: "✅ Compatibility mapping" },
  { range: "X-Cat", campaign: "Search AWON", expected: "✅ Compatibility mapping" },
  { range: "Deo", campaign: "Deep", expected: "✅ Compatibility mapping" }
];

async function testProblematicCombinations() {
  console.log('🧪 Testing problematic range-campaign combinations...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/master-data');
    const masterData = await response.json();
    
    console.log('\n📊 Testing combinations:');
    
    for (const testCase of problematicCases) {
      // Check primary mapping
      const primaryMapping = masterData.campaignToRangeMap[testCase.campaign];
      let isValid = primaryMapping === testCase.range;
      
      // If primary mapping doesn't match, check compatibility
      if (!isValid && masterData.campaignCompatibilityMap[testCase.campaign]) {
        const compatibleRanges = masterData.campaignCompatibilityMap[testCase.campaign];
        isValid = compatibleRanges.includes(testCase.range);
      }
      
      // If still not valid, check if campaign is in range's campaign list
      if (!isValid && masterData.rangeToCampaignsMap[testCase.range]) {
        const campaignsInRange = masterData.rangeToCampaignsMap[testCase.range];
        isValid = campaignsInRange.includes(testCase.campaign);
      }
      
      const status = isValid ? '✅' : '❌';
      const mappingType = primaryMapping === testCase.range ? 'Primary' : 
                         masterData.campaignCompatibilityMap[testCase.campaign]?.includes(testCase.range) ? 'Compatibility' : 
                         'Range List';
      
      console.log(`${status} Range: "${testCase.range}" + Campaign: "${testCase.campaign}" (${mappingType})`);
      
      if (!isValid) {
        console.log(`     Primary: ${primaryMapping || 'None'}`);
        console.log(`     Compatible: ${masterData.campaignCompatibilityMap[testCase.campaign] || 'None'}`);
      }
    }
    
    const successCount = problematicCases.filter(testCase => {
      const primaryMapping = masterData.campaignToRangeMap[testCase.campaign];
      let isValid = primaryMapping === testCase.range;
      
      if (!isValid && masterData.campaignCompatibilityMap[testCase.campaign]) {
        const compatibleRanges = masterData.campaignCompatibilityMap[testCase.campaign];
        isValid = compatibleRanges.includes(testCase.range);
      }
      
      if (!isValid && masterData.rangeToCampaignsMap[testCase.range]) {
        const campaignsInRange = masterData.rangeToCampaignsMap[testCase.range];
        isValid = campaignsInRange.includes(testCase.campaign);
      }
      
      return isValid;
    }).length;
    
    console.log(`\n📈 Results: ${successCount}/${problematicCases.length} combinations now valid`);
    
    if (successCount === problematicCases.length) {
      console.log('🎯 All problematic combinations are now resolved!');
    } else {
      console.log('⚠️  Some combinations still need attention.');
    }
    
  } catch (error) {
    console.error('❌ Error testing combinations:', error);
  }
}

testProblematicCombinations();