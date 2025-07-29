import { PrismaClient } from '@prisma/client';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

const prisma = new PrismaClient();

async function testBusinessUnitValidation() {
  try {
    console.log('Starting business unit validation test...\n');
    
    // Get business units and their categories
    const businessUnits = await prisma.businessUnit.findMany({
      include: {
        categories: true
      }
    });
    
    console.log('Business Units and their categories:');
    for (const bu of businessUnits) {
      console.log(`\n${bu.name} (ID: ${bu.id}):`);
      console.log('  Categories:', bu.categories.map(c => c.name).join(', '));
    }
    
    // Test scenario 1: Campaign with wrong business unit
    console.log('\n\n=== TEST SCENARIO 1: Campaign with wrong business unit ===');
    const testBusinessUnitId = 1; // Assuming BU 1 exists
    const testRecord = {
      'Campaign': 'Test Campaign',
      'Category': 'DERMA', // This might belong to a different BU
      'Range': 'Test Range'
    };
    
    // Create validator with business unit ID and mock master data
    const mockMasterData = {
      businessUnitToCategories: {
        1: ['Deo', 'Face Care', 'Face Cleansing', 'Hand Body', 'Lip', 'Men'],
        2: ['Sun', 'Acne', 'Anti Age', 'Anti Pigment', 'Aquaphor', 'X-Cat', 'Atopi', 'Body Range', 'Hydration', 'pH5', 'Repair', 'Dry Skin', 'Body Lotion']
      }
    };
    const validator = new AutoCreateValidator(mockMasterData, undefined, testBusinessUnitId);
    
    // Get the validation rules
    const rules = (validator as any).rules;
    const businessUnitRule = rules.find((r: any) => 
      r.field === 'Campaign' && r.message?.includes('business unit')
    );
    
    console.log('\nBusiness unit validation rule found:', !!businessUnitRule);
    if (businessUnitRule) {
      console.log('Rule details:', {
        field: businessUnitRule.field,
        type: businessUnitRule.type,
        severity: businessUnitRule.severity,
        message: businessUnitRule.message
      });
      
      // Test the validation
      console.log('\nTesting validation with record:', testRecord);
      const result = await businessUnitRule.validate(
        testRecord.Campaign,
        testRecord,
        [testRecord],
        mockMasterData
      );
      
      console.log('Validation result:', result);
    }
    
    // Test scenario 2: Check which categories belong to which business units
    console.log('\n\n=== TEST SCENARIO 2: Category-Business Unit mapping ===');
    const categories = await prisma.category.findMany({
      include: {
        businessUnit: true
      }
    });
    
    console.log('Categories and their business units:');
    const categoryMap = new Map<string, string>();
    for (const cat of categories) {
      if (cat.businessUnit) {
        categoryMap.set(cat.name, cat.businessUnit.name || 'Unknown');
        console.log(`  ${cat.name} -> ${cat.businessUnit.name} (BU ID: ${cat.businessUnitId})`);
      } else {
        console.log(`  ${cat.name} -> NO BUSINESS UNIT`);
      }
    }
    
    // Test scenario 3: Validate a full record
    console.log('\n\n=== TEST SCENARIO 3: Full record validation ===');
    const testRecords = [
      {
        'Campaign': 'DERMA Campaign',
        'Category': 'DERMA',
        'Range': 'Some Range',
        'Country': 'USA'
      }
    ];
    
    console.log('Test record:', testRecords[0]);
    console.log('Selected business unit ID:', testBusinessUnitId);
    
    const issues = await validator.validateAll(testRecords);
    console.log('\nValidation issues found:', issues.length);
    
    const businessUnitIssues = issues.filter(i => i.message?.includes('business unit'));
    console.log('Business unit related issues:', businessUnitIssues.length);
    
    for (const issue of businessUnitIssues) {
      console.log('\nIssue:', {
        row: issue.rowIndex + 1,
        column: issue.columnName,
        severity: issue.severity,
        message: issue.message
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBusinessUnitValidation();