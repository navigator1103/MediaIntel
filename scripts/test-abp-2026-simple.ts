import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

async function testAbp2026() {
  console.log('🧪 Testing ABP 2026 Year Validation');
  console.log('==================================\n');

  // Simple master data for testing
  const masterData = {
    countries: ['India'],
    categories: ['Hand Body'],
    ranges: ['Soft'],
    campaigns: ['Soft Campaign'],
    mediaTypes: ['Traditional'],
    mediaSubTypes: ['Paid TV'],
    mediaToSubtypes: { 'Traditional': ['Paid TV'] },
    categoryToRanges: { 'Hand Body': ['Soft'] },
    rangeToCategories: { 'Soft': ['Hand Body'] },
    campaignToRangeMap: { 'Soft Campaign': 'Soft' }
  };

  const testCases = [
    {
      name: '✅ ABP 2026 with 2026 dates (should pass)',
      abpCycle: 'ABP 2026',
      record: {
        'Initial Date': '2026-01-15',
        'End Date': '2026-03-30'
      }
    },
    {
      name: '❌ ABP 2026 with 2025 dates (should fail)',
      abpCycle: 'ABP 2026',  
      record: {
        'Initial Date': '2025-01-15',
        'End Date': '2025-03-30'
      }
    },
    {
      name: '❌ ABP 2026 with mixed years (should fail)',
      abpCycle: 'ABP 2026',
      record: {
        'Initial Date': '2025-12-15',
        'End Date': '2026-02-28'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log(`   ABP Cycle: ${testCase.abpCycle}`);
    console.log(`   Initial Date: ${testCase.record['Initial Date']}`);
    console.log(`   End Date: ${testCase.record['End Date']}`);

    // Create validator with ABP 2026
    const validator = new MediaSufficiencyValidator(masterData, false, testCase.abpCycle);
    
    // Test the ABP year extraction
    const abpYear = validator.getAbpYear();
    console.log(`   ABP Year extracted: ${abpYear || 'none'}`);
    
    // Test individual date validation
    try {
      // Check if dates would pass ABP year validation
      const initialDate = new Date(testCase.record['Initial Date']);
      const endDate = new Date(testCase.record['End Date']);
      
      const initialYearMatch = initialDate.getFullYear() === abpYear;
      const endYearMatch = endDate.getFullYear() === abpYear;
      
      console.log(`   Initial Date year ${initialDate.getFullYear()} matches ABP year ${abpYear}: ${initialYearMatch ? '✅' : '❌'}`);
      console.log(`   End Date year ${endDate.getFullYear()} matches ABP year ${abpYear}: ${endYearMatch ? '✅' : '❌'}`);
      
      if (initialYearMatch && endYearMatch) {
        console.log(`   Result: ✅ PASS - All dates match ABP ${abpYear}`);
      } else {
        console.log(`   Result: ❌ FAIL - Date year mismatch detected`);
      }
      
    } catch (error) {
      console.log(`   Error: ${error instanceof Error ? error.message : error}`);
    }
    
    console.log('');
  }

  console.log('✅ ABP 2026 Test Complete!');
}

// Run the test
if (require.main === module) {
  testAbp2026().catch(console.error);
}

export { testAbp2026 };