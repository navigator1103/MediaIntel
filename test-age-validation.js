// Test script for age validation with '+' symbol
const testCases = [
  {
    name: "Valid: Normal age range",
    data: {
      'TV Demo Min. Age': '25',
      'TV Demo Max. Age': '54'
    },
    expected: 'valid'
  },
  {
    name: "Valid: Open-ended age range with +",
    data: {
      'TV Demo Min. Age': '55',
      'TV Demo Max. Age': '+'
    },
    expected: 'valid'
  },
  {
    name: "Valid: Young adult with +",
    data: {
      'TV Demo Min. Age': '18',
      'TV Demo Max. Age': '+'
    },
    expected: 'valid'
  },
  {
    name: "Invalid: Min >= Max (both numbers)",
    data: {
      'TV Demo Min. Age': '55',
      'TV Demo Max. Age': '34'
    },
    expected: 'invalid'
  },
  {
    name: "Invalid: Min age with + symbol",
    data: {
      'TV Demo Min. Age': '+',
      'TV Demo Max. Age': '65'
    },
    expected: 'invalid'
  },
  {
    name: "Valid: Digital matching TV with +",
    data: {
      'Is Digital target the same than TV?': 'Yes',
      'TV Demo Min. Age': '25',
      'TV Demo Max. Age': '+',
      'Digital Demo Min. Age': '25',
      'Digital Demo Max. Age': '+'
    },
    expected: 'valid'
  },
  {
    name: "Invalid: Digital not matching TV with +",
    data: {
      'Is Digital target the same than TV?': 'Yes',
      'TV Demo Min. Age': '25',
      'TV Demo Max. Age': '+',
      'Digital Demo Min. Age': '25',
      'Digital Demo Max. Age': '65'
    },
    expected: 'invalid'
  }
];

// Helper functions from the validation code
function isValidAge(value, isMaxAge = false) {
  if (!value || value === '') return true;
  
  if (isMaxAge && value.toString().trim() === '+') {
    return true;
  }
  
  const numValue = parseFloat(value.toString().replace(/,/g, ''));
  return !isNaN(numValue) && isFinite(numValue) && numValue >= 0;
}

function parseAge(value) {
  if (value === '+' || value === '+') return '+';
  return parseFloat(value.toString().replace(/,/g, ''));
}

// Run tests
console.log('🧪 Testing Age Validation with + Symbol\n');
console.log('=' .repeat(50));

testCases.forEach(test => {
  console.log(`\nTest: ${test.name}`);
  console.log('Data:', JSON.stringify(test.data, null, 2));
  
  const issues = [];
  
  // Test min/max age validation
  const tvMinAge = test.data['TV Demo Min. Age'];
  const tvMaxAge = test.data['TV Demo Max. Age'];
  
  if (tvMinAge) {
    if (!isValidAge(tvMinAge, false)) {
      issues.push('TV Min Age is invalid');
    }
  }
  
  if (tvMaxAge) {
    if (!isValidAge(tvMaxAge, true)) {
      issues.push('TV Max Age is invalid');
    }
  }
  
  // Test age comparison
  if (tvMinAge && tvMaxAge && isValidAge(tvMinAge, false) && isValidAge(tvMaxAge, true)) {
    const minAge = parseAge(tvMinAge);
    const maxAge = parseAge(tvMaxAge);
    
    if (typeof minAge === 'number' && typeof maxAge === 'number' && minAge >= maxAge) {
      issues.push('Max age must be greater than min age');
    }
  }
  
  // Test digital/TV matching
  if (test.data['Is Digital target the same than TV?'] === 'Yes') {
    const digitalMinAge = test.data['Digital Demo Min. Age'];
    const digitalMaxAge = test.data['Digital Demo Max. Age'];
    
    if (tvMinAge && digitalMinAge && tvMinAge.toString().trim() !== digitalMinAge.toString().trim()) {
      issues.push('Digital Min Age must match TV Min Age');
    }
    
    if (tvMaxAge && digitalMaxAge && tvMaxAge.toString().trim() !== digitalMaxAge.toString().trim()) {
      issues.push('Digital Max Age must match TV Max Age');
    }
  }
  
  const result = issues.length === 0 ? 'valid' : 'invalid';
  const passed = result === test.expected;
  
  console.log('Issues found:', issues.length === 0 ? 'None' : issues);
  console.log(`Result: ${result} | Expected: ${test.expected} | ${passed ? '✅ PASS' : '❌ FAIL'}`);
});

console.log('\n' + '=' .repeat(50));

// Test parseAge for import
console.log('\n🔄 Testing parseAge for Import (+ converts to 999):\n');

const importTests = [
  { input: '25', isMax: false, expected: 25 },
  { input: '65', isMax: true, expected: 65 },
  { input: '+', isMax: true, expected: 999 },
  { input: '+', isMax: false, expected: null }
];

function parseAgeForImport(value, isMaxAge = false) {
  if (value === undefined || value === null || value === '' || value === '-') return null;
  
  if (isMaxAge && value.toString().trim() === '+') {
    return 999;
  }
  
  const numValue = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(numValue) ? null : Math.round(numValue);
}

importTests.forEach(test => {
  const result = parseAgeForImport(test.input, test.isMax);
  const passed = result === test.expected;
  console.log(`Input: "${test.input}" (isMax: ${test.isMax}) => ${result} | Expected: ${test.expected} | ${passed ? '✅' : '❌'}`);
});

console.log('\n✨ Test complete!');