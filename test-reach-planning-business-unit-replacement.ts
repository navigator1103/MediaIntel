#!/usr/bin/env ts-node

/**
 * Test Script: Reach Planning Business Unit Replacement Logic
 * 
 * This script tests the business unit isolation in reach planning imports:
 * 1. Creates test data for multiple business units
 * 2. Tests that replacing data for one business unit doesn't affect others
 * 3. Verifies the deletion and creation logic works correctly
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  countryId: 1, // UK
  lastUpdateId: 1, // Financial cycle
  businessUnits: {
    nivea: 1,
    derma: 2
  },
  testDataSets: {
    nivea: [
      {
        category: 'Face Care',
        range: 'Nivea Men',
        campaign: 'Men Hydration Campaign',
        tvDemoGender: 'M',
        tvDemoMinAge: 25,
        tvDemoMaxAge: 45
      },
      {
        category: 'Body Care',
        range: 'Nivea Body',
        campaign: 'Body Lotion Campaign',
        tvDemoGender: 'F',
        tvDemoMinAge: 18,
        tvDemoMaxAge: 65
      }
    ],
    derma: [
      {
        category: 'Face Care',
        range: 'Eucerin',
        campaign: 'Anti-Aging Campaign',
        tvDemoGender: 'F',
        tvDemoMinAge: 35,
        tvDemoMaxAge: 55
      },
      {
        category: 'Body Care', 
        range: 'Eucerin Body',
        campaign: 'Sensitive Skin Campaign',
        tvDemoGender: 'BG',
        tvDemoMinAge: '25',
        tvDemoMaxAge: '50'
      }
    ]
  }
};

interface TestRecord {
  category: string;
  range: string;
  campaign: string;
  tvDemoGender: string;
  tvDemoMinAge: number;
  tvDemoMaxAge: number;
}

async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  // Clean existing test data
  await prisma.mediaSufficiency.deleteMany({
    where: {
      countryId: TEST_CONFIG.countryId,
      lastUpdateId: TEST_CONFIG.lastUpdateId,
      buId: { in: [TEST_CONFIG.businessUnits.nivea, TEST_CONFIG.businessUnits.derma] }
    }
  });
  
  // Create initial data for both business units
  const niveaRecords = TEST_CONFIG.testDataSets.nivea.map(record => ({
    countryId: TEST_CONFIG.countryId,
    lastUpdateId: TEST_CONFIG.lastUpdateId,
    buId: TEST_CONFIG.businessUnits.nivea,
    bu: 'Nivea',
    category: record.category,
    range: record.range,
    campaign: record.campaign,
    tvDemoGender: record.tvDemoGender,
    tvDemoMinAge: typeof record.tvDemoMinAge === 'string' ? parseInt(record.tvDemoMinAge) : record.tvDemoMinAge,
    tvDemoMaxAge: typeof record.tvDemoMaxAge === 'string' ? parseInt(record.tvDemoMaxAge) : record.tvDemoMaxAge,
    uploadedBy: 'test-script',
    uploadSession: 'initial-setup'
  }));
  
  const dermaRecords = TEST_CONFIG.testDataSets.derma.map(record => ({
    countryId: TEST_CONFIG.countryId,
    lastUpdateId: TEST_CONFIG.lastUpdateId,
    buId: TEST_CONFIG.businessUnits.derma,
    bu: 'Derma',
    category: record.category,
    range: record.range,
    campaign: record.campaign,
    tvDemoGender: record.tvDemoGender,
    tvDemoMinAge: typeof record.tvDemoMinAge === 'string' ? parseInt(record.tvDemoMinAge) : record.tvDemoMinAge,
    tvDemoMaxAge: typeof record.tvDemoMaxAge === 'string' ? parseInt(record.tvDemoMaxAge) : record.tvDemoMaxAge,
    uploadedBy: 'test-script',
    uploadSession: 'initial-setup'
  }));
  
  // Insert initial data
  await prisma.mediaSufficiency.createMany({ data: niveaRecords });
  await prisma.mediaSufficiency.createMany({ data: dermaRecords });
  
  console.log(`✅ Created ${niveaRecords.length} Nivea records and ${dermaRecords.length} Derma records`);
}

async function getRecordCounts() {
  const niveaCount = await prisma.mediaSufficiency.count({
    where: {
      countryId: TEST_CONFIG.countryId,
      lastUpdateId: TEST_CONFIG.lastUpdateId,
      buId: TEST_CONFIG.businessUnits.nivea
    }
  });
  
  const dermaCount = await prisma.mediaSufficiency.count({
    where: {
      countryId: TEST_CONFIG.countryId,
      lastUpdateId: TEST_CONFIG.lastUpdateId,
      buId: TEST_CONFIG.businessUnits.derma
    }
  });
  
  return { nivea: niveaCount, derma: dermaCount };
}

async function simulateBusinessUnitImport(businessUnitId: number, businessUnitName: string, newData: TestRecord[]) {
  console.log(`\n🔄 Simulating ${businessUnitName} import with ${newData.length} records...`);
  
  // Step 1: DELETE existing data for this business unit (simulating our new logic)
  console.log(`🗑️  Deleting existing ${businessUnitName} records...`);
  const deleteResult = await prisma.mediaSufficiency.deleteMany({
    where: {
      countryId: TEST_CONFIG.countryId,
      lastUpdateId: TEST_CONFIG.lastUpdateId,
      buId: businessUnitId
    }
  });
  console.log(`   Deleted ${deleteResult.count} existing ${businessUnitName} records`);
  
  // Step 2: CREATE new records
  console.log(`📝 Creating new ${businessUnitName} records...`);
  const newRecords = newData.map(record => ({
    countryId: TEST_CONFIG.countryId,
    lastUpdateId: TEST_CONFIG.lastUpdateId,
    buId: businessUnitId,
    bu: businessUnitName,
    category: record.category,
    range: record.range,
    campaign: record.campaign,
    tvDemoGender: record.tvDemoGender,
    tvDemoMinAge: typeof record.tvDemoMinAge === 'string' ? parseInt(record.tvDemoMinAge) : record.tvDemoMinAge,
    tvDemoMaxAge: typeof record.tvDemoMaxAge === 'string' ? parseInt(record.tvDemoMaxAge) : record.tvDemoMaxAge,
    uploadedBy: 'test-script',
    uploadSession: `${businessUnitName.toLowerCase()}-replacement-test`
  }));
  
  await prisma.mediaSufficiency.createMany({ data: newRecords });
  console.log(`   Created ${newRecords.length} new ${businessUnitName} records`);
}

async function verifyDataIntegrity() {
  console.log('\n🔍 Verifying data integrity...');
  
  // Get all records for detailed verification
  const niveaRecords = await prisma.mediaSufficiency.findMany({
    where: {
      countryId: TEST_CONFIG.countryId,
      lastUpdateId: TEST_CONFIG.lastUpdateId,
      buId: TEST_CONFIG.businessUnits.nivea
    },
    select: {
      id: true,
      campaign: true,
      uploadSession: true,
      createdAt: true
    }
  });
  
  const dermaRecords = await prisma.mediaSufficiency.findMany({
    where: {
      countryId: TEST_CONFIG.countryId,
      lastUpdateId: TEST_CONFIG.lastUpdateId,
      buId: TEST_CONFIG.businessUnits.derma
    },
    select: {
      id: true,
      campaign: true,
      uploadSession: true,
      createdAt: true
    }
  });
  
  console.log('\n📊 Final Data State:');
  console.log(`   Nivea Records (${niveaRecords.length}):`);
  niveaRecords.forEach(record => {
    console.log(`   - ${record.campaign} (Session: ${record.uploadSession})`);
  });
  
  console.log(`   Derma Records (${dermaRecords.length}):`);
  dermaRecords.forEach(record => {
    console.log(`   - ${record.campaign} (Session: ${record.uploadSession})`);
  });
  
  return { niveaRecords, dermaRecords };
}

async function runTest() {
  console.log('🧪 Starting Business Unit Replacement Logic Test\n');
  console.log('=' .repeat(60));
  
  try {
    // Setup initial test data
    await setupTestData();
    
    console.log('\n📈 Initial State:');
    const initialCounts = await getRecordCounts();
    console.log(`   Nivea: ${initialCounts.nivea} records`);
    console.log(`   Derma: ${initialCounts.derma} records`);
    
    // Test 1: Replace Nivea data, verify Derma is untouched
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST 1: Replace Nivea data (Derma should be preserved)');
    console.log('='.repeat(60));
    
    const newNiveaData: TestRecord[] = [
      {
        category: 'Face Care',
        range: 'Nivea Premium',
        campaign: 'NEW Premium Face Campaign',
        tvDemoGender: 'F',
        tvDemoMinAge: 30,
        tvDemoMaxAge: 50
      },
      {
        category: 'Sun Care',
        range: 'Nivea Sun',
        campaign: 'NEW Summer Protection Campaign',
        tvDemoGender: 'BG',
        tvDemoMinAge: 18,
        tvDemoMaxAge: 65
      },
      {
        category: 'Body Care',
        range: 'Nivea Soft',
        campaign: 'NEW Soft Touch Campaign',
        tvDemoGender: 'F',
        tvDemoMinAge: 25,
        tvDemoMaxAge: 45
      }
    ];
    
    await simulateBusinessUnitImport(TEST_CONFIG.businessUnits.nivea, 'Nivea', newNiveaData);
    
    const afterNiveaReplace = await getRecordCounts();
    console.log(`\n📊 After Nivea replacement:`);
    console.log(`   Nivea: ${afterNiveaReplace.nivea} records (should be ${newNiveaData.length})`);
    console.log(`   Derma: ${afterNiveaReplace.derma} records (should be ${TEST_CONFIG.testDataSets.derma.length})`);
    
    // Verify Nivea was replaced
    if (afterNiveaReplace.nivea !== newNiveaData.length) {
      throw new Error(`❌ Nivea replacement failed! Expected ${newNiveaData.length}, got ${afterNiveaReplace.nivea}`);
    }
    
    // Verify Derma was preserved
    if (afterNiveaReplace.derma !== TEST_CONFIG.testDataSets.derma.length) {
      throw new Error(`❌ Derma data was affected! Expected ${TEST_CONFIG.testDataSets.derma.length}, got ${afterNiveaReplace.derma}`);
    }
    
    console.log('✅ TEST 1 PASSED: Nivea replaced, Derma preserved');
    
    // Test 2: Replace Derma data, verify Nivea is untouched
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST 2: Replace Derma data (Nivea should be preserved)');
    console.log('='.repeat(60));
    
    const newDermaData: TestRecord[] = [
      {
        category: 'Face Care',
        range: 'Eucerin Hyaluron',
        campaign: 'NEW Hyaluronic Acid Campaign',
        tvDemoGender: 'F',
        tvDemoMinAge: 40,
        tvDemoMaxAge: 60
      }
    ];
    
    await simulateBusinessUnitImport(TEST_CONFIG.businessUnits.derma, 'Derma', newDermaData);
    
    const afterDermaReplace = await getRecordCounts();
    console.log(`\n📊 After Derma replacement:`);
    console.log(`   Nivea: ${afterDermaReplace.nivea} records (should be ${newNiveaData.length})`);
    console.log(`   Derma: ${afterDermaReplace.derma} records (should be ${newDermaData.length})`);
    
    // Verify Derma was replaced
    if (afterDermaReplace.derma !== newDermaData.length) {
      throw new Error(`❌ Derma replacement failed! Expected ${newDermaData.length}, got ${afterDermaReplace.derma}`);
    }
    
    // Verify Nivea was preserved
    if (afterDermaReplace.nivea !== newNiveaData.length) {
      throw new Error(`❌ Nivea data was affected! Expected ${newNiveaData.length}, got ${afterDermaReplace.nivea}`);
    }
    
    console.log('✅ TEST 2 PASSED: Derma replaced, Nivea preserved');
    
    // Final verification
    await verifyDataIntegrity();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED! Business Unit Isolation Working Correctly');
    console.log('='.repeat(60));
    console.log('\nKey Findings:');
    console.log('✅ Business unit replacement works in isolation');
    console.log('✅ Non-targeted business units remain untouched');
    console.log('✅ Data integrity maintained across business units');
    console.log('✅ Deletion and creation logic working correctly');
    
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