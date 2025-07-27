#!/usr/bin/env ts-node

/**
 * Test script to verify SOV position calculation and save/load functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSOVPositions() {
  console.log('🧪 Testing SOV Position Calculation and Save/Load');
  console.log('================================================');

  try {
    // Test data that simulates the issue: Loreal appears twice (position 1 and at end)
    const testData = [
      // Acne category - first 6 entries
      { category: 'Acne', company: 'Eucerin', totalDigitalSpend: 1000000, totalDigitalImpressions: 5000000 },
      { category: 'Acne', company: 'Loreal', totalDigitalSpend: 800000, totalDigitalImpressions: 4000000 }, // Position 1
      { category: 'Acne', company: 'Competitor 2', totalDigitalSpend: 0, totalDigitalImpressions: 0 },
      { category: 'Acne', company: 'Competitor 3', totalDigitalSpend: 0, totalDigitalImpressions: 0 },
      { category: 'Acne', company: 'Competitor 4', totalDigitalSpend: 0, totalDigitalImpressions: 0 },
      { category: 'Acne', company: 'Competitor 5', totalDigitalSpend: 0, totalDigitalImpressions: 0 },

      // Anti Age category
      { category: 'Anti Age', company: 'Eucerin', totalDigitalSpend: 500000, totalDigitalImpressions: 2500000 },
      { category: 'Anti Age', company: 'Competitor 1', totalDigitalSpend: 0, totalDigitalImpressions: 0 },
      { category: 'Anti Age', company: 'Competitor 2', totalDigitalSpend: 0, totalDigitalImpressions: 0 },

      // DUPLICATE: Loreal appears again at the end (simulating the React state issue)
      { category: 'Acne', company: 'Loreal', totalDigitalSpend: 800000, totalDigitalImpressions: 4000000 } // Duplicate!
    ];

    console.log('📤 Test data (simulating duplicate Loreal issue):');
    testData.forEach((row, index) => {
      console.log(`  ${index}: ${row.category} - ${row.company}`);
    });

    // Test the position calculation logic (simulate what the API does)
    console.log('\n🔄 Testing position calculation logic...');
    
    const categorizedData = new Map<string, any[]>();
    
    // Group by category
    testData.forEach((row: any) => {
      if (!categorizedData.has(row.category)) {
        categorizedData.set(row.category, []);
      }
      categorizedData.get(row.category)!.push(row);
    });
    
    // Remove duplicates within each category (keep first occurrence)
    categorizedData.forEach((rows, category) => {
      const uniqueRows = [];
      const seenCompanies = new Set<string>();
      
      for (const row of rows) {
        if (!seenCompanies.has(row.company)) {
          seenCompanies.add(row.company);
          uniqueRows.push(row);
        } else {
          console.log(`  ⚠️  Removing duplicate: ${category} - ${row.company}`);
        }
      }
      categorizedData.set(category, uniqueRows);
    });
    
    // Show position assignments
    console.log('\n📍 Position assignments after deduplication:');
    categorizedData.forEach((rows, category) => {
      console.log(`  ${category}:`);
      rows.forEach((row, position) => {
        console.log(`    Position ${position}: ${row.company}`);
      });
    });

    // Test with actual database if we have a test country/business unit
    const testCountry = await prisma.country.findFirst();
    const testBusinessUnit = await prisma.businessUnit.findFirst();

    if (testCountry && testBusinessUnit) {
      console.log(`\n💾 Testing database save/load with Country: ${testCountry.name}, BU: ${testBusinessUnit.name}`);
      
      // Clear existing test data
      await prisma.shareOfVoice.deleteMany({
        where: {
          countryId: testCountry.id,
          businessUnitId: testBusinessUnit.id,
          uploadSession: { contains: 'test-position' }
        }
      });

      // Transform and save data with positions
      const transformedData: any[] = [];
      categorizedData.forEach((rows, category) => {
        rows.forEach((row: any, positionInCategory: number) => {
          transformedData.push({
            countryId: testCountry.id,
            businessUnitId: testBusinessUnit.id,
            category: row.category,
            company: row.company,
            position: positionInCategory,
            totalDigitalSpend: row.totalDigitalSpend,
            totalDigitalImpressions: row.totalDigitalImpressions,
            totalTvInvestment: null,
            totalTvTrps: null,
            uploadedBy: 'test-script',
            uploadSession: 'test-position-fix'
          });
        });
      });

      console.log(`\n💾 Saving ${transformedData.length} records to database...`);
      
      // Save each record
      for (const record of transformedData) {
        const existing = await prisma.shareOfVoice.findFirst({
          where: {
            countryId: record.countryId,
            businessUnitId: record.businessUnitId,
            category: record.category,
            position: record.position
          }
        });

        if (existing) {
          await prisma.shareOfVoice.update({
            where: { id: existing.id },
            data: record
          });
        } else {
          await prisma.shareOfVoice.create({
            data: record
          });
        }
      }

      console.log('✅ Data saved successfully!');

      // Test loading the data back
      console.log('\n📥 Loading data back from database...');
      const loadedData = await prisma.shareOfVoice.findMany({
        where: {
          countryId: testCountry.id,
          businessUnitId: testBusinessUnit.id,
          uploadSession: 'test-position-fix'
        },
        orderBy: [
          { category: 'asc' },
          { position: 'asc' }
        ]
      });

      console.log(`📊 Loaded ${loadedData.length} records:`);
      let currentCategory = '';
      loadedData.forEach(record => {
        if (record.category !== currentCategory) {
          currentCategory = record.category;
          console.log(`\n  ${currentCategory}:`);
        }
        console.log(`    Position ${record.position}: ${record.company}`);
      });

      // Verify Loreal is in position 1 of Acne category
      const lorealRecord = loadedData.find(r => r.category === 'Acne' && r.company === 'Loreal');
      if (lorealRecord) {
        if (lorealRecord.position === 1) {
          console.log('\n✅ SUCCESS: Loreal is correctly at position 1 in Acne category!');
        } else {
          console.log(`\n❌ FAIL: Loreal is at position ${lorealRecord.position}, expected position 1`);
        }
      } else {
        console.log('\n❌ FAIL: Loreal record not found in loaded data');
      }

      // Cleanup
      await prisma.shareOfVoice.deleteMany({
        where: {
          countryId: testCountry.id,
          businessUnitId: testBusinessUnit.id,
          uploadSession: 'test-position-fix'
        }
      });
      console.log('\n🧹 Cleaned up test data');

    } else {
      console.log('\n⚠️  No test country/business unit found, skipping database test');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🏁 Test completed!');
}

testSOVPositions();