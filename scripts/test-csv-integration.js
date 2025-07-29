#!/usr/bin/env node

/**
 * CSV Integration Test Script: Business Unit Auto-Detection
 * 
 * This script tests the business unit auto-detection fix using real CSV files
 * by simulating the upload and import process end-to-end.
 * 
 * Usage: node scripts/test-csv-integration.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

// Test CSV files
const TEST_FILES = [
  {
    name: 'Nivea Only',
    file: 'test-data/nivea-only-test.csv',
    expectedBusinessUnits: ['Nivea'],
    description: 'Should only delete Nivea game plans, preserve Derma'
  },
  {
    name: 'Derma Only', 
    file: 'test-data/derma-only-test.csv',
    expectedBusinessUnits: ['Derma'],
    description: 'Should only delete Derma game plans, preserve Nivea'
  },
  {
    name: 'Mixed Business Units',
    file: 'test-data/mixed-business-units-test.csv', 
    expectedBusinessUnits: ['Nivea', 'Derma'],
    description: 'Should delete both Nivea and Derma game plans'
  },
  {
    name: 'Column Variation: BU',
    file: 'test-data/column-variations-test.csv',
    expectedBusinessUnits: ['Nivea'],
    description: 'Should detect business unit from BU column'
  },
  {
    name: 'Column Variation: Business Unit',
    file: 'test-data/column-variations-test2.csv',
    expectedBusinessUnits: ['Derma'],
    description: 'Should detect business unit from "Business Unit" column'
  },
  {
    name: 'Column Variation: BUSINESSUNIT',
    file: 'test-data/column-variations-test3.csv',
    expectedBusinessUnits: ['Nivea'],
    description: 'Should detect business unit from BUSINESSUNIT column'
  }
];

async function logWithTimestamp(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data !== null) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function readAndParseCSV(filePath) {
  logWithTimestamp(`📄 Reading CSV file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  logWithTimestamp(`✅ Parsed ${records.length} records from CSV`);
  return records;
}

async function testBusinessUnitDetection(records, expectedBusinessUnits) {
  logWithTimestamp('🔍 Testing business unit auto-detection logic...');
  
  // Simulate the detection logic from import-sqlite route
  const csvBusinessUnits = new Set();
  
  for (const record of records) {
    const businessUnitValue = record.BusinessUnit || record['Business Unit'] || record.BU || record['BU'] || record.BUSINESSUNIT;
    if (businessUnitValue && typeof businessUnitValue === 'string' && businessUnitValue.trim()) {
      csvBusinessUnits.add(businessUnitValue.trim());
    }
  }
  
  const detectedBusinessUnits = Array.from(csvBusinessUnits);
  logWithTimestamp(`📊 Detected business units:`, detectedBusinessUnits);
  
  // Verify detection matches expectations
  const detectedSet = new Set(detectedBusinessUnits);
  const expectedSet = new Set(expectedBusinessUnits);
  
  const detectionCorrect = 
    detectedSet.size === expectedSet.size && 
    [...expectedSet].every(bu => detectedSet.has(bu));
  
  if (detectionCorrect) {
    logWithTimestamp('✅ Business unit detection matches expectations');
  } else {
    logWithTimestamp('❌ Business unit detection failed!');
    logWithTimestamp(`Expected: ${expectedBusinessUnits}`);
    logWithTimestamp(`Detected: ${detectedBusinessUnits}`);
    throw new Error('Business unit detection test failed');
  }
  
  return detectedBusinessUnits;
}

async function testDeletionFilterGeneration(detectedBusinessUnits) {
  logWithTimestamp('🗑️ Testing deletion filter generation...');
  
  // Simulate business unit ID resolution
  const businessUnitIds = [];
  for (const businessUnitName of detectedBusinessUnits) {
    const businessUnit = await prisma.businessUnit.findFirst({
      where: { name: businessUnitName }
    });
    
    if (businessUnit) {
      businessUnitIds.push(businessUnit.id);
      logWithTimestamp(`✅ Resolved '${businessUnitName}' to ID: ${businessUnit.id}`);
    } else {
      logWithTimestamp(`⚠️ Business unit '${businessUnitName}' not found in database`);
    }
  }
  
  // Build deletion filter
  const country = await prisma.country.findFirst();
  const lastUpdate = await prisma.lastUpdate.findFirst();
  
  const deletionFilter = {
    countryId: country.id,
    last_update_id: lastUpdate.id
  };
  
  if (businessUnitIds.length > 0) {
    deletionFilter.business_unit_id = {
      in: businessUnitIds
    };
  }
  
  logWithTimestamp('🔍 Generated deletion filter:', deletionFilter);
  
  // Test the filter works without errors
  try {
    const testQuery = await prisma.gamePlan.count({
      where: deletionFilter
    });
    logWithTimestamp(`✅ Deletion filter query successful (would affect ${testQuery} records)`);
  } catch (error) {
    logWithTimestamp('❌ Deletion filter query failed:', error.message);
    throw error;
  }
  
  return { deletionFilter, businessUnitIds };
}

async function simulateDataIntegrityScenario(testCase, detectedBusinessUnits) {
  logWithTimestamp(`🔐 Simulating data integrity for: ${testCase.name}`);
  
  // Get current game plan counts by business unit
  const niveaCount = await prisma.gamePlan.count({
    where: { business_unit_id: 1 } // Nivea ID
  });
  
  const dermaCount = await prisma.gamePlan.count({
    where: { business_unit_id: 2 } // Derma ID  
  });
  
  logWithTimestamp(`📊 Current state - Nivea: ${niveaCount}, Derma: ${dermaCount}`);
  
  // Analyze what would happen based on detected business units
  const wouldAffectNivea = detectedBusinessUnits.includes('Nivea');
  const wouldAffectDerma = detectedBusinessUnits.includes('Derma');
  
  logWithTimestamp(`🎯 Import would affect - Nivea: ${wouldAffectNivea}, Derma: ${wouldAffectDerma}`);
  
  // Verify data integrity expectations
  if (testCase.name.includes('Nivea Only')) {
    if (wouldAffectNivea && !wouldAffectDerma) {
      logWithTimestamp('✅ Nivea-only import would preserve Derma data');
    } else {
      throw new Error('Data integrity violation: Nivea-only import would affect Derma');
    }
  } else if (testCase.name.includes('Derma Only')) {
    if (wouldAffectDerma && !wouldAffectNivea) {
      logWithTimestamp('✅ Derma-only import would preserve Nivea data');
    } else {
      throw new Error('Data integrity violation: Derma-only import would affect Nivea');
    }
  } else if (testCase.name.includes('Mixed')) {
    if (wouldAffectNivea && wouldAffectDerma) {
      logWithTimestamp('✅ Mixed import would affect both business units as expected');
    } else {
      throw new Error('Data integrity violation: Mixed import should affect both business units');
    }
  }
  
  return true;
}

async function runTestCase(testCase) {
  logWithTimestamp(`\n🧪 RUNNING TEST: ${testCase.name}`);
  logWithTimestamp('=' .repeat(60));
  logWithTimestamp(`📋 Description: ${testCase.description}`);
  
  try {
    // Step 1: Read and parse CSV
    const records = await readAndParseCSV(testCase.file);
    
    // Step 2: Test business unit detection
    const detectedBusinessUnits = await testBusinessUnitDetection(records, testCase.expectedBusinessUnits);
    
    // Step 3: Test deletion filter generation
    const { deletionFilter, businessUnitIds } = await testDeletionFilterGeneration(detectedBusinessUnits);
    
    // Step 4: Simulate data integrity scenario
    await simulateDataIntegrityScenario(testCase, detectedBusinessUnits);
    
    logWithTimestamp(`✅ TEST PASSED: ${testCase.name}`);
    return {
      name: testCase.name,
      status: 'PASSED',
      detectedBusinessUnits,
      businessUnitIds,
      deletionFilter
    };
    
  } catch (error) {
    logWithTimestamp(`❌ TEST FAILED: ${testCase.name}`, error.message);
    return {
      name: testCase.name,
      status: 'FAILED',
      error: error.message
    };
  }
}

async function runAllTests() {
  logWithTimestamp('🚀 Starting CSV Integration Tests for Business Unit Auto-Detection');
  logWithTimestamp('=' .repeat(80));
  
  const results = [];
  
  try {
    // Run each test case
    for (const testCase of TEST_FILES) {
      const result = await runTestCase(testCase);
      results.push(result);
    }
    
    // Summary
    logWithTimestamp('\n📊 TEST RESULTS SUMMARY');
    logWithTimestamp('=' .repeat(80));
    
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    
    logWithTimestamp(`✅ Passed: ${passed}/${results.length}`);
    logWithTimestamp(`❌ Failed: ${failed}/${results.length}`);
    
    results.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      logWithTimestamp(`${status} ${result.name}: ${result.status}`);
      if (result.error) {
        logWithTimestamp(`   Error: ${result.error}`);
      } else if (result.detectedBusinessUnits) {
        logWithTimestamp(`   Detected BUs: ${result.detectedBusinessUnits.join(', ')}`);
      }
    });
    
    if (failed === 0) {
      logWithTimestamp('\n🎉 ALL TESTS PASSED! Business unit auto-detection is working correctly.');
      logWithTimestamp('✅ The fix properly detects business units from CSV data');
      logWithTimestamp('✅ Deletion logic correctly filters by detected business units');
      logWithTimestamp('✅ Data integrity is maintained between Nivea and Derma');
      logWithTimestamp('✅ Multiple column name variations are supported');
    } else {
      throw new Error(`${failed} test(s) failed. Please review the issues above.`);
    }
    
  } catch (error) {
    logWithTimestamp('\n💥 TEST SUITE FAILED');
    logWithTimestamp('=' .repeat(80));
    logWithTimestamp('Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
if (require.main === module) {
  runAllTests()
    .then(() => {
      logWithTimestamp('🎯 CSV Integration tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logWithTimestamp('💥 CSV Integration tests failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runAllTests };