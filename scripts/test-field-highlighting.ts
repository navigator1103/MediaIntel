import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';
import { promises as fs } from 'fs';
import * as path from 'path';

async function loadMasterData() {
  const masterDataPath = path.join(__dirname, '../src/lib/validation/masterData.json');
  const masterDataRaw = await fs.readFile(masterDataPath, 'utf-8');
  return JSON.parse(masterDataRaw);
}

async function testFieldHighlighting() {
  console.log('🧪 Testing Field Highlighting for Range-Category Mismatch\n');
  
  try {
    // Load master data
    const masterData = await loadMasterData();
    console.log('✅ Master data loaded successfully\n');
    
    // Create validator (non-auto-create mode)
    const validator = new MediaSufficiencyValidator(masterData, false);
    
    // Test record with wrong range for category
    const testRecord = {
      Category: 'Hand Body',  // This category exists
      Range: 'Milk',         // This range exists but doesn't belong to Hand Body
      Campaign: 'Test Campaign',
      'Media Type': 'Digital',
      'Media Sub Type': 'Social Media',
      Country: 'Australia',
      'Start Date': '2025-01-01',
      'End Date': '2025-12-31',
      'Total Budget': 1000,
      Jan: 100,
      Feb: 100,
      Mar: 100,
      Apr: 100,
      May: 100,
      Jun: 100,
      Jul: 100,
      Aug: 100,
      Sep: 100,
      Oct: 100,
      Nov: 100,
      Dec: 100
    };
    
    console.log('📝 Test Record:');
    console.log(`   Category: ${testRecord.Category}`);
    console.log(`   Range: ${testRecord.Range}`);
    console.log(`   Campaign: ${testRecord.Campaign}\n`);
    
    // Validate the record
    const validationResult = await validator.validateRecord(testRecord, 0, [testRecord]);
    
    console.log('🔍 Validation Results:');
    console.log(`   Total issues found: ${validationResult.length}\n`);
    
    // Look for range-category mismatch issues
    const rangeCategoryIssues = validationResult.filter(issue => 
      issue.message.includes('does not belong to Category')
    );
    
    if (rangeCategoryIssues.length > 0) {
      console.log('🎯 Range-Category Mismatch Issues:');
      rangeCategoryIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. Field: "${issue.field}" (${issue.severity})`);
        console.log(`      Message: ${issue.message}`);
        console.log(`      Expected: Field should be "Range" (the incorrect value)`);
        console.log(`      Result: ${issue.field === 'Range' ? '✅ CORRECT' : '❌ WRONG - should highlight Range, not Category'}\n`);
      });
    } else {
      console.log('❌ No range-category mismatch issues found\n');
    }
    
    // Show all validation issues for context
    console.log('📋 All Validation Issues:');
    validationResult.forEach((issue, i) => {
      console.log(`   ${i + 1}. Field: "${issue.field}" (${issue.severity})`);
      console.log(`      Message: ${issue.message}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error running test:', error);
  }
}

testFieldHighlighting().catch(console.error);