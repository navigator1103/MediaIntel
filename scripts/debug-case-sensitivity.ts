import * as fs from 'fs';

const masterData = JSON.parse(fs.readFileSync('src/lib/validation/masterData.json', 'utf-8'));

console.log('=== DEBUGGING CASE SENSITIVITY ===');
console.log('Categories array sample:', masterData.categories.slice(0, 10));
console.log('Face Care in categories:', masterData.categories.includes('Face Care'));
console.log('face care in categories:', masterData.categories.includes('face care'));
console.log('Face care in categories:', masterData.categories.includes('Face care'));

// Find the exact category entry
const faceCareLike = masterData.categories.filter((cat: string) => 
  cat.toLowerCase().includes('face') && cat.toLowerCase().includes('care')
);
console.log('Face Care variations found:', faceCareLike);

// Check validation logic simulation
const testValue = 'Face care';
const categories = masterData.categories || [];
const isValidCaseSensitive = categories.includes(testValue);
const isValidCaseInsensitive = categories.some((category: string) => 
  category.toLowerCase() === testValue.toLowerCase()
);

console.log(`Testing "${testValue}":`);
console.log('- Case sensitive result:', isValidCaseSensitive);
console.log('- Case insensitive result:', isValidCaseInsensitive);