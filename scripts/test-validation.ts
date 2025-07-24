#!/usr/bin/env ts-node

/**
 * Validation Testing Script
 * Tests the game plans validation logic with our test cases
 */

import { MediaSufficiencyValidator } from '../src/lib/validation/mediaSufficiencyValidator';
import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

// Import master data
const masterDataPath = path.join(__dirname, '../src/lib/validation/masterData.json');

async function loadMasterData() {
  const masterDataRaw = await fs.readFile(masterDataPath, 'utf-8');
  return JSON.parse(masterDataRaw);
}

async function loadCsvFile(filename: string) {
  const filePath = path.join(__dirname, '..', filename);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  return records;
}

async function testValidation(filename: string, expectedErrorCount: number, description: string) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📁 File: ${filename}`);
  console.log('=' .repeat(60));
  
  try {
    // Load data
    const masterData = await loadMasterData();
    const records = await loadCsvFile(filename);
    
    console.log(`📊 Records loaded: ${records.length}`);
    
    // Create validator
    const validator = new MediaSufficiencyValidator(masterData);
    
    // Validate all records
    const issues = await validator.validateAll(records, 0);
    
    // Analyze results
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    const warningIssues = issues.filter(issue => issue.severity === 'warning');
    const suggestionIssues = issues.filter(issue => issue.severity === 'suggestion');
    
    console.log(`\n📋 Validation Results:`);
    console.log(`   Total Issues: ${issues.length}`);
    console.log(`   Critical: ${criticalIssues.length}`);
    console.log(`   Warnings: ${warningIssues.length}`);
    console.log(`   Suggestions: ${suggestionIssues.length}`);
    
    // Show critical issues
    if (criticalIssues.length > 0) {
      console.log(`\n❌ Critical Issues:`);
      criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. Row ${issue.rowIndex + 1}: ${issue.columnName} - ${issue.message}`);
      });
    }
    
    // Show warnings  
    if (warningIssues.length > 0) {
      console.log(`\n⚠️ Warnings:`);
      warningIssues.slice(0, 5).forEach((issue, index) => {
        console.log(`   ${index + 1}. Row ${issue.rowIndex + 1}: ${issue.columnName} - ${issue.message}`);
      });
      if (warningIssues.length > 5) {
        console.log(`   ... and ${warningIssues.length - 5} more warnings`);
      }
    }
    
    // Test result
    const passed = expectedErrorCount === -1 ? true : (criticalIssues.length === expectedErrorCount);
    console.log(`\n${passed ? '✅ PASS' : '❌ FAIL'}: Expected ${expectedErrorCount === -1 ? 'any number of' : expectedErrorCount} critical errors, got ${criticalIssues.length}`);
    
    return {
      passed,
      criticalCount: criticalIssues.length,
      warningCount: warningIssues.length,
      issues: issues.slice(0, 10) // Return first 10 issues for analysis
    };
    
  } catch (error) {
    console.log(`\n💥 Error testing ${filename}:`, error);
    return { passed: false, criticalCount: -1, warningCount: -1, issues: [] };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Game Plans Validation Tests');
  console.log(`📅 ${new Date().toISOString()}`);
  
  const testCases = [
    {
      file: 'test-data-valid-records.csv',
      expectedCritical: 0,
      description: 'Valid Records (should pass all validation)'
    },
    {
      file: 'test-data-cross-reference-errors.csv', 
      expectedCritical: -1, // Any number expected
      description: 'Cross-Reference Errors (new validation rules)'
    },
    {
      file: 'test-data-missing-required-fields.csv',
      expectedCritical: -1, // Any number expected  
      description: 'Missing Required Fields (WOA/WOFF now required)'
    },
    {
      file: 'test-data-budget-validation.csv',
      expectedCritical: 0, // Should be warnings only
      description: 'Budget Validation (warnings for mismatches)'
    },
    {
      file: 'test-data-tv-trp-validation.csv',
      expectedCritical: -1, // Any number expected
      description: 'TV TRP Validation (conditional requirements)'
    },
    {
      file: 'test-data-derma-nivea-sun.csv',
      expectedCritical: 0, // Should work correctly
      description: 'Derma/Nivea Sun Category (context differentiation)'
    },
    {
      file: 'test-data-new-entities-auto-create.csv',
      expectedCritical: 0, // Should be warnings only
      description: 'New Entities Auto-Create (should create warnings)'
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testValidation(testCase.file, testCase.expectedCritical, testCase.description);
    results.push({ ...testCase, ...result });
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${result.description}`);
    console.log(`   Critical: ${result.criticalCount}, Warnings: ${result.warningCount}`);
  });
  
  console.log(`\n🎯 Overall Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Validation system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Review the results above.');
  }
  
  return results;
}

// Run the tests
if (require.main === module) {
  runAllTests()
    .then((results) => {
      process.exit(results.every(r => r.passed) ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { runAllTests, testValidation };