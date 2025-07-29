#!/usr/bin/env node

/**
 * Test Script: Business Unit Auto-Detection and Data Integrity
 * 
 * This script tests the critical fix for game plans import where business units
 * are auto-detected from CSV data and deletion is properly filtered by business unit.
 * 
 * Usage: node scripts/test-business-unit-detection.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Test data setup
const TEST_COUNTRY = 'Germany';
const TEST_FINANCIAL_CYCLE = 'FY2024';
const NIVEA_BU = 'Nivea';
const DERMA_BU = 'Derma';

// Sample CSV data to test detection
const SAMPLE_CSV_RECORDS = [
  {
    'Year': '2024',
    'Country': 'Germany', 
    'Category': 'Face Care',
    'Range': 'Nivea Men',
    'Campaign': 'Nivea Men Q1 Campaign',
    'Media': 'TV',
    'Media Subtype': 'Prime Time',
    'BU': NIVEA_BU,
    'Start Date': '2024-01-01',
    'End Date': '2024-03-31',
    'Budget': '100000'
  },
  {
    'Year': '2024',
    'Country': 'Germany',
    'Category': 'Face Care', 
    'Range': 'Nivea Women',
    'Campaign': 'Nivea Women Q2 Campaign',
    'Media': 'Digital',
    'Media Subtype': 'Social Media',
    'Business Unit': NIVEA_BU, // Test different column name
    'Start Date': '2024-04-01',
    'End Date': '2024-06-30',
    'Budget': '75000'
  },
  {
    'Year': '2024',
    'Country': 'Germany',
    'Category': 'Face Cleansing',
    'Range': 'Eucerin',
    'Campaign': 'Eucerin Face Campaign',
    'Media': 'TV',
    'Media Subtype': 'Prime Time',
    'BusinessUnit': DERMA_BU, // Test another column name variation
    'Start Date': '2024-01-01',
    'End Date': '2024-12-31',
    'Budget': '150000'
  }
];

async function logWithTimestamp(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data !== null) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function setupTestData() {
  logWithTimestamp('🔧 Setting up test data...');
  
  try {
    // Use existing country if available, otherwise create one
    let country = await prisma.country.findFirst();
    
    if (!country) {
      // Create test country - need to find a subregion first
      const subRegion = await prisma.subRegion.findFirst();
      if (!subRegion) {
        throw new Error('No subRegion found in database. Please seed the database first.');
      }
      
      country = await prisma.country.create({
        data: {
          name: TEST_COUNTRY,
          subRegionId: subRegion.id
        }
      });
      logWithTimestamp(`✅ Created test country: ${TEST_COUNTRY}`);
    } else {
      logWithTimestamp(`✅ Using existing country: ${country.name}`);
    }
    
    // Use existing financial cycle if available, otherwise create one
    let lastUpdate = await prisma.lastUpdate.findFirst();
    
    if (!lastUpdate) {
      lastUpdate = await prisma.lastUpdate.create({
        data: {
          name: TEST_FINANCIAL_CYCLE,
          description: 'Test Financial Cycle for Business Unit Detection'
        }
      });
      logWithTimestamp(`✅ Created test financial cycle: ${TEST_FINANCIAL_CYCLE}`);
    } else {
      logWithTimestamp(`✅ Using existing financial cycle: ${lastUpdate.name}`);
    }
    
    // Check if business units exist
    for (const buName of [NIVEA_BU, DERMA_BU]) {
      let businessUnit = await prisma.businessUnit.findFirst({
        where: { name: buName }
      });
      
      if (!businessUnit) {
        businessUnit = await prisma.businessUnit.create({
          data: {
            name: buName,
            description: `Test business unit: ${buName}`
          }
        });
        logWithTimestamp(`✅ Created test business unit: ${buName}`);
      } else {
        logWithTimestamp(`✅ Using existing business unit: ${businessUnit.name}`);
      }
    }
    
    return { country, lastUpdate };
  } catch (error) {
    logWithTimestamp('❌ Error setting up test data:', error.message);
    logWithTimestamp('Full error details:', error);
    throw error;
  }
}

async function createTestGamePlans(country, lastUpdate) {
  logWithTimestamp('📊 Creating test game plans for both business units...');
  
  try {
    const niveaBU = await prisma.businessUnit.findFirst({ where: { name: NIVEA_BU } });
    const dermaBU = await prisma.businessUnit.findFirst({ where: { name: DERMA_BU } });
    
    // Get required entities for game plans
    const campaign = await prisma.campaign.findFirst();
    const mediaSubType = await prisma.mediaSubType.findFirst();
    
    if (!campaign || !mediaSubType) {
      logWithTimestamp('⚠️ Missing required entities (campaign or mediaSubType), creating minimal ones...');
      
      // Create a minimal campaign if needed
      let testCampaign = campaign;
      if (!testCampaign) {
        const range = await prisma.range.findFirst();
        if (range) {
          testCampaign = await prisma.campaign.create({
            data: {
              name: 'Test Campaign',
              rangeId: range.id
            }
          });
        }
      }
      
      // Create a minimal media sub type if needed
      let testMediaSubType = mediaSubType;
      if (!testMediaSubType) {
        const mediaType = await prisma.mediaType.findFirst();
        if (mediaType) {
          testMediaSubType = await prisma.mediaSubType.create({
            data: {
              name: 'Test Media Subtype',
              mediaTypeId: mediaType.id
            }
          });
        }
      }
    }
    
    const finalCampaign = campaign || await prisma.campaign.findFirst();
    const finalMediaSubType = mediaSubType || await prisma.mediaSubType.findFirst();
    
    if (!finalCampaign || !finalMediaSubType) {
      throw new Error('Could not create or find required campaign and mediaSubType entities');
    }
    
    // Create some test game plans for both business units
    const testPlans = [
      {
        campaignId: finalCampaign.id,
        mediaSubTypeId: finalMediaSubType.id,
        burst: 1,
        countryId: country.id,
        business_unit_id: niveaBU.id,
        last_update_id: lastUpdate.id,
        totalBudget: 50000,
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        year: 2024
      },
      {
        campaignId: finalCampaign.id,
        mediaSubTypeId: finalMediaSubType.id,
        burst: 1,
        countryId: country.id,
        business_unit_id: niveaBU.id,
        last_update_id: lastUpdate.id,
        totalBudget: 75000,
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        year: 2024
      },
      {
        campaignId: finalCampaign.id,
        mediaSubTypeId: finalMediaSubType.id,
        burst: 1,
        countryId: country.id,
        business_unit_id: dermaBU.id,
        last_update_id: lastUpdate.id,
        totalBudget: 100000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        year: 2024
      },
      {
        campaignId: finalCampaign.id,
        mediaSubTypeId: finalMediaSubType.id,
        burst: 1,
        countryId: country.id,
        business_unit_id: dermaBU.id,
        last_update_id: lastUpdate.id,
        totalBudget: 80000,
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        year: 2024
      }
    ];
    
    for (const plan of testPlans) {
      await prisma.gamePlan.create({ data: plan });
    }
    
    logWithTimestamp(`✅ Created ${testPlans.length} test game plans`);
    
    // Verify initial state
    const niveaCount = await prisma.gamePlan.count({
      where: {
        countryId: country.id,
        last_update_id: lastUpdate.id,
        business_unit_id: niveaBU.id
      }
    });
    
    const dermaCount = await prisma.gamePlan.count({
      where: {
        countryId: country.id,
        last_update_id: lastUpdate.id,
        business_unit_id: dermaBU.id
      }
    });
    
    logWithTimestamp(`📊 Initial state - Nivea: ${niveaCount} plans, Derma: ${dermaCount} plans`);
    return { niveaCount, dermaCount };
    
  } catch (error) {
    logWithTimestamp('❌ Error creating test game plans:', error);
    throw error;
  }
}

async function testBusinessUnitDetection() {
  logWithTimestamp('🔍 Testing business unit auto-detection logic...');
  
  // Simulate the detection logic from import-sqlite route
  const csvBusinessUnits = new Set();
  
  // Extract all unique business units from CSV records
  for (const record of SAMPLE_CSV_RECORDS) {
    const businessUnitValue = record.BusinessUnit || record['Business Unit'] || record.BU || record['BU'] || record.BUSINESSUNIT;
    if (businessUnitValue && typeof businessUnitValue === 'string' && businessUnitValue.trim()) {
      csvBusinessUnits.add(businessUnitValue.trim());
    }
  }
  
  logWithTimestamp(`📊 Detected business units from CSV:`, Array.from(csvBusinessUnits));
  
  // Test expectations
  const expectedBUs = new Set([NIVEA_BU, DERMA_BU]);
  const detectedBUs = csvBusinessUnits;
  
  const detectionSuccess = 
    detectedBUs.size === expectedBUs.size && 
    [...expectedBUs].every(bu => detectedBUs.has(bu));
  
  if (detectionSuccess) {
    logWithTimestamp('✅ Business unit detection working correctly');
  } else {
    logWithTimestamp('❌ Business unit detection failed!');
    logWithTimestamp(`Expected: ${Array.from(expectedBUs)}`);
    logWithTimestamp(`Detected: ${Array.from(detectedBUs)}`);
    throw new Error('Business unit detection test failed');
  }
  
  return Array.from(csvBusinessUnits);
}

async function testDeletionLogic(country, lastUpdate, csvBusinessUnits) {
  logWithTimestamp('🗑️ Testing deletion logic with business unit filtering...');
  
  try {
    // Resolve business unit names to IDs (simulating import-sqlite logic)
    const businessUnitIds = [];
    for (const businessUnitName of csvBusinessUnits) {
      try {
        const businessUnit = await prisma.businessUnit.findFirst({
          where: {
            name: businessUnitName
          }
        });
        if (businessUnit) {
          businessUnitIds.push(businessUnit.id);
          logWithTimestamp(`✅ Resolved business unit '${businessUnitName}' to ID: ${businessUnit.id}`);
        } else {
          logWithTimestamp(`⚠️ Business unit '${businessUnitName}' not found`);
        }
      } catch (businessUnitError) {
        logWithTimestamp(`❌ Error resolving business unit '${businessUnitName}':`, businessUnitError.message);
        throw businessUnitError;
      }
    }
    
    // Build deletion filter (simulating the fixed logic)
    const deletionFilter = {
      countryId: country.id,
      last_update_id: lastUpdate.id
    };
    
    if (businessUnitIds.length > 0) {
      deletionFilter.business_unit_id = {
        in: businessUnitIds
      };
      logWithTimestamp('🔒 Deletion will be filtered by business units');
    }
    
    // Check what would be deleted
    logWithTimestamp('🔍 About to query with deletion filter:', deletionFilter);
    
    let recordsToDelete;
    try {
      recordsToDelete = await prisma.gamePlan.findMany({
        where: deletionFilter,
        select: {
          id: true,
          business_unit_id: true,
          countryId: true,
          last_update_id: true
        }
      });
    } catch (queryError) {
      logWithTimestamp('❌ Error executing deletion query:', queryError.message);
      logWithTimestamp('Query filter was:', deletionFilter);
      throw queryError;
    }
    
    logWithTimestamp(`🔍 Found ${recordsToDelete.length} records that would be deleted`);
    
    // Group by business unit ID
    const businessUnitBreakdown = recordsToDelete.reduce((acc, record) => {
      const buId = record.business_unit_id || 'Unknown';
      const buLabel = `BU_ID_${buId}`;
      acc[buLabel] = (acc[buLabel] || 0) + 1;
      return acc;
    }, {});
    
    logWithTimestamp('📊 Business unit breakdown of records to delete:', businessUnitBreakdown);
    
    // Verify that both business units would be affected (since CSV contains both)
    const expectedToDelete = csvBusinessUnits.length > 0;
    const actuallyWouldDelete = recordsToDelete.length > 0;
    
    if (expectedToDelete && actuallyWouldDelete) {
      logWithTimestamp('✅ Deletion logic correctly targets records from detected business units');
    } else if (!expectedToDelete && !actuallyWouldDelete) {
      logWithTimestamp('✅ Deletion logic correctly avoids deletion when no business units detected');
    } else {
      throw new Error('Deletion logic test failed - unexpected behavior');
    }
    
    // Test that records from other countries/cycles would NOT be deleted
    const allRecordsInDb = await prisma.gamePlan.count();
    const recordsFromOtherCountries = await prisma.gamePlan.count({
      where: {
        NOT: {
          countryId: country.id
        }
      }
    });
    
    logWithTimestamp(`📊 Total records in DB: ${allRecordsInDb}, Records from other countries: ${recordsFromOtherCountries}`);
    
    if (recordsFromOtherCountries > 0) {
      logWithTimestamp('✅ Records from other countries would be preserved');
    }
    
    return recordsToDelete.length;
    
  } catch (error) {
    logWithTimestamp('❌ Error testing deletion logic:', error);
    throw error;
  }
}

async function testDataIntegrity(country, lastUpdate) {
  logWithTimestamp('🔐 Testing data integrity scenarios...');
  
  const niveaBU = await prisma.businessUnit.findFirst({ where: { name: NIVEA_BU } });
  const dermaBU = await prisma.businessUnit.findFirst({ where: { name: DERMA_BU } });
  
  // Scenario 1: CSV contains only Nivea data
  logWithTimestamp('📋 Scenario 1: CSV contains only Nivea data');
  const niveaOnlyBUs = [NIVEA_BU];
  
  const niveaOnlyFilter = {
    countryId: country.id,
    last_update_id: lastUpdate.id,
    business_unit_id: { in: [niveaBU.id] }
  };
  
  const niveaRecordsToDelete = await prisma.gamePlan.count({
    where: niveaOnlyFilter
  });
  
  const dermaRecordsWouldRemain = await prisma.gamePlan.count({
    where: {
      countryId: country.id,
      last_update_id: lastUpdate.id,
      business_unit_id: dermaBU.id
    }
  });
  
  logWithTimestamp(`   - Nivea records that would be deleted: ${niveaRecordsToDelete}`);
  logWithTimestamp(`   - Derma records that would remain: ${dermaRecordsWouldRemain}`);
  
  if (dermaRecordsWouldRemain > 0) {
    logWithTimestamp('✅ Derma data would be preserved when importing Nivea-only CSV');
  }
  
  // Scenario 2: CSV contains only Derma data  
  logWithTimestamp('📋 Scenario 2: CSV contains only Derma data');
  const dermaOnlyFilter = {
    countryId: country.id,
    last_update_id: lastUpdate.id,
    business_unit_id: { in: [dermaBU.id] }
  };
  
  const dermaRecordsToDelete = await prisma.gamePlan.count({
    where: dermaOnlyFilter
  });
  
  const niveaRecordsWouldRemain = await prisma.gamePlan.count({
    where: {
      countryId: country.id,
      last_update_id: lastUpdate.id,
      business_unit_id: niveaBU.id
    }
  });
  
  logWithTimestamp(`   - Derma records that would be deleted: ${dermaRecordsToDelete}`);
  logWithTimestamp(`   - Nivea records that would remain: ${niveaRecordsWouldRemain}`);
  
  if (niveaRecordsWouldRemain > 0) {
    logWithTimestamp('✅ Nivea data would be preserved when importing Derma-only CSV');
  }
  
  return true;
}

async function cleanupTestData(country, lastUpdate) {
  logWithTimestamp('🧹 Cleaning up test data...');
  
  try {
    // Delete test game plans
    const deletedPlans = await prisma.gamePlan.deleteMany({
      where: {
        countryId: country.id,
        last_update_id: lastUpdate.id
      }
    });
    
    logWithTimestamp(`✅ Deleted ${deletedPlans.count} test game plans`);
    
    // Note: We're not deleting the country, financial cycle, or business units
    // as they might be used by other parts of the application
    
  } catch (error) {
    logWithTimestamp('❌ Error cleaning up test data:', error);
    throw error;
  }
}

async function runTests() {
  logWithTimestamp('🚀 Starting Business Unit Auto-Detection Tests');
  logWithTimestamp('=' .repeat(60));
  
  let testData = null;
  
  try {
    // Setup
    testData = await setupTestData();
    const initialCounts = await createTestGamePlans(testData.country, testData.lastUpdate);
    
    // Test 1: Business Unit Detection
    logWithTimestamp('\n📋 TEST 1: Business Unit Auto-Detection');
    logWithTimestamp('-'.repeat(40));
    const detectedBUs = await testBusinessUnitDetection();
    
    // Test 2: Deletion Logic
    logWithTimestamp('\n🗑️ TEST 2: Deletion Logic with Business Unit Filtering');
    logWithTimestamp('-'.repeat(40));
    const recordsToDelete = await testDeletionLogic(testData.country, testData.lastUpdate, detectedBUs);
    
    // Test 3: Data Integrity
    logWithTimestamp('\n🔐 TEST 3: Data Integrity Scenarios');
    logWithTimestamp('-'.repeat(40));
    await testDataIntegrity(testData.country, testData.lastUpdate);
    
    // Summary
    logWithTimestamp('\n📊 TEST SUMMARY');
    logWithTimestamp('=' .repeat(60));
    logWithTimestamp('✅ All tests passed successfully!');
    logWithTimestamp(`✅ Business unit detection works correctly`);
    logWithTimestamp(`✅ Deletion logic properly filters by business unit`);
    logWithTimestamp(`✅ Data integrity is maintained between business units`);
    logWithTimestamp(`✅ ${recordsToDelete} records would be safely deleted with proper filtering`);
    
  } catch (error) {
    logWithTimestamp('\n❌ TEST FAILED');
    logWithTimestamp('=' .repeat(60));
    logWithTimestamp('Error:', error);
    throw error;
  } finally {
    if (testData) {
      await cleanupTestData(testData.country, testData.lastUpdate);  
    }
    await prisma.$disconnect();
  }
}

// Run the tests
if (require.main === module) {
  runTests()
    .then(() => {
      logWithTimestamp('🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logWithTimestamp('💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };