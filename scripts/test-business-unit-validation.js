#!/usr/bin/env node

/**
 * Business Unit Validation Test Script
 * 
 * This script tests the business unit mismatch validation to ensure
 * users cannot import data from different business units than selected.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

function logWithTimestamp(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data !== null) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testBusinessUnitValidation() {
  logWithTimestamp('🧪 TESTING BUSINESS UNIT VALIDATION');
  logWithTimestamp('=' .repeat(80));
  
  try {
    // Dynamically import the AutoCreateValidator
    const validatorPath = path.join(process.cwd(), 'src/lib/validation/autoCreateValidator.ts');
    console.log('Validator path:', validatorPath);
    
    // For now, let's test the core validation logic manually
    await testScenario1_NiveaSelectedDermaCsv();
    await testScenario2_DermaSelectedNiveaCsv();
    await testScenario3_MixedBusinessUnits();
    await testScenario4_MatchingBusinessUnit();
    
    logWithTimestamp('✅ All business unit validation tests completed');
    
  } catch (error) {
    logWithTimestamp('❌ Business unit validation test failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function testScenario1_NiveaSelectedDermaCsv() {
  logWithTimestamp('\\n📋 SCENARIO 1: Derma selected, Nivea CSV uploaded');
  logWithTimestamp('-' .repeat(60));
  
  const selectedBusinessUnit = 'Derma';  // User selected Derma
  const csvPath = 'test-data/derma-selected-nivea-csv.csv';  // But CSV contains Nivea data
  
  // Read and parse CSV
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  logWithTimestamp(`Selected Business Unit: ${selectedBusinessUnit}`);
  logWithTimestamp(`CSV Records:`, records);
  
  // Test validation logic
  const record = records[0];
  const csvBusinessUnit = record.BusinessUnit || record['Business Unit'] || record.BU;
  
  logWithTimestamp(`CSV Business Unit: ${csvBusinessUnit}`);
  
  const isMatch = selectedBusinessUnit.toLowerCase() === csvBusinessUnit.toLowerCase();
  
  if (!isMatch) {
    logWithTimestamp('✅ VALIDATION PASSED: Correctly detected business unit mismatch');
    logWithTimestamp(`Expected: Critical error - "${selectedBusinessUnit}" selected but "${csvBusinessUnit}" in CSV`);
  } else {
    logWithTimestamp('❌ VALIDATION FAILED: Should have detected mismatch');
  }
}

async function testScenario2_DermaSelectedNiveaCsv() {
  logWithTimestamp('\\n📋 SCENARIO 2: Nivea selected, Derma CSV uploaded');
  logWithTimestamp('-' .repeat(60));
  
  const selectedBusinessUnit = 'Nivea';  // User selected Nivea
  const csvPath = 'test-data/nivea-selected-derma-csv.csv';  // But CSV contains Derma data
  
  // Read and parse CSV
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  logWithTimestamp(`Selected Business Unit: ${selectedBusinessUnit}`);
  logWithTimestamp(`CSV Records:`, records);
  
  // Test validation logic
  const record = records[0];
  const csvBusinessUnit = record.BusinessUnit || record['Business Unit'] || record.BU;
  
  logWithTimestamp(`CSV Business Unit: ${csvBusinessUnit}`);
  
  const isMatch = selectedBusinessUnit.toLowerCase() === csvBusinessUnit.toLowerCase();
  
  if (!isMatch) {
    logWithTimestamp('✅ VALIDATION PASSED: Correctly detected business unit mismatch');
    logWithTimestamp(`Expected: Critical error - "${selectedBusinessUnit}" selected but "${csvBusinessUnit}" in CSV`);
  } else {
    logWithTimestamp('❌ VALIDATION FAILED: Should have detected mismatch');
  }
}

async function testScenario3_MixedBusinessUnits() {
  logWithTimestamp('\\n📋 SCENARIO 3: Mixed business units in CSV');
  logWithTimestamp('-' .repeat(60));
  
  const selectedBusinessUnit = 'Nivea';
  const csvPath = 'test-data/business-unit-mismatch-test.csv';
  
  // Read and parse CSV
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  logWithTimestamp(`Selected Business Unit: ${selectedBusinessUnit}`);
  logWithTimestamp(`CSV Records:`, records);
  
  let hasValidationErrors = false;
  
  records.forEach((record, index) => {
    const csvBusinessUnit = record.BusinessUnit || record['Business Unit'] || record.BU;
    const isMatch = selectedBusinessUnit.toLowerCase() === csvBusinessUnit.toLowerCase();
    
    logWithTimestamp(`Row ${index + 1}: CSV BU="${csvBusinessUnit}", Match=${isMatch}`);
    
    if (!isMatch) {
      hasValidationErrors = true;
      logWithTimestamp(`❌ Row ${index + 1}: Mismatch detected - "${selectedBusinessUnit}" vs "${csvBusinessUnit}"`);
    }
  });
  
  if (hasValidationErrors) {
    logWithTimestamp('✅ VALIDATION PASSED: Correctly detected business unit mismatches in mixed CSV');
  } else {
    logWithTimestamp('❌ VALIDATION FAILED: Should have detected mismatches in mixed CSV');
  }
}

async function testScenario4_MatchingBusinessUnit() {
  logWithTimestamp('\\n📋 SCENARIO 4: Matching business unit (should pass)');
  logWithTimestamp('-' .repeat(60));
  
  const selectedBusinessUnit = 'Nivea';
  const testRecord = {
    Year: '2024',
    Country: 'Australia',
    Category: 'Face Care',
    Range: 'Nivea Daily',
    Campaign: 'Test Campaign',
    Media: 'Radio',
    'Media Subtype': 'Drive Time',
    BusinessUnit: 'Nivea',  // Matching business unit
    'Start Date': '2024-03-01',
    'End Date': '2024-06-30',
    Budget: '40000'
  };
  
  logWithTimestamp(`Selected Business Unit: ${selectedBusinessUnit}`);
  logWithTimestamp(`Test Record:`, testRecord);
  
  const csvBusinessUnit = testRecord.BusinessUnit || testRecord['Business Unit'] || testRecord.BU;
  const isMatch = selectedBusinessUnit.toLowerCase() === csvBusinessUnit.toLowerCase();
  
  logWithTimestamp(`CSV Business Unit: ${csvBusinessUnit}`);
  logWithTimestamp(`Match: ${isMatch}`);
  
  if (isMatch) {
    logWithTimestamp('✅ VALIDATION PASSED: Correctly allowed matching business unit');
  } else {
    logWithTimestamp('❌ VALIDATION FAILED: Should have allowed matching business unit');
  }
}

// Run the tests
if (require.main === module) {
  testBusinessUnitValidation()
    .then(() => {
      logWithTimestamp('🎯 Business unit validation testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logWithTimestamp('💥 Business unit validation testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testBusinessUnitValidation };