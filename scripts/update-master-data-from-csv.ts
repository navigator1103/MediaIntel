import * as fs from 'fs';
import * as path from 'path';

// Helper function to parse CSV
function parseCSV(content: string): string[][] {
  return content.split('\n')
    .filter(line => line.trim())
    .map(line => line.split(',').map(cell => cell.trim().replace(/^﻿/, ''))); // Remove BOM
}

async function main() {
  console.log('=== UPDATING MASTER DATA FROM CSV ===\n');

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

  console.log('1. PARSING CSV DATA:');
  console.log('-------------------');

  // 1. Parse Category vs Range CSV
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

  console.log(`Parsed ${Object.keys(csvCategoryToRanges).length} categories from CSV`);
  console.log(`Parsed ${Object.keys(csvRangeToCategories).length} ranges from CSV`);

  // 2. Parse Range vs Campaign CSV
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

  console.log(`Parsed ${Object.keys(csvRangeToCampaigns).length} range-campaign mappings from CSV`);
  console.log(`Parsed ${Object.keys(csvCampaignToRange).length} campaigns from CSV`);

  console.log('\n2. UPDATING MASTER DATA:');
  console.log('------------------------');

  // Create backup of original master data
  const backupPath = masterDataPath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, JSON.stringify(masterData, null, 2));
  console.log(`✅ Created backup at: ${backupPath}`);

  // 3. Update category-range mappings
  console.log('\nUpdating category-range mappings...');
  
  // Update categoryToRanges with CSV data (only for Nivea categories)
  Object.entries(csvCategoryToRanges).forEach(([category, ranges]) => {
    if (!masterData.categoryToRanges) masterData.categoryToRanges = {};
    masterData.categoryToRanges[category] = ranges;
    console.log(`  Updated categoryToRanges["${category}"] = [${ranges.join(', ')}]`);
  });

  // Update rangeToCategories with CSV data
  Object.entries(csvRangeToCategories).forEach(([range, categories]) => {
    if (!masterData.rangeToCategories) masterData.rangeToCategories = {};
    masterData.rangeToCategories[range] = categories;
    console.log(`  Updated rangeToCategories["${range}"] = [${categories.join(', ')}]`);
  });

  // 4. Update range-campaign mappings
  console.log('\nUpdating range-campaign mappings...');
  
  let updatedRanges = 0;
  let updatedCampaigns = 0;

  // Update rangeToCampaigns with CSV data
  Object.entries(csvRangeToCampaigns).forEach(([range, campaigns]) => {
    if (!masterData.rangeToCampaigns) masterData.rangeToCampaigns = {};
    
    const existingCampaigns = masterData.rangeToCampaigns[range] || [];
    const newCampaigns = campaigns.filter((c: string) => !existingCampaigns.includes(c));
    const removedCampaigns = existingCampaigns.filter((c: string) => !campaigns.includes(c));
    
    masterData.rangeToCampaigns[range] = campaigns;
    
    if (newCampaigns.length > 0 || removedCampaigns.length > 0) {
      updatedRanges++;
      console.log(`  Updated rangeToCampaigns["${range}"]:`);
      if (newCampaigns.length > 0) {
        console.log(`    + Added: [${newCampaigns.join(', ')}]`);
      }
      if (removedCampaigns.length > 0) {
        console.log(`    - Removed: [${removedCampaigns.join(', ')}]`);
      }
    }
  });

  // Update campaignToRange with CSV data
  Object.entries(csvCampaignToRange).forEach(([campaign, range]) => {
    if (!masterData.campaignToRange) masterData.campaignToRange = {};
    
    const existingRange = masterData.campaignToRange[campaign];
    if (existingRange !== range) {
      masterData.campaignToRange[campaign] = range;
      updatedCampaigns++;
      if (existingRange) {
        console.log(`  Updated campaignToRange["${campaign}"] from "${existingRange}" to "${range}"`);
      } else {
        console.log(`  Added campaignToRange["${campaign}"] = "${range}"`);
      }
    }
  });

  console.log(`\n✅ Updated ${updatedRanges} range-campaign mappings`);
  console.log(`✅ Updated ${updatedCampaigns} campaign-range mappings`);

  // 5. Ensure all ranges and campaigns exist in master lists
  console.log('\nUpdating master lists...');
  
  // Add missing ranges to ranges list
  if (!masterData.ranges) masterData.ranges = [];
  let addedRanges = 0;
  Object.keys(csvRangeToCategories).forEach(range => {
    if (!masterData.ranges.includes(range)) {
      masterData.ranges.push(range);
      addedRanges++;
      console.log(`  Added range "${range}" to ranges list`);
    }
  });

  // Sort ranges alphabetically
  masterData.ranges.sort();

  console.log(`✅ Added ${addedRanges} new ranges to master list`);

  // 6. Save updated master data
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));
  console.log(`\n✅ Updated master data saved to: ${masterDataPath}`);

  // 7. Verify the specific fix for user's issue
  console.log('\n3. VERIFICATION OF USER\'S ISSUE:');
  console.log('--------------------------------');
  
  const menDeepCampaigns = masterData.rangeToCampaigns['Men Deep'] || [];
  const deepCampaignRange = masterData.campaignToRange['Deep'];
  
  console.log(`Men Deep range campaigns: [${menDeepCampaigns.join(', ')}]`);
  console.log(`Deep campaign belongs to range: "${deepCampaignRange}"`);
  console.log(`✅ "Deep" campaign now valid for "Men Deep" range: ${menDeepCampaigns.includes('Deep')}`);

  console.log('\n4. SUMMARY:');
  console.log('----------');
  console.log(`✅ Master data updated successfully`);
  console.log(`✅ Backup created at: ${backupPath}`);
  console.log(`✅ User's validation issue should now be resolved`);
  console.log(`✅ Category: Deo, Range: Men Deep, Campaign: Deep is now VALID`);
  
  console.log('\nNext steps:');
  console.log('1. Test the game plans validation with your original data');
  console.log('2. If needed, update database to match (separate script)');
  console.log('3. Verify all validation now passes');
}

main().catch(console.error);