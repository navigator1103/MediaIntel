import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function testReachPlanningExport() {
  try {
    console.log('🔍 Testing reach planning export functionality...\n');

    // Find countries and financial cycles that have game plans
    const gamePlansWithCountriesAndCycles = await prisma.gamePlan.findMany({
      distinct: ['countryId', 'last_update_id'],
      select: {
        countryId: true,
        last_update_id: true,
        country: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 10 // Limit to first 10 combinations
    });

    console.log(`📊 Found ${gamePlansWithCountriesAndCycles.length} country-financial cycle combinations with game plans`);

    if (gamePlansWithCountriesAndCycles.length === 0) {
      console.log('❌ No game plans found in database. Cannot test export.');
      return;
    }

    // Use the first combination for testing
    const testCountryId = gamePlansWithCountriesAndCycles[0].countryId;
    const testLastUpdateId = gamePlansWithCountriesAndCycles[0].last_update_id;
    const countryName = gamePlansWithCountriesAndCycles[0].country?.name || 'unknown';

    console.log(`🎯 Testing with Country: ${countryName} (ID: ${testCountryId}), Financial Cycle ID: ${testLastUpdateId}`);

    // Count game plans for this combination
    const gamePlansCount = await prisma.gamePlan.count({
      where: {
        countryId: testCountryId,
        last_update_id: testLastUpdateId
      }
    });

    console.log(`📋 Found ${gamePlansCount} game plans for this combination`);

    // Create the request data
    const exportRequest = {
      countryId: testCountryId,
      lastUpdateId: testLastUpdateId
    };

    console.log('🚀 Making export request...');

    // Simulate the export API call (since we can't easily call the API directly)
    // Instead, let's implement the export logic directly
    const gamePlans = await prisma.gamePlan.findMany({
      where: {
        countryId: testCountryId,
        last_update_id: testLastUpdateId
      },
      include: {
        campaign: {
          include: {
            range: {
              include: {
                categories: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        },
        country: true,
        mediaSubType: {
          include: {
            mediaType: true
          }
        },
        pmType: true,
        category: true
      }
    });

    console.log(`📊 Retrieved ${gamePlans.length} game plans for export`);

    // Consolidate game plans by unique combination of Country + Category + Range + Campaign
    const consolidatedMap = new Map();

    gamePlans.forEach(plan => {
      const country = plan.country?.name || '';
      const category = plan.category?.name || 
                      (plan.campaign?.range?.categories && plan.campaign.range.categories.length > 0 
                        ? plan.campaign.range.categories[0].category.name 
                        : '') || '';
      const range = plan.campaign?.range?.name || '';
      const campaign = plan.campaign?.name || '';
      
      const key = `${country}|${category}|${range}|${campaign}`;
      
      if (!consolidatedMap.has(key)) {
        consolidatedMap.set(key, {
          country: country,
          category: category,
          range: range,
          campaign: campaign,
          _sourceBursts: [plan.burst || 1],
          _sourceGamePlans: [plan.id]
        });
      } else {
        const existing = consolidatedMap.get(key);
        existing._sourceBursts.push(plan.burst || 1);
        existing._sourceGamePlans.push(plan.id);
      }
    });

    const consolidatedData = Array.from(consolidatedMap.values());
    console.log(`📊 Consolidated to ${consolidatedData.length} unique campaign combinations`);

    // Generate CSV content - only required reach planning fields
    const headers = [
      'Category', 'Range', 'Campaign',
      'TV Demo Gender', 'TV Demo Min. Age', 'TV Demo Max. Age', 'TV SEL', 
      'Final TV Target (don\'t fill)', 'TV Target Size', 'TV Copy Length',
      'Total TV Planned R1+ (%)', 'Total TV Planned R3+ (%)', 'TV Potential R1+',
      'CPP 2024', 'CPP 2025', 'CPP 2026', 'Reported Currency',
      'Is Digital target the same than TV?', 'Digital Demo Gender', 'Digital Demo Min. Age', 
      'Digital Demo Max. Age', 'Digital SEL', 'Final Digital Target (don\'t fill)',
      'Digital Target Size (Abs)', 'Total Digital Planned R1+', 'Total Digital Potential R1+',
      'Planned Combined Reach', 'Combined Potential Reach'
    ];

    const csvRows = [
      headers.join(','),
      ...consolidatedData.map(item => [
        item.category,
        item.range,
        item.campaign,
        '', // TV Demo Gender - empty for user to fill
        '', // TV Demo Min. Age - empty for user to fill
        '', // TV Demo Max. Age - empty for user to fill
        '', // TV SEL - empty for user to fill
        '', // Final TV Target (don't fill) - empty
        '', // TV Target Size - empty for user to fill
        '', // TV Copy Length - empty for user to fill
        '', // Total TV Planned R1+ (%) - empty for user to fill
        '', // Total TV Planned R3+ (%) - empty for user to fill
        '', // TV Potential R1+ - empty for user to fill
        '', // CPP 2024 - empty for user to fill
        '', // CPP 2025 - empty for user to fill
        '', // CPP 2026 - empty for user to fill
        '', // Reported Currency - empty for user to fill
        '', // Is Digital target the same than TV? - empty for user to fill
        '', // Digital Demo Gender - empty for user to fill
        '', // Digital Demo Min. Age - empty for user to fill
        '', // Digital Demo Max. Age - empty for user to fill
        '', // Digital SEL - empty for user to fill
        '', // Final Digital Target (don't fill) - empty
        '', // Digital Target Size (Abs) - empty for user to fill
        '', // Total Digital Planned R1+ - empty for user to fill
        '', // Total Digital Potential R1+ - empty for user to fill
        '', // Planned Combined Reach - empty for user to fill
        '' // Combined Potential Reach - empty for user to fill
      ].map(field => `"${field}"`).join(','))
    ];

    const csvContent = csvRows.join('\n');

    // Save the exported CSV to test-data directory
    const testDataDir = path.join(process.cwd(), 'test-data', 'reach-planning');
    
    // Ensure directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    const fileName = `reach-planning-export-from-game-plans-${countryName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = path.join(testDataDir, fileName);

    fs.writeFileSync(filePath, csvContent);

    console.log(`✅ Export completed successfully!`);
    console.log(`📁 File saved to: ${filePath}`);
    console.log(`📊 Contains ${consolidatedData.length} campaigns from ${gamePlansCount} game plan entries`);

    // Show a sample of the exported data
    console.log('\n📋 Sample exported campaigns:');
    consolidatedData.slice(0, 5).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.category} > ${item.range} > ${item.campaign}`);
    });

    console.log(`\n🎯 File ready for testing reach planning upload workflow!`);
    console.log(`   Use this file to test the reach planning upload and validation process.`);

  } catch (error) {
    console.error('❌ Error testing reach planning export:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReachPlanningExport();