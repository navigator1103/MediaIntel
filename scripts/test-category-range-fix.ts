// Test category-range validation fix
const categoryRangeTestCases = [
  // Self-referential cases that were failing
  { Category: "Men", Range: "Men", expected: true, description: "Men category with Men range" },
  { Category: "Sun", Range: "Sun", expected: true, description: "Sun category with Sun range" },
  
  // Other valid combinations for these categories
  { Category: "Men", Range: "Deep", expected: true, description: "Men category with Deep range" },
  { Category: "Men", Range: "Sensitive", expected: true, description: "Men category with Sensitive range" },
  { Category: "Sun", Range: "UV Face", expected: true, description: "Sun category with UV Face range" },
  
  // Invalid combinations (should fail)
  { Category: "Men", Range: "Luminous 630", expected: false, description: "Men category with invalid range" },
  { Category: "Sun", Range: "Acne", expected: false, description: "Sun category with invalid range" },
  
  // Other self-referential cases
  { Category: "Acne", Range: "Acne", expected: true, description: "Acne category with Acne range" },
];

async function testCategoryRangeValidation() {
  console.log('🧪 Testing category-range validation fix...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/master-data');
    const masterData = await response.json();
    
    console.log('\n📊 Testing category-range combinations:');
    
    let passCount = 0;
    let failCount = 0;
    
    for (const testCase of categoryRangeTestCases) {
      // Simulate the validation logic
      const category = testCase.Category.toString().trim();
      const range = testCase.Range.toString().trim();
      
      let isValid = false;
      
      if (masterData?.categoryToRanges) {
        // Find the category in a case-insensitive way
        const categoryKey = Object.keys(masterData.categoryToRanges).find(
          key => key.toLowerCase() === category.toLowerCase()
        );
        
        // Get valid ranges for this category
        const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] || [] : [];
        
        // Check if range is valid for category
        isValid = validRanges.some((m: string) => 
          m.toLowerCase() === range.toLowerCase()
        );
      }
      
      const status = isValid ? '✅' : '❌';
      const result = isValid === testCase.expected ? 'PASS' : 'FAIL';
      
      console.log(`${status} ${testCase.description} - ${result}`);
      
      if (isValid === testCase.expected) {
        passCount++;
      } else {
        failCount++;
        console.log(`     Expected: ${testCase.expected}, Got: ${isValid}`);
        if (!isValid && testCase.expected) {
          const categoryKey = Object.keys(masterData.categoryToRanges).find(
            key => key.toLowerCase() === category.toLowerCase()
          );
          const validRanges = categoryKey ? masterData.categoryToRanges[categoryKey] : [];
          console.log(`     Valid ranges for ${category}: [${validRanges.join(', ')}]`);
        }
      }
    }
    
    console.log(`\n📈 Results: ${passCount}/${categoryRangeTestCases.length} tests passed`);
    
    if (failCount === 0) {
      console.log('🎯 All category-range validation tests passed!');
      console.log('✅ Men/Men and Sun/Sun combinations should now work correctly.');
    } else {
      console.log(`⚠️  ${failCount} tests failed - validation logic may need more work.`);
    }
    
  } catch (error) {
    console.error('❌ Error testing category-range validation:', error);
  }
}

testCategoryRangeValidation();