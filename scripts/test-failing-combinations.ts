// Test the specific failing combinations mentioned by the user
const failingTestCases = [
  // Face Care category combinations
  { category: "Face Care", range: "Cellular", campaign: "Genes", description: "Face Care/Cellular/Genes" },
  
  // Q10 category combinations (now should work)
  { category: "Q10", range: "Q10", campaign: "Q10 Skin Diet", description: "Q10/Q10/Q10 Skin Diet" },
  
  // UV Face category combinations (now should work)  
  { category: "UV Face", range: "UV Face", campaign: "UV Face", description: "UV Face/UV Face/UV Face" },
  
  // Other mentioned case
  { category: "Anti Pigment", range: "Anti Pigment", campaign: "Thiamidol Roof", description: "Anti Pigment/Anti Pigment/Thiamidol Roof" }
];

async function testFailingCombinations() {
  console.log('🧪 Testing previously failing category/range/campaign combinations...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/master-data');
    const masterData = await response.json();
    
    console.log('\n📊 Testing combinations:');
    
    let passCount = 0;
    let failCount = 0;
    
    for (const testCase of failingTestCases) {
      let issues = [];
      
      // 1. Check if category exists
      const categoryExists = masterData.categories?.includes(testCase.category);
      if (!categoryExists) {
        issues.push(`Category '${testCase.category}' doesn't exist`);
      }
      
      // 2. Check if range exists  
      const rangeExists = masterData.ranges?.includes(testCase.range);
      if (!rangeExists) {
        issues.push(`Range '${testCase.range}' doesn't exist`);
      }
      
      // 3. Check if campaign exists
      const campaignExists = masterData.campaigns?.includes(testCase.campaign);
      if (!campaignExists) {
        issues.push(`Campaign '${testCase.campaign}' doesn't exist`);
      }
      
      // 4. Check category-range mapping
      let categoryRangeValid = false;
      if (masterData?.categoryToRanges) {
        const categoryKey = Object.keys(masterData.categoryToRanges).find(
          key => key.toLowerCase() === testCase.category.toLowerCase()
        );
        const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] || [] : [];
        categoryRangeValid = validRanges.some((r: string) => 
          r.toLowerCase() === testCase.range.toLowerCase()
        );
      }
      if (!categoryRangeValid) {
        issues.push(`Range '${testCase.range}' not valid for category '${testCase.category}'`);
      }
      
      // 5. Check campaign-range mapping
      let campaignRangeValid = false;
      const primaryMapping = masterData.campaignToRangeMap?.[testCase.campaign];
      if (primaryMapping?.toLowerCase() === testCase.range.toLowerCase()) {
        campaignRangeValid = true;
      } else if (masterData.campaignCompatibilityMap?.[testCase.campaign]) {
        const compatibleRanges = masterData.campaignCompatibilityMap[testCase.campaign];
        campaignRangeValid = compatibleRanges.some((r: string) => 
          r.toLowerCase() === testCase.range.toLowerCase()
        );
      }
      if (!campaignRangeValid) {
        issues.push(`Campaign '${testCase.campaign}' not valid for range '${testCase.range}'`);
      }
      
      const status = issues.length === 0 ? '✅' : '❌';
      console.log(`${status} ${testCase.description}`);
      
      if (issues.length === 0) {
        passCount++;
      } else {
        failCount++;
        issues.forEach(issue => console.log(`     ${issue}`));
      }
    }
    
    console.log(`\n📈 Results: ${passCount}/${failingTestCases.length} combinations now valid`);
    
    if (failCount === 0) {
      console.log('🎯 All previously failing combinations are now resolved!');
    } else {
      console.log(`⚠️  ${failCount} combinations still need attention.`);
    }
    
  } catch (error) {
    console.error('❌ Error testing combinations:', error);
  }
}

testFailingCombinations();