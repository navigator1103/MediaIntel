// Test Lip and Dry Deo range validations
async function testLipAndDryDeo() {
  console.log('🧪 Testing Lip and Dry Deo range validations...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/master-data');
    const masterData = await response.json();
    
    // Test cases that should work
    const validCases = [
      { category: "Lip", range: "Lip", description: "Lip category with Lip range" },
      { category: "Deo", range: "Dry Deo", description: "Deo category with Dry Deo range" }
    ];
    
    // Test cases that might be causing errors (common mistakes)
    const potentialIssues = [
      { category: "Dry Deo", range: "Dry Deo", description: "Dry Deo category with Dry Deo range (if this exists)" },
      { category: "Face Care", range: "Lip", description: "Face Care category with Lip range" },
      { category: "Men", range: "Dry Deo", description: "Men category with Dry Deo range" },
      { category: "Hand Body", range: "Lip", description: "Hand Body category with Lip range" }
    ];
    
    console.log('\n✅ Testing valid combinations:');
    
    for (const testCase of validCases) {
      let isValid = false;
      
      if (masterData?.categoryToRanges) {
        const categoryKey = Object.keys(masterData.categoryToRanges).find(
          key => key.toLowerCase() === testCase.category.toLowerCase()
        );
        const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] || [] : [];
        isValid = validRanges.some((r: string) => 
          r.toLowerCase() === testCase.range.toLowerCase()
        );
      }
      
      const status = isValid ? '✅' : '❌';
      console.log(`${status} ${testCase.description}`);
    }
    
    console.log('\n⚠️  Testing potential problem combinations:');
    
    for (const testCase of potentialIssues) {
      let isValid = false;
      
      // Check if category exists
      const categoryExists = masterData.categories?.includes(testCase.category);
      
      if (categoryExists && masterData?.categoryToRanges) {
        const categoryKey = Object.keys(masterData.categoryToRanges).find(
          key => key.toLowerCase() === testCase.category.toLowerCase()
        );
        const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] || [] : [];
        isValid = validRanges.some((r: string) => 
          r.toLowerCase() === testCase.range.toLowerCase()
        );
      }
      
      const status = isValid ? '✅' : '❌';
      const categoryStatus = categoryExists ? '' : ' (Category doesn\'t exist)';
      console.log(`${status} ${testCase.description}${categoryStatus}`);
    }
    
    // Show what categories currently include these ranges
    console.log('\n📊 Current category mappings:');
    console.log('Categories that include "Dry Deo" range:');
    Object.entries(masterData.categoryToRanges).forEach(([category, ranges]) => {
      if ((ranges as string[]).some(r => r.toLowerCase() === 'dry deo')) {
        console.log(`  - ${category}`);
      }
    });
    
    console.log('Categories that include "Lip" range:');
    Object.entries(masterData.categoryToRanges).forEach(([category, ranges]) => {
      if ((ranges as string[]).some(r => r.toLowerCase() === 'lip')) {
        console.log(`  - ${category}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing Lip and Dry Deo:', error);
  }
}

testLipAndDryDeo();