import fs from 'fs';
import path from 'path';
import { AutoCreateValidator } from '../src/lib/validation/autoCreateValidator';

async function debugAutoCreateValidatorIssue() {
  console.log('🔍 DEBUGGING: AutoCreateValidator Issue with SQLImport\n');

  // Load master data to understand what we have
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));
  
  console.log('📊 Master Data Analysis:');
  console.log(`   Total campaigns: ${Object.keys(masterData.campaignToRangeMap || {}).length}`);
  console.log(`   Ranges mapped: ${Object.keys(masterData.rangeToCampaigns || {}).length}`);
  console.log(`   Categories mapped: ${Object.keys(masterData.categoryToRanges || {}).length}`);
  
  // Check specifically for "Lip" range and category
  console.log('\n🔍 Checking "Lip" mappings:');
  
  // Check if "Lip" exists as a range
  const lipInRangeToCampaigns = masterData.rangeToCampaigns?.['Lip'];
  console.log(`   Lip in rangeToCampaigns: ${lipInRangeToCampaigns ? 'YES' : 'NO'}`);
  if (lipInRangeToCampaigns) {
    console.log(`      Campaigns in Lip range: ${lipInRangeToCampaigns.length}`);
    console.log(`      First few: ${lipInRangeToCampaigns.slice(0, 3).join(', ')}`);
  }
  
  // Check if "Lip" exists as a category
  const lipInCategoryToRanges = masterData.categoryToRanges?.['Lip'];
  console.log(`   Lip in categoryToRanges: ${lipInCategoryToRanges ? 'YES' : 'NO'}`);
  if (lipInCategoryToRanges) {
    console.log(`      Ranges in Lip category: ${lipInCategoryToRanges.join(', ')}`);
  }
  
  // Check range to business unit mapping
  const lipRangeBusinessUnit = masterData.rangeToBusinessUnit?.['Lip'];
  console.log(`   Lip range business unit: ${lipRangeBusinessUnit || 'NOT MAPPED'}`);
  
  // Check category to business unit mapping
  const lipCategoryBusinessUnit = masterData.categoryToBusinessUnit?.['Lip'];
  console.log(`   Lip category business unit: ${lipCategoryBusinessUnit || 'NOT MAPPED'}`);
  
  // Now test the AutoCreateValidator
  console.log('\n🧪 Testing AutoCreateValidator.validateOrCreateRange():');
  
  try {
    const autoCreateValidator = new AutoCreateValidator();
    const importSource = 'debug-test';
    
    console.log('   Attempting to validate/create Lip range for Lip category...');
    
    // This is the exact call that's failing in SQLImport
    const result = await autoCreateValidator.validateOrCreateRange('Lip', importSource, 'Lip');
    
    console.log('   ✅ SUCCESS! Result:');
    console.log(`      Range ID: ${result.id}`);
    console.log(`      Status: ${result.status}`);
    console.log(`      Message: ${result.message || 'No message'}`);
    
  } catch (error: any) {
    console.log('   ❌ FAILED! Error details:');
    console.log(`      Error type: ${error.constructor.name}`);
    console.log(`      Error message: ${error.message}`);
    console.log(`      Stack trace: ${error.stack}`);
    
    // Let's also check what AutoCreateValidator thinks about this data
    console.log('\n🔍 AutoCreateValidator Internal State:');
    
    try {
      const validator = new AutoCreateValidator();
      console.log('   Validator created successfully');
      
      // Check if the validator has access to master data
      const validatorState = (validator as any);
      console.log(`   Has masterData: ${!!validatorState.masterData}`);
      
      if (validatorState.masterData) {
        console.log(`   MasterData categories: ${Object.keys(validatorState.masterData.categoryToRanges || {}).length}`);
        console.log(`   MasterData ranges: ${Object.keys(validatorState.masterData.rangeToCampaigns || {}).length}`);
        
        // Check if Lip is accessible
        const lipInValidator = validatorState.masterData.categoryToRanges?.['Lip'];
        console.log(`   Lip category in validator: ${lipInValidator ? 'YES' : 'NO'}`);
      }
      
    } catch (validatorError: any) {
      console.log(`   Validator creation failed: ${validatorError.message}`);
    }
  }
  
  // Let's also check if the issue is with database connection or table structure
  console.log('\n💾 Checking Database State:');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check if we can connect and query ranges
    const rangeCount = await prisma.range.count();
    console.log(`   Total ranges in database: ${rangeCount}`);
    
    // Check specifically for Lip range
    const lipRange = await prisma.range.findFirst({
      where: { name: 'Lip' }
    });
    console.log(`   Lip range in database: ${lipRange ? 'YES' : 'NO'}`);
    if (lipRange) {
      console.log(`      Lip range ID: ${lipRange.id}`);
      console.log(`      Lip range category: ${lipRange.categoryId}`);
    }
    
    // Check for Lip category
    const lipCategory = await prisma.category.findFirst({
      where: { name: 'Lip' }
    });
    console.log(`   Lip category in database: ${lipCategory ? 'YES' : 'NO'}`);
    if (lipCategory) {
      console.log(`      Lip category ID: ${lipCategory.id}`);
    }
    
    await prisma.$disconnect();
    
  } catch (dbError: any) {
    console.log(`   Database check failed: ${dbError.message}`);
  }
  
  console.log('\n🎯 Analysis Complete. Next steps:');
  console.log('   1. Check if AutoCreateValidator.validateOrCreateRange() method exists and works');
  console.log('   2. Verify master data contains Lip mappings');
  console.log('   3. Ensure database has required Lip range/category entries');
  console.log('   4. Check if import session data is causing conflicts');
}

debugAutoCreateValidatorIssue().catch(console.error);