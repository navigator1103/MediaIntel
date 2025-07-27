import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to parse CSV
function parseCSV(content: string): string[][] {
  return content.split('\n')
    .filter(line => line.trim())
    .map(line => line.split(',').map(cell => cell.trim().replace(/^﻿/, ''))); // Remove BOM
}

async function main() {
  console.log('=== NIVEA MAPPINGS VERIFICATION ===\n');

  // Load CSV files
  const categoryVsRangePath = path.join(__dirname, '..', 'public', 'templates', 'Nivea Category VS Range.csv');
  const rangeVsCampaignPath = path.join(__dirname, '..', 'public', 'templates', 'Nivea Range vs Campaign.csv');
  
  const categoryVsRangeContent = fs.readFileSync(categoryVsRangePath, 'utf-8');
  const rangeVsCampaignContent = fs.readFileSync(rangeVsCampaignPath, 'utf-8');
  
  const categoryVsRangeData = parseCSV(categoryVsRangeContent);
  const rangeVsCampaignData = parseCSV(rangeVsCampaignContent);

  // Load master data
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // 1. Parse Category vs Range CSV
  console.log('1. CATEGORY VS RANGE ANALYSIS:');
  console.log('------------------------------');
  
  const csvCategoryToRanges: Record<string, string[]> = {};
  const csvRangeToCategories: Record<string, string[]> = {};
  
  if (categoryVsRangeData.length > 0) {
    const categories = categoryVsRangeData[0]; // Header row
    
    // Process each column (category)
    for (let colIndex = 0; colIndex < categories.length; colIndex++) {
      const category = categories[colIndex];
      if (!category) continue;
      
      csvCategoryToRanges[category] = [];
      
      // Get all ranges for this category (skip header row)
      for (let rowIndex = 1; rowIndex < categoryVsRangeData.length; rowIndex++) {
        const range = categoryVsRangeData[rowIndex][colIndex];
        if (range && range.trim()) {
          csvCategoryToRanges[category].push(range);
          
          // Build reverse mapping
          if (!csvRangeToCategories[range]) {
            csvRangeToCategories[range] = [];
          }
          csvRangeToCategories[range].push(category);
        }
      }
    }
  }

  console.log(`CSV Categories found: ${Object.keys(csvCategoryToRanges).length}`);
  console.log(`CSV Ranges found: ${Object.keys(csvRangeToCategories).length}`);

  // 2. Parse Range vs Campaign CSV
  console.log('\n2. RANGE VS CAMPAIGN ANALYSIS:');
  console.log('------------------------------');
  
  const csvRangeToCampaigns: Record<string, string[]> = {};
  const csvCampaignToRange: Record<string, string> = {};
  
  if (rangeVsCampaignData.length > 0) {
    const ranges = rangeVsCampaignData[0]; // Header row
    
    // Process each column (range)
    for (let colIndex = 0; colIndex < ranges.length; colIndex++) {
      const range = ranges[colIndex];
      if (!range) continue;
      
      csvRangeToCampaigns[range] = [];
      
      // Get all campaigns for this range (skip header row)
      for (let rowIndex = 1; rowIndex < rangeVsCampaignData.length; rowIndex++) {
        const campaign = rangeVsCampaignData[rowIndex][colIndex];
        if (campaign && campaign.trim()) {
          csvRangeToCampaigns[range].push(campaign);
          csvCampaignToRange[campaign] = range;
        }
      }
    }
  }

  console.log(`CSV Range-Campaign mappings: ${Object.keys(csvRangeToCampaigns).length}`);
  console.log(`CSV Campaigns found: ${Object.keys(csvCampaignToRange).length}`);

  // 3. Compare with Master Data
  console.log('\n3. MASTER DATA COMPARISON:');
  console.log('-------------------------');
  
  const masterCategoryToRanges = masterData.categoryToRanges || {};
  const masterRangeToCategories = masterData.rangeToCategories || {};
  const masterRangeToCampaigns = masterData.rangeToCampaigns || {};
  const masterCampaignToRange = masterData.campaignToRange || {};

  // Category-Range discrepancies
  const categoryRangeDiffs: string[] = [];
  
  // Check categories in CSV vs Master
  Object.entries(csvCategoryToRanges).forEach(([category, csvRanges]) => {
    const masterRanges = masterCategoryToRanges[category] || [];
    
    // Ranges in CSV but not in master
    const missingInMaster = csvRanges.filter((range: string) => !masterRanges.includes(range));
    if (missingInMaster.length > 0) {
      categoryRangeDiffs.push(`Category "${category}": CSV has ranges [${missingInMaster.join(', ')}] missing from master data`);
    }
    
    // Ranges in master but not in CSV
    const extraInMaster = masterRanges.filter((range: string) => !csvRanges.includes(range));
    if (extraInMaster.length > 0) {
      categoryRangeDiffs.push(`Category "${category}": Master has ranges [${extraInMaster.join(', ')}] missing from CSV`);
    }
  });

  // Check for categories in master but not in CSV
  Object.keys(masterCategoryToRanges).forEach((category: string) => {
    if (!csvCategoryToRanges[category]) {
      categoryRangeDiffs.push(`Category "${category}": Exists in master but missing from CSV`);
    }
  });

  console.log(`Category-Range discrepancies: ${categoryRangeDiffs.length}`);
  if (categoryRangeDiffs.length > 0) {
    categoryRangeDiffs.forEach(diff => console.log(`  - ${diff}`));
  }

  // Range-Campaign discrepancies
  const rangeCampaignDiffs: string[] = [];
  
  Object.entries(csvRangeToCampaigns).forEach(([range, csvCampaigns]) => {
    const masterCampaigns = masterRangeToCampaigns[range] || [];
    
    // Campaigns in CSV but not in master
    const missingInMaster = csvCampaigns.filter((campaign: string) => !masterCampaigns.includes(campaign));
    if (missingInMaster.length > 0) {
      rangeCampaignDiffs.push(`Range "${range}": CSV has campaigns [${missingInMaster.join(', ')}] missing from master data`);
    }
    
    // Campaigns in master but not in CSV
    const extraInMaster = masterCampaigns.filter((campaign: string) => !csvCampaigns.includes(campaign));
    if (extraInMaster.length > 0) {
      rangeCampaignDiffs.push(`Range "${range}": Master has campaigns [${extraInMaster.join(', ')}] missing from CSV`);
    }
  });

  console.log(`\nRange-Campaign discrepancies: ${rangeCampaignDiffs.length}`);
  if (rangeCampaignDiffs.length > 0) {
    rangeCampaignDiffs.slice(0, 10).forEach(diff => console.log(`  - ${diff}`));
    if (rangeCampaignDiffs.length > 10) {
      console.log(`  ... and ${rangeCampaignDiffs.length - 10} more`);
    }
  }

  // 4. Specific check for user's issue: Men Deep
  console.log('\n4. SPECIFIC ANALYSIS: "Men Deep" RANGE:');
  console.log('--------------------------------------');
  
  const csvMenDeepCategories = csvRangeToCategories['Men Deep'] || [];
  const csvMenDeepCampaigns = csvRangeToCampaigns['Men Deep'] || [];
  const masterMenDeepCategories = masterRangeToCategories['Men Deep'] || [];
  const masterMenDeepCampaigns = masterRangeToCampaigns['Men Deep'] || [];
  
  console.log('Men Deep analysis:');
  console.log(`  CSV Categories: [${csvMenDeepCategories.join(', ')}]`);
  console.log(`  CSV Campaigns: [${csvMenDeepCampaigns.join(', ')}]`);
  console.log(`  Master Categories: [${masterMenDeepCategories.join(', ')}]`);
  console.log(`  Master Campaigns: [${masterMenDeepCampaigns.join(', ')}]`);
  
  // Check if "Deep" campaign is valid for Men Deep in CSV
  const deepValidForMenDeep = csvMenDeepCampaigns.includes('Deep');
  console.log(`  "Deep" campaign valid for "Men Deep" range in CSV: ${deepValidForMenDeep}`);
  
  // 5. Check database consistency
  console.log('\n5. DATABASE VERIFICATION:');
  console.log('------------------------');
  
  try {
    // Get categories from database
    const dbCategories = await prisma.category.findMany({
      include: {
        ranges: {
          include: {
            range: {
              include: {
                campaigns: true
              }
            }
          }
        }
      }
    });
    
    // Get ranges from database
    const dbRanges = await prisma.range.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        },
        campaigns: true
      }
    });
    
    // Get campaigns from database
    const dbCampaigns = await prisma.campaign.findMany({
      include: {
        range: true
      }
    });
    
    console.log(`Database categories: ${dbCategories.length}`);
    console.log(`Database ranges: ${dbRanges.length}`);
    console.log(`Database campaigns: ${dbCampaigns.length}`);
    
    // Check Men Deep in database
    const dbMenDeepRange = dbRanges.find(r => r.name === 'Men Deep');
    if (dbMenDeepRange) {
      const dbMenDeepCategories = dbMenDeepRange.categories.map(c => c.category.name);
      const dbMenDeepCampaigns = dbMenDeepRange.campaigns.map(c => c.name);
      
      console.log('\nDatabase Men Deep analysis:');
      console.log(`  DB Categories: [${dbMenDeepCategories.join(', ')}]`);
      console.log(`  DB Campaigns: [${dbMenDeepCampaigns.join(', ')}]`);
      
      // Check if Deep campaign exists for Men Deep in database
      const deepCampaignInDb = dbMenDeepCampaigns.includes('Deep');
      console.log(`  "Deep" campaign exists for "Men Deep" in DB: ${deepCampaignInDb}`);
    } else {
      console.log('\n"Men Deep" range not found in database');
    }
    
    // Check if Deep campaign exists in database at all
    const deepCampaignDb = dbCampaigns.find(c => c.name === 'Deep');
    if (deepCampaignDb) {
      console.log(`\n"Deep" campaign in database belongs to range: "${deepCampaignDb.range?.name}"`);
    } else {
      console.log('\n"Deep" campaign not found in database');
    }
    
  } catch (error) {
    console.log('Database connection error:', error);
  }

  // 6. Recommendations
  console.log('\n6. RECOMMENDATIONS:');
  console.log('------------------');
  
  console.log('\nFor the user\'s specific issue (Category: Deo, Range: Men Deep, Campaign: Deep):');
  
  if (csvMenDeepCategories.includes('Deo') && csvMenDeepCampaigns.includes('Deep')) {
    console.log('  ✅ According to CSV files, this combination should be VALID');
    console.log('  💡 Master data needs to be updated to match CSV authoritative source');
  } else {
    console.log('  ❌ Even CSV files don\'t support this combination');
    console.log(`  📋 CSV valid categories for Men Deep: [${csvMenDeepCategories.join(', ')}]`);
    console.log(`  📋 CSV valid campaigns for Men Deep: [${csvMenDeepCampaigns.join(', ')}]`);
  }
  
  console.log('\nNext steps:');
  console.log('  1. Use CSV files as authoritative source');
  console.log('  2. Update master data to match CSV mappings');
  console.log('  3. Update database to match CSV mappings');
  console.log('  4. Re-run validation tests');

  await prisma.$disconnect();
}

main().catch(console.error);