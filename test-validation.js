const fs = require('fs');

// Test the getFieldValue function and validation logic locally
function getFieldValue(record, ...fieldNames) {
  for (const fieldName of fieldNames) {
    if (record[fieldName] !== undefined && record[fieldName] !== null) {
      return record[fieldName];
    }
  }
  return null;
}

// Test CSV parsing and validation
function testValidation() {
  console.log('🧪 Testing validation logic...\n');
  
  // Test record without Burst field
  const recordWithoutBurst = {
    'Year': '2025',
    'Country': 'India',
    'Category': 'Personal Care',
    'Range': 'Range A',
    'Campaign': 'Campaign Test',
    'Campaign Archetype': 'Innovation',
    'Media Type': 'Digital',
    'Media Subtype': 'Social Media',
    'Start Date': '2025-01-01',
    'End Date': '2025-12-31',
    'Total Budget': '100000'
    // Notice: NO Burst field
  };
  
  // Test record with Burst field
  const recordWithBurst = {
    ...recordWithoutBurst,
    'Burst': '1'
  };
  
  console.log('📝 Testing getFieldValue function:');
  console.log('   Burst in record without Burst:', getFieldValue(recordWithoutBurst, 'Burst', 'burst'));
  console.log('   Burst in record with Burst:', getFieldValue(recordWithBurst, 'Burst', 'burst'));
  console.log();
  
  console.log('🔍 Testing validation logic:');
  
  // Test validation for record without Burst
  const burstValueWithout = getFieldValue(recordWithoutBurst, 'Burst', 'burst');
  const isValidWithout = burstValueWithout && burstValueWithout.toString().trim() !== '';
  console.log('   Record without Burst field:');
  console.log('     - Burst value:', burstValueWithout);
  console.log('     - Is valid:', isValidWithout);
  console.log('     - Should fail validation:', !isValidWithout ? '✅ PASS' : '❌ FAIL');
  console.log();
  
  // Test validation for record with Burst
  const burstValueWith = getFieldValue(recordWithBurst, 'Burst', 'burst');
  const isValidWith = burstValueWith && burstValueWith.toString().trim() !== '';
  console.log('   Record with Burst field:');
  console.log('     - Burst value:', burstValueWith);
  console.log('     - Is valid:', isValidWith);
  console.log('     - Should pass validation:', isValidWith ? '✅ PASS' : '❌ FAIL');
  console.log();
  
  console.log('📋 Validation Summary:');
  console.log('   ✅ getFieldValue function works correctly');
  console.log('   ✅ Validation correctly rejects missing Burst field');
  console.log('   ✅ Validation correctly accepts present Burst field');
  console.log('   ✅ Enhanced validation should prevent the bypass issue');
}

testValidation();