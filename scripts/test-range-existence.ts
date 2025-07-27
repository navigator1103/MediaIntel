import fs from 'fs';
import path from 'path';

async function testRangeExistence() {
  console.log('🔍 Testing Range Existence Logic\n');
  
  // Load master data
  const masterDataPath = path.join(process.cwd(), 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));
  
  // Test ranges from the Singapore file
  const testRanges = ['Anti Age', 'Anti Pigment', 'Black & White'];
  
  console.log('Available ranges in master data:');
  console.log(masterData.ranges.slice(0, 20)); // First 20 ranges
  console.log('...');
  console.log(`Total ranges: ${masterData.ranges.length}`);
  console.log('');
  
  console.log('Testing range existence:');
  testRanges.forEach(range => {
    // Test exact match
    const exactMatch = masterData.ranges.includes(range);
    
    // Test case-insensitive match (like the validator does)
    const caseInsensitiveMatch = masterData.ranges.some((r: string) => r.toLowerCase() === range.toLowerCase());
    
    console.log(`Range "${range}":`);
    console.log(`  Exact match: ${exactMatch ? '✅' : '❌'}`);
    console.log(`  Case-insensitive match: ${caseInsensitiveMatch ? '✅' : '❌'}`);
    
    if (caseInsensitiveMatch) {
      const actualRange = masterData.ranges.find((r: string) => r.toLowerCase() === range.toLowerCase());
      console.log(`  Actual value in DB: "${actualRange}"`);
    }
    console.log('');
  });
}

testRangeExistence().catch(console.error);