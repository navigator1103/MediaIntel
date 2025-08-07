// Simulating the exact calculation from the dashboard
const testData = {
  budgetByMediaType: {
    "Digital": 2732,
    "Traditional": 220
  }
};

console.log('\n=== TV Share Calculation Test ===\n');
console.log('Data from API:', testData);

// Old calculation (before fix)
console.log('\n❌ OLD CALCULATION (without "Traditional"):');
let tvBudgetOld = 0;
let digitalBudgetOld = 0;
let totalBudgetOld = 0;

Object.entries(testData.budgetByMediaType).forEach(([mediaType, budget]) => {
  const budgetValue = Number(budget) || 0;
  totalBudgetOld += budgetValue;
  
  if (['TV', 'Radio', 'Print', 'OOH'].includes(mediaType)) {
    tvBudgetOld += budgetValue;
  } else {
    digitalBudgetOld += budgetValue;
  }
});

const tvShareOld = totalBudgetOld > 0 ? (tvBudgetOld / totalBudgetOld * 100) : 0;
console.log(`  TV Budget: $${tvBudgetOld}`);
console.log(`  Digital Budget: $${digitalBudgetOld}`);
console.log(`  TV Share: ${tvShareOld}%`);

// New calculation (after fix)
console.log('\n✅ NEW CALCULATION (with "Traditional"):');
let tvBudgetNew = 0;
let digitalBudgetNew = 0;
let totalBudgetNew = 0;

Object.entries(testData.budgetByMediaType).forEach(([mediaType, budget]) => {
  const budgetValue = Number(budget) || 0;
  totalBudgetNew += budgetValue;
  
  if (['TV', 'Radio', 'Print', 'OOH', 'Traditional'].includes(mediaType)) {
    tvBudgetNew += budgetValue;
  } else {
    digitalBudgetNew += budgetValue;
  }
});

const tvShareNew = totalBudgetNew > 0 ? (tvBudgetNew / totalBudgetNew * 100) : 0;
console.log(`  TV Budget: $${tvBudgetNew}`);
console.log(`  Digital Budget: $${digitalBudgetNew}`);
console.log(`  TV Share: ${Math.round(tvShareNew)}%`);

console.log('\n🎉 RESULT:');
console.log(`The TV Share card in the dashboard should now show: ${Math.round(tvShareNew)}%`);
console.log(`The Digital Share card should show: ${Math.round(100 - tvShareNew)}%\n`);