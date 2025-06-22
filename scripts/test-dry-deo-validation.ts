// Test the specific Deo/Dry Deo/Dry Deo combination
async function testDryDeoValidation() {
  console.log('🧪 Testing Deo/Dry Deo/Dry Deo validation...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/master-data');
    const masterData = await response.json();
    
    const testCase = {
      Category: "Deo",
      Range: "Dry Deo", 
      Campaign: "Dry Deo"
    };
    
    console.log(`\n📊 Testing: Category="${testCase.Category}" + Range="${testCase.Range}" + Campaign="${testCase.Campaign}"`);
    
    let issues = [];
    
    // 1. Check if category exists
    const categoryExists = masterData.categories?.includes(testCase.Category);
    console.log(`✅ Category '${testCase.Category}' exists: ${categoryExists}`);
    if (!categoryExists) {
      issues.push('Category missing');
    }
    
    // 2. Check if range exists  
    const rangeExists = masterData.ranges?.includes(testCase.Range);
    console.log(`✅ Range '${testCase.Range}' exists: ${rangeExists}`);
    if (!rangeExists) {
      issues.push('Range missing');
    }
    
    // 3. Check if campaign exists
    const campaignExists = masterData.campaigns?.includes(testCase.Campaign);
    console.log(`✅ Campaign '${testCase.Campaign}' exists: ${campaignExists}`);
    if (!campaignExists) {
      issues.push('Campaign missing');
    }
    
    // 4. Check category-range mapping
    let categoryRangeValid = false;
    if (masterData?.categoryToRanges) {
      const categoryKey = Object.keys(masterData.categoryToRanges).find(
        key => key.toLowerCase() === testCase.Category.toLowerCase()
      );
      const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] || [] : [];
      categoryRangeValid = validRanges.some((r: string) => 
        r.toLowerCase() === testCase.Range.toLowerCase()
      );
    }
    console.log(`✅ Category-Range mapping valid: ${categoryRangeValid}`);
    if (!categoryRangeValid) {
      issues.push('Category-Range mapping invalid');
    }
    
    // 5. Check campaign-range mapping
    let campaignRangeValid = false;
    const primaryMapping = masterData.campaignToRangeMap?.[testCase.Campaign];
    if (primaryMapping?.toLowerCase() === testCase.Range.toLowerCase()) {
      campaignRangeValid = true;
    } else if (masterData.campaignCompatibilityMap?.[testCase.Campaign]) {
      const compatibleRanges = masterData.campaignCompatibilityMap[testCase.Campaign];
      campaignRangeValid = compatibleRanges.some((r: string) => 
        r.toLowerCase() === testCase.Range.toLowerCase()
      );
    }
    console.log(`✅ Campaign-Range mapping valid: ${campaignRangeValid}`);
    if (!campaignRangeValid) {
      issues.push('Campaign-Range mapping invalid');
    }
    
    // Overall result
    const overallValid = issues.length === 0;
    console.log(`\n🎯 Overall validation result: ${overallValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (issues.length > 0) {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('🎉 Deo/Dry Deo/Dry Deo combination should now validate successfully!');
    }
    
    // Show supporting data
    console.log('\n📋 Supporting data:');
    if (masterData.categoryToRanges?.Deo) {
      console.log(`Deo category includes ranges: [${masterData.categoryToRanges.Deo.join(', ')}]`);
    }
    if (masterData.rangeToCampaignsMap?.['Dry Deo']) {
      console.log(`Dry Deo range includes campaigns: [${masterData.rangeToCampaignsMap['Dry Deo'].join(', ')}]`);
    }
    
  } catch (error) {
    console.error('❌ Error testing Dry Deo validation:', error);
  }
}

testDryDeoValidation();