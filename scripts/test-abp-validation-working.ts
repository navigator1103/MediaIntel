import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

async function testAbpValidationWorking() {
  console.log('🧪 Testing ABP Year Validation in Action');
  console.log('========================================\n');

  // Simple master data
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

  // Test record with ABP 2026 but 2025 date (should fail)
  const testRecord = {
    'Category': 'Hand Body',
    'Range': 'Soft',
    'Campaign': 'Soft Campaign',
    'Media': 'Traditional',
    'Media Subtype': 'Paid TV',
    'Initial Date': '2025-01-15',  // This should cause a critical error for ABP 2026
    'End Date': '2026-03-30',      // This should be OK for ABP 2026
    'Total Budget': '1000',
    'Country': 'India'
  };

  console.log('🔧 Creating validator with ABP 2026...');
  const validator = new MediaSufficiencyValidator(masterData, false, 'ABP 2026');
  console.log(`✅ ABP Year extracted: ${validator.getAbpYear()}`);

  console.log('\n📋 Test Record:');
  console.log(`   Initial Date: ${testRecord['Initial Date']} (should fail - wrong year)`);
  console.log(`   End Date: ${testRecord['End Date']} (should pass - correct year)`);

  console.log('\n🔍 Running validation...');
  const issues = await validator.validateAll([testRecord]);

  console.log(`\n📊 Found ${issues.length} total validation issues`);

  // Filter for ABP year issues specifically
  const abpIssues = issues.filter(issue => 
    issue.message.includes('match the selected ABP cycle') ||
    issue.message.includes('ABP cycle') ||
    issue.columnName === 'Initial Date' && issue.severity === 'critical' ||
    issue.columnName === 'End Date' && issue.severity === 'critical'
  );

  console.log(`\n🎯 ABP Year Validation Issues: ${abpIssues.length}`);
  
  if (abpIssues.length > 0) {
    abpIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.columnName}: ${issue.message}`);
    });
    console.log('\n✅ SUCCESS: ABP year validation is working! It caught the wrong year.');
  } else {
    console.log('\n❌ PROBLEM: ABP year validation did not catch the wrong year.');
    
    // Show all issues for debugging
    console.log('\nAll validation issues:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.columnName}: ${issue.message}`);
    });
  }

  // Test date parsing specifically
  console.log('\n🔧 Testing date parsing specifically:');
  const testDate = '2025-01-15';
  console.log(`   Input: "${testDate}"`);
  
  // Access parseDate through a validation call
  const parseResult = validator['parseDate'](testDate);
  if (parseResult) {
    console.log(`   Parsed: ${parseResult.toISOString()}`);
    console.log(`   Year: ${parseResult.getFullYear()}`);
    console.log(`   Matches ABP 2026: ${parseResult.getFullYear() === 2026 ? 'YES' : 'NO'}`);
  } else {
    console.log(`   ❌ Failed to parse date`);
  }
}

// Run the test
if (require.main === module) {
  testAbpValidationWorking().catch(console.error);
}

export { testAbpValidationWorking };