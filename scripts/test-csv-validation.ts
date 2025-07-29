import { PrismaClient } from '@prisma/client';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

const prisma = new PrismaClient();

async function testCsvValidation() {
  console.log('🧪 Testing CSV Business Unit Validation');
  console.log('======================================');
  
  try {
    // Read the CSV file
    const csvPath = '/Users/naveedshah/Downloads/Bla bLa.csv';
    console.log(`📁 Reading CSV file: ${csvPath}`);
    
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    console.log(`✅ File read successfully, size: ${fileContent.length} bytes`);
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`📊 Parsed ${records.length} records from CSV`);
    console.log('Sample record:', records[0]);
    
    // Get business units from database
    const businessUnits = await prisma.businessUnit.findMany();
    console.log('\n🏢 Available business units:', businessUnits.map(bu => ({ id: bu.id, name: bu.name || 'NO NAME' })));
    
    // Find Nivea business unit
    const niveaBusinessUnit = businessUnits.find(bu => bu.name?.toLowerCase().includes('nivea'));
    if (!niveaBusinessUnit) {
      console.log('❌ Could not find Nivea business unit');
      return;
    }
    
    console.log(`\n🎯 Testing with business unit: ${niveaBusinessUnit.name} (ID: ${niveaBusinessUnit.id})`);
    
    // Get categories from database to check their business units
    const categories = await prisma.category.findMany({
      include: { businessUnit: true }
    });
    
    console.log('\n📋 Categories in the CSV and their business units:');
    const csvCategories = [...new Set(records.map((r: any) => r.Category))] as string[];
    csvCategories.forEach((categoryName: string) => {
      const dbCategory = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      if (dbCategory) {
        console.log(`- ${categoryName}: ${dbCategory.businessUnit?.name || 'NO BUSINESS UNIT'}`);
      } else {
        console.log(`- ${categoryName}: NOT FOUND IN DATABASE`);
      }
    });
    
    // Create mock master data
    const masterData = {
      categories: categories.map(c => c.name),
      ranges: ['Lip', 'Body Milk', 'C&HYA', 'Aquaphor'],
      campaigns: [],
      countries: ['Germany'],
      mediaTypes: ['Digital', 'Traditional'],
      mediaSubTypes: ['PM & FF', 'Open TV'],
      pmTypes: ['Traditional']
    };
    
    // Create validator with Nivea business unit
    console.log(`\n🔍 Creating validator with business unit: ${niveaBusinessUnit.name}`);
    const validator = new AutoCreateValidator(masterData, 'ABP2026', niveaBusinessUnit.name || undefined);
    
    // Test validation on all records
    console.log('\n🧪 Running validation on all records...');
    const allIssues = await validator.validateAll(records);
    
    // Filter for business unit issues
    const businessUnitIssues = allIssues.filter(issue => 
      issue.message.includes('Business unit mismatch') || 
      issue.message.includes('business unit')
    );
    
    console.log(`\n📊 Validation Results:`);
    console.log(`- Total issues: ${allIssues.length}`);
    console.log(`- Business unit issues: ${businessUnitIssues.length}`);
    
    if (businessUnitIssues.length > 0) {
      console.log('\n❌ Business Unit Issues Found:');
      businessUnitIssues.forEach((issue, index) => {
        console.log(`${index + 1}. Row ${issue.rowIndex + 1}, Column: ${issue.columnName}`);
        console.log(`   Severity: ${issue.severity.toUpperCase()}`);
        console.log(`   Message: ${issue.message}`);
        console.log(`   Current Value: ${issue.currentValue}`);
        console.log();
      });
    } else {
      console.log('\n🟡 No business unit issues found');
    }
    
    // Check specifically for Aquaphor (Derma) category
    console.log('\n🎯 Specific Test: Checking Aquaphor (Derma) category...');
    const aquaphorRecord = records.find((r: any) => r.Category === 'Aquaphor');
    if (aquaphorRecord) {
      const recordIndex = records.indexOf(aquaphorRecord);
      const recordIssues = await validator.validateRecord(aquaphorRecord, recordIndex, records);
      const aquaphorBusinessUnitIssues = recordIssues.filter(issue => 
        issue.message.includes('Business unit mismatch')
      );
      
      console.log(`Aquaphor record issues: ${aquaphorBusinessUnitIssues.length}`);
      if (aquaphorBusinessUnitIssues.length > 0) {
        console.log('✅ PASS: Aquaphor (Derma) correctly flagged as business unit mismatch when Nivea is selected');
        aquaphorBusinessUnitIssues.forEach(issue => {
          console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
        });
      } else {
        console.log('❌ FAIL: Aquaphor (Derma) should have been flagged as business unit mismatch');
      }
    } else {
      console.log('❌ Could not find Aquaphor record in CSV');
    }
    
    console.log('\n🎯 Expected Result:');
    console.log('- Lip, Hand Body, Face Cleansing (Nivea categories) should pass');
    console.log('- Aquaphor (Derma category) should fail with CRITICAL error');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCsvValidation().catch(console.error);