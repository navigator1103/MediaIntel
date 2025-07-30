#!/usr/bin/env ts-node

/**
 * Simple Test: "Is Digital same as TV" Validation Rules
 * 
 * Tests the new validation rules by creating a session and validating records
 */

import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${SESSION_PREFIX}${timestamp}-${random}`;
}

function ensureSessionsDirectory() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

async function callValidationAPI(sessionId: string) {
  const response = await fetch('http://localhost:3001/api/admin/reach-planning/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId })
  });
  
  if (!response.ok) {
    throw new Error(`Validation API failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function testValidationScenarios() {
  console.log('🧪 Testing "Is Digital same as TV" validation scenarios...\n');
  
  ensureSessionsDirectory();
  
  // Test scenarios with different campaign types
  const scenarios = [
    {
      name: 'Campaign with missing "Is Digital same as TV" field',
      sessionData: {
        sessionId: generateSessionId(),
        fileName: 'test-validation.csv',
        uploadedAt: new Date().toISOString(),
        totalRecords: 1,
        headers: ['Category', 'Range', 'Campaign'],
        records: [{
          'Category': 'Deo',
          'Range': 'Hijab', 
          'Campaign': 'Hijab Fresh',
          'Digital Demo Gender': 'M',
          'Digital Demo Min. Age': '18',
          'Digital Demo Max. Age': '45',
          'Digital SEL': 'abc',
          'Digital Target Size (Abs)': '1000',
          'Total Digital Planned R1+': '56%',
          // Missing: 'Is Digital target the same than TV?'
        }],
        status: 'uploaded',
        countryId: 17, // Singapore
        lastUpdateId: 1,
        businessUnitId: 2 // Derma
      }
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`📋 Testing: ${scenario.name}`);
    
    try {
      // Create session file
      const sessionFile = path.join(SESSIONS_DIR, `${scenario.sessionData.sessionId}.json`);
      fs.writeFileSync(sessionFile, JSON.stringify(scenario.sessionData, null, 2));
      
      // Call validation API
      const result = await callValidationAPI(scenario.sessionData.sessionId);
      
      console.log('✅ Validation completed');
      console.log('📊 Validation Summary:', result.validationSummary);
      
      // Look for "Is Digital same as TV" issues
      if (result.issues) {
        const digitalSameAsTvIssues = result.issues.filter((issue: any) => 
          issue.columnName === 'Is Digital target the same than TV?'
        );
        
        console.log(`📝 Found ${digitalSameAsTvIssues.length} issues for "Is Digital same as TV":`);
        digitalSameAsTvIssues.forEach((issue: any) => {
          console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
        });
      }
      
      // Clean up
      fs.unlinkSync(sessionFile);
      
    } catch (error) {
      console.error(`❌ Error testing scenario: ${error}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function runTest() {
  console.log('🧪 Testing "Is Digital same as TV" Validation Rules\n');
  console.log('=' .repeat(80));
  
  // Check if development server is running
  try {
    const response = await fetch('http://localhost:3001/api/admin/reach-planning/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-connection' })
    });
    // We expect this to fail with a 400 or 404, but the server should respond
  } catch (error) {
    console.log('❌ Development server not running. Please start with: npm run dev');
    console.log('   The server should be running on http://localhost:3001');
    process.exit(1);
  }
  
  try {
    await testValidationScenarios();
    
    console.log('✨ Test completed! Check the validation results above.');
    console.log('\nExpected behavior:');
    console.log('- Digital-only campaigns should get WARNING for missing "Is Digital same as TV"');
    console.log('- TV+Digital campaigns should get CRITICAL for missing "Is Digital same as TV"');
    console.log('- TV-only campaigns should get WARNING for missing "Is Digital same as TV"');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();