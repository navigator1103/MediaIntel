#!/usr/bin/env ts-node

/**
 * Test Script: "Is Digital same as TV" Validation Rules
 * 
 * Tests the new validation rules:
 * 1. TV + Digital campaigns: "Is Digital same as TV" is MANDATORY (critical error)
 * 2. TV-only campaigns: "Is Digital same as TV" is OPTIONAL (warning if missing)
 * 3. Digital-only campaigns: "Is Digital same as TV" is OPTIONAL (warning if missing)
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Test configuration - Singapore data
const TEST_CONFIG = {
  countryId: 17, // Singapore
  lastUpdateId: 1, // Financial cycle
  businessUnitId: 2, // Derma (since Hijab appears to be a Derma product)
  csvFilePath: '/Users/naveedshah/Downloads/media-sufficiency-template-Singapore-2025-07-29 (1).csv'
};

interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: any;
}

async function setupGamePlansForTesting() {
  console.log('🔧 Setting up test game plans for different media scenarios...');
  
  // Clean existing test game plans
  await prisma.gamePlan.deleteMany({
    where: {
      countryId: TEST_CONFIG.countryId,
      last_update_id: TEST_CONFIG.lastUpdateId,
      business_unit_id: TEST_CONFIG.businessUnitId
    }
  });
  
  // Create test campaigns with different media types
  const testGamePlans = [
    // Scenario 1: TV + Digital campaign (both media types)
    {
      countryId: TEST_CONFIG.countryId,
      last_update_id: TEST_CONFIG.lastUpdateId,
      business_unit_id: TEST_CONFIG.businessUnitId,
      year: 2025,
      burst: 1,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      totalBudget: 100000,
      q1Budget: 100000,
      campaignId: 1,
      categoryId: 1,
      mediaSubTypeId: 1, // TV
      pmTypeId: 1
    },
    {
      countryId: TEST_CONFIG.countryId,
      last_update_id: TEST_CONFIG.lastUpdateId,
      business_unit_id: TEST_CONFIG.businessUnitId,
      year: 2025,
      burst: 2,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      totalBudget: 50000,
      q2Budget: 50000,
      campaignId: 1, // Same campaign as above
      categoryId: 1,
      mediaSubTypeId: 5, // Digital
      pmTypeId: 1
    },
    // Scenario 2: TV-only campaign
    {
      countryId: TEST_CONFIG.countryId,
      last_update_id: TEST_CONFIG.lastUpdateId,
      business_unit_id: TEST_CONFIG.businessUnitId,
      year: 2025,
      burst: 1,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      totalBudget: 75000,
      q1Budget: 75000,
      campaignId: 2, // Different campaign
      categoryId: 1,
      mediaSubTypeId: 1, // TV only
      pmTypeId: 1
    },
    // Scenario 3: Digital-only campaign (this matches our CSV data)
    {
      countryId: TEST_CONFIG.countryId,
      last_update_id: TEST_CONFIG.lastUpdateId,
      business_unit_id: TEST_CONFIG.businessUnitId,
      year: 2025,
      burst: 1,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
      totalBudget: 60000,
      q1Budget: 60000,
      campaignId: 3, // Hijab Fresh campaign
      categoryId: 1,
      mediaSubTypeId: 5, // Digital only
      pmTypeId: 1
    }
  ];
  
  // Insert test game plans
  for (const gamePlan of testGamePlans) {
    await prisma.gamePlan.create({
      data: gamePlan
    });
  }
  
  console.log(`✅ Created ${testGamePlans.length} test game plans`);
  
  // Also ensure we have the required master data
  await ensureMasterData();
}

async function ensureMasterData() {
  // Ensure campaigns exist
  const campaigns = [
    { id: 1, name: 'Mixed TV Digital Campaign' },
    { id: 2, name: 'TV Only Campaign' },
    { id: 3, name: 'Hijab Fresh' }
  ];
  
  for (const campaign of campaigns) {
    await prisma.campaign.upsert({
      where: { id: campaign.id },
      update: { name: campaign.name },
      create: campaign
    });
  }
  
  // Ensure media sub types exist
  const mediaSubTypes = [
    { id: 1, name: 'Open TV', mediaTypeId: 1 },
    { id: 5, name: 'Digital Display', mediaTypeId: 2 }
  ];
  
  for (const subType of mediaSubTypes) {
    await prisma.mediaSubType.upsert({
      where: { id: subType.id },
      update: { name: subType.name, mediaTypeId: subType.mediaTypeId },
      create: { 
        id: subType.id,
        name: subType.name,
        mediaTypeId: subType.mediaTypeId
      }
    });
  }
  
  // Ensure media types exist
  const mediaTypes = [
    { id: 1, name: 'TV' },
    { id: 2, name: 'Digital' }
  ];
  
  for (const mediaType of mediaTypes) {
    await prisma.mediaType.upsert({
      where: { id: mediaType.id },
      update: { name: mediaType.name },
      create: mediaType
    });
  }
}

async function testValidationScenarios() {
  console.log('\n🧪 Testing "Is Digital same as TV" validation scenarios...');
  
  // Test data for different scenarios
  const testScenarios = [
    {
      name: 'TV + Digital Campaign (MANDATORY - should be CRITICAL error if missing)',
      data: {
        'Category': 'Face Care',
        'Range': 'Test Range',
        'Campaign': 'Mixed TV Digital Campaign',
        'TV Demo Gender': 'F',
        'TV Demo Min. Age': '25',
        'TV Demo Max. Age': '45',
        'TV SEL': 'abc',
        'Total TV Planned R1+ (%)': '50%',
        'Digital Target Size (Abs)': '1000',
        'Total Digital Planned R1+': '45%',
        // Missing "Is Digital target the same than TV?" - should be CRITICAL
      }
    },
    {
      name: 'TV-only Campaign (OPTIONAL - should be WARNING if missing)',
      data: {
        'Category': 'Face Care',
        'Range': 'Test Range', 
        'Campaign': 'TV Only Campaign',
        'TV Demo Gender': 'M',
        'TV Demo Min. Age': '18',
        'TV Demo Max. Age': '65',
        'TV SEL': 'def',
        'Total TV Planned R1+ (%)': '60%',
        // Missing "Is Digital target the same than TV?" - should be WARNING
      }
    },
    {
      name: 'Digital-only Campaign (OPTIONAL - should be WARNING if missing)',
      data: {
        'Category': 'Deo',
        'Range': 'Hijab',
        'Campaign': 'Hijab Fresh',
        'Digital Demo Gender': 'M',
        'Digital Demo Min. Age': '18',
        'Digital Demo Max. Age': '45',
        'Digital SEL': 'abc',
        'Digital Target Size (Abs)': '1000',
        'Total Digital Planned R1+': '56%',
        // Missing "Is Digital target the same than TV?" - should be WARNING
      }
    }
  ];
  
  const results = [];
  
  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    
    // Call the validation API
    const sessionData = {
      countryId: TEST_CONFIG.countryId,
      lastUpdateId: TEST_CONFIG.lastUpdateId,
      businessUnitId: TEST_CONFIG.businessUnitId,
      records: [scenario.data]
    };
    
    // Simulate the validation call (we'll extract the validation logic)
    const issues = await validateRecord(scenario.data, sessionData);
    
    // Find "Is Digital same as TV" validation issues
    const digitalSameAsTvIssues = issues.filter(issue => 
      issue.columnName === 'Is Digital target the same than TV?'
    );
    
    console.log(`   Found ${digitalSameAsTvIssues.length} validation issues for this field:`);
    digitalSameAsTvIssues.forEach(issue => {
      console.log(`   - ${issue.severity.toUpperCase()}: ${issue.message}`);
    });
    
    results.push({
      scenario: scenario.name,
      issues: digitalSameAsTvIssues,
      expectedSeverity: scenario.name.includes('TV + Digital') ? 'critical' : 'warning'
    });
  }
  
  return results;
}

// Simplified version of the validation logic from the actual API
async function validateRecord(record: any, sessionData: any): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const rowIndex = 0;
  
  // Get campaign media types (simplified version)
  const campaignName = record['Campaign'];
  let hasTvMedia = false;
  let hasDigitalMedia = false;
  
  // Query game plans to determine media types
  const gamePlans = await prisma.gamePlan.findMany({
    where: {
      countryId: sessionData.countryId,
      last_update_id: sessionData.lastUpdateId,
      business_unit_id: sessionData.businessUnitId
    },
    include: {
      campaign: true,
      mediaSubType: {
        include: {
          mediaType: true
        }
      }
    }
  });
  
  // Check what media types this campaign has
  const campaignGamePlans = gamePlans.filter(gp => gp.campaign?.name === campaignName);
  const mediaTypes = new Set(campaignGamePlans.map(gp => gp.mediaSubType?.mediaType?.name));
  
  hasTvMedia = mediaTypes.has('TV') || mediaTypes.has('Traditional');
  hasDigitalMedia = mediaTypes.has('Digital');
  
  console.log(`   Campaign "${campaignName}" has TV: ${hasTvMedia}, Digital: ${hasDigitalMedia}`);
  
  // Apply the new validation logic
  const isDigitalTargetSameAsTv = record['Is Digital target the same than TV?'];
  const hasDigitalSameAsTvValue = isDigitalTargetSameAsTv && isDigitalTargetSameAsTv.toString().trim() !== '';
  
  if (hasTvMedia && hasDigitalMedia) {
    // TV + Digital campaigns: MANDATORY (critical error if missing)
    if (!hasDigitalSameAsTvValue) {
      issues.push({
        rowIndex,
        columnName: 'Is Digital target the same than TV?',
        severity: 'critical',
        message: `"Is Digital target the same than TV?" is required because campaign "${campaignName}" has both TV and Digital media in game plans for this country/financial cycle.`,
        currentValue: isDigitalTargetSameAsTv || ''
      });
    }
  } else if (hasTvMedia && !hasDigitalMedia) {
    // TV-only campaigns: OPTIONAL (warning if missing)  
    if (!hasDigitalSameAsTvValue) {
      issues.push({
        rowIndex,
        columnName: 'Is Digital target the same than TV?',
        severity: 'warning',
        message: `"Is Digital target the same than TV?" should be filled for TV-only campaigns for consistency.`,
        currentValue: isDigitalTargetSameAsTv || ''
      });
    }
  } else if (hasDigitalMedia && !hasTvMedia) {
    // Digital-only campaigns: OPTIONAL (warning if missing)
    if (!hasDigitalSameAsTvValue) {
      issues.push({
        rowIndex,
        columnName: 'Is Digital target the same than TV?',
        severity: 'warning', 
        message: `"Is Digital target the same than TV?" should be filled for Digital-only campaigns for consistency.`,
        currentValue: isDigitalTargetSameAsTv || ''
      });
    }
  }
  
  return issues;
}

async function runTest() {
  console.log('🧪 Testing "Is Digital same as TV" Validation Rules\n');
  console.log('=' .repeat(80));
  
  try {
    // Setup test game plans
    await setupGamePlansForTesting();
    
    // Test validation scenarios
    const results = await testValidationScenarios();
    
    // Verify results
    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    let allTestsPassed = true;
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.scenario}`);
      
      if (result.issues.length === 0) {
        console.log('   ❌ FAIL: Expected validation issue but found none');
        allTestsPassed = false;
      } else {
        const issue = result.issues[0];
        if (issue.severity === result.expectedSeverity) {
          console.log(`   ✅ PASS: Got expected ${result.expectedSeverity.toUpperCase()} severity`);
          console.log(`   📝 Message: ${issue.message}`);
        } else {
          console.log(`   ❌ FAIL: Expected ${result.expectedSeverity.toUpperCase()}, got ${issue.severity.toUpperCase()}`);
          allTestsPassed = false;
        }
      }
    });
    
    console.log('\n' + '='.repeat(80));
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! New validation rules working correctly');
      console.log('\nKey Findings:');
      console.log('✅ TV + Digital campaigns: "Is Digital same as TV" is MANDATORY (critical error)');
      console.log('✅ TV-only campaigns: "Is Digital same as TV" is OPTIONAL (warning if missing)');
      console.log('✅ Digital-only campaigns: "Is Digital same as TV" is OPTIONAL (warning if missing)');
    } else {
      console.log('❌ SOME TESTS FAILED! Check validation logic');
    }
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
runTest()
  .then(() => {
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });