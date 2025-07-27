import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';

async function testBudgetValidation() {
  console.log('=== TESTING BUDGET VALIDATION LOGIC ===\n');
  
  const validator = new MediaSufficiencyValidator();
  
  // Test cases
  const testCases = [
    {
      name: "Case 1: Some monthly budgets blank, total doesn't match sum",
      record: {
        'Total Budget': '1000',
        'Jan': '500',
        'Feb': '', // blank
        'Mar': '200',
        'Apr': '', // blank
        'May': '100',
        // rest blank
      },
      expectedSum: 800, // 500 + 0 + 200 + 0 + 100 = 800
      expectedValid: false // should fail because 1000 ≠ 800
    },
    {
      name: "Case 2: Some monthly budgets blank, total matches sum",
      record: {
        'Total Budget': '800',
        'Jan': '500',
        'Feb': '', // blank
        'Mar': '200', 
        'Apr': '', // blank
        'May': '100',
        // rest blank
      },
      expectedSum: 800, // 500 + 0 + 200 + 0 + 100 = 800
      expectedValid: true // should pass because 800 = 800
    },
    {
      name: "Case 3: All monthly budgets blank, total has value",
      record: {
        'Total Budget': '1000',
        // all monthly fields blank
      },
      expectedSum: 0,
      expectedValid: false // should FAIL - total budget requires monthly distribution
    },
    {
      name: "Case 4: Monthly budgets provided, total blank",
      record: {
        'Total Budget': '',
        'Jan': '500',
        'Feb': '300',
        'Mar': '200'
      },
      expectedSum: 1000,
      expectedValid: false // should FAIL - total budget is required
    },
    {
      name: "Case 5: Single month equals total (valid planning pattern)",
      record: {
        'Total Budget': '1000',
        'Jun': '1000',
        // other months blank
      },
      expectedSum: 1000,
      expectedValid: true // should PASS - single month matching total is valid
    },
    {
      name: "Case 6: Zero total budget",
      record: {
        'Total Budget': '0',
        'Jan': '0',
        // other months blank
      },
      expectedSum: 0,
      expectedValid: false // should FAIL - total budget must be > 0
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n${testCase.name}:`);
    console.log('Record:', JSON.stringify(testCase.record, null, 2));
    
    // Find the budget validation rule
    const budgetRule = (validator as any).rules.find((rule: any) => 
      rule.field === 'Total Budget' && rule.message.includes('sum of monthly budgets')
    );
    
    if (budgetRule) {
      const result = budgetRule.validate(testCase.record['Total Budget'], testCase.record);
      console.log(`Expected valid: ${testCase.expectedValid}, Actual result: ${result}`);
      
      if (result === testCase.expectedValid) {
        console.log('✅ PASS');
      } else {
        console.log('❌ FAIL - Validation result does not match expected');
      }
    } else {
      console.log('❌ Budget validation rule not found');
    }
  }
}

testBudgetValidation().catch(console.error);