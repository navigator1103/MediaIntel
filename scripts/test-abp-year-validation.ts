import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';
import fs from 'fs';
import path from 'path';

async function testAbpYearValidation() {
  console.log('🧪 Testing ABP Year Validation');
  console.log('=================================\n');

  // Load master data
  const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

  // Test cases with ABP 2026 specifically  
  const testCases = [
    {
      name: 'ABP 2026 with correct 2026 dates (should be valid)',
      abpCycle: 'ABP 2026',
      record: {
        'Initial Date': '2026-01-15',
        'End Date': '2026-03-30',
        'Category': 'Hand Body',
        'Range': 'Soft',
        'Campaign': 'Soft Campaign',
        'Media': 'Traditional',
        'Media Subtype': 'Paid TV',
        'Total Budget': '1000',
        'Country': 'India'
      }
    },
    {
      name: 'ABP 2026 with wrong 2025 dates (should be critical error)',
      abpCycle: 'ABP 2026',
      record: {
        'Initial Date': '2025-01-15',
        'End Date': '2025-03-30',
        'Category': 'Hand Body',
        'Range': 'Soft',
        'Campaign': 'Soft Campaign',
        'Media': 'Traditional',
        'Media Subtype': 'Paid TV',
        'Total Budget': '1000',
        'Country': 'India'
      }
    },
    {
      name: 'ABP 2026 with mixed years - Initial 2025, End 2026 (should be critical error)',
      abpCycle: 'ABP 2026',
      record: {
        'Initial Date': '2025-12-15',
        'End Date': '2026-02-28',
        'Category': 'Hand Body',
        'Range': 'Soft',
        'Campaign': 'Soft Campaign',
        'Media': 'Traditional',
        'Media Subtype': 'Paid TV',
        'Total Budget': '1000',
        'Country': 'India'
      }
    },
    {
      name: 'ABP 2026 with mixed years - Initial 2026, End 2025 (should be critical error)',
      abpCycle: 'ABP 2026',
      record: {
        'Initial Date': '2026-01-15',
        'End Date': '2025-03-30',
        'Category': 'Hand Body',
        'Range': 'Soft',
        'Campaign': 'Soft Campaign',
        'Media': 'Traditional',
        'Media Subtype': 'Paid TV',
        'Total Budget': '1000',
        'Country': 'India'
      }
    },
    {
      name: 'ABP 2026 with completely wrong 2024 dates (should be critical error)',
      abpCycle: 'ABP 2026',
      record: {
        'Initial Date': '2024-01-15',
        'End Date': '2024-03-30',
        'Category': 'Hand Body',
        'Range': 'Soft',
        'Campaign': 'Soft Campaign',
        'Media': 'Traditional',
        'Media Subtype': 'Paid TV',
        'Total Budget': '1000',
        'Country': 'India'
      }
    },
    {
      name: 'ABP 2025 with correct 2025 dates (should be valid)',
      abpCycle: 'ABP 2025',
      record: {
        'Initial Date': '2025-01-15',
        'End Date': '2025-03-30',
        'Category': 'Hand Body',
        'Range': 'Soft',
        'Campaign': 'Soft Campaign',
        'Media': 'Traditional',
        'Media Subtype': 'Paid TV',
        'Total Budget': '1000',
        'Country': 'India'
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📋 Test Case ${i + 1}: ${testCase.name}`);
    console.log(`   ABP Cycle: ${testCase.abpCycle || 'null'}`);
    console.log(`   Initial Date: ${testCase.record['Initial Date']}`);
    console.log(`   End Date: ${testCase.record['End Date']}`);

    // Create validator with the specific ABP cycle
    const validator = new MediaSufficiencyValidator(masterData, false, testCase.abpCycle || undefined);

    // Validate the record
    const issues = await validator.validateAll([testCase.record]);
    
    // Filter for ABP year validation issues
    const abpIssues = issues.filter(issue => 
      issue.message.includes('match the selected ABP cycle') || 
      issue.message.includes('financial cycle year')
    );

    console.log(`   Result: ${abpIssues.length === 0 ? '✅ No ABP year issues' : `❌ ${abpIssues.length} ABP year issue(s)`}`);
    
    if (abpIssues.length > 0) {
      abpIssues.forEach(issue => {
        console.log(`     - ${issue.severity.toUpperCase()}: ${issue.message} (${issue.columnName})`);
      });
    }
    
    console.log('');
  }

  console.log('✅ ABP Year Validation Test Complete!');
}

// Run the test
if (require.main === module) {
  testAbpYearValidation().catch(console.error);
}

export { testAbpYearValidation };