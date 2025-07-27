import fs from 'fs';
import path from 'path';

// Read the Derma campaigns CSV
const csvPath = '/Users/naveedshah/Downloads/Derma Campaigns.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV - split by lines, then by commas
const lines = csvContent.split('\n').filter(line => line.trim());
const header = lines[0].split(',').map(col => col.trim().replace(/^﻿/, '')); // Remove BOM
const dataRows = lines.slice(1);

console.log('📊 Parsing Derma Campaigns CSV...');
console.log(`Found ${header.length} ranges and ${dataRows.length} campaign rows`);

// Build range to campaigns mapping
const rangeToCampaigns: Record<string, string[]> = {};

// Initialize all ranges with empty arrays
header.forEach(range => {
  if (range) {
    rangeToCampaigns[range] = [];
  }
});

// Process each data row
dataRows.forEach((row, rowIndex) => {
  const campaigns = row.split(',').map(campaign => campaign.trim());
  
  campaigns.forEach((campaign, colIndex) => {
    if (campaign && colIndex < header.length) {
      const range = header[colIndex];
      if (range && !rangeToCampaigns[range].includes(campaign)) {
        rangeToCampaigns[range].push(campaign);
      }
    }
  });
});

// Remove empty ranges and sort campaigns
Object.keys(rangeToCampaigns).forEach(range => {
  rangeToCampaigns[range] = rangeToCampaigns[range]
    .filter(campaign => campaign.length > 0)
    .sort();
  
  if (rangeToCampaigns[range].length === 0) {
    delete rangeToCampaigns[range];
  }
});

console.log('\n📋 Derma Range → Campaign Mappings:');
Object.entries(rangeToCampaigns).forEach(([range, campaigns]) => {
  console.log(`${range}: ${campaigns.length} campaigns`);
  console.log(`  - ${campaigns.slice(0, 3).join(', ')}${campaigns.length > 3 ? '...' : ''}`);
});

// Load current masterData.json
const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

console.log('\n🔄 Updating masterData.json with Derma campaigns...');

// Update the rangeToCampaigns section with new Derma data
Object.entries(rangeToCampaigns).forEach(([range, campaigns]) => {
  masterData.rangeToCampaigns[range] = campaigns;
  console.log(`✅ Updated "${range}" with ${campaigns.length} campaigns`);
});

// Write updated masterData.json
fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

console.log('\n✅ Successfully updated masterData.json!');
console.log(`📊 Total ranges updated: ${Object.keys(rangeToCampaigns).length}`);

// Summary of key Derma ranges
const keyDermaRanges = ['Acne', 'Anti Age', 'Anti Pigment', 'Aquaphor', 'Sun', 'Dry Skin'];
console.log('\n📝 Key Derma Ranges Summary:');
keyDermaRanges.forEach(range => {
  const campaigns = rangeToCampaigns[range] || [];
  console.log(`${range}: ${campaigns.length} campaigns`);
  if (campaigns.length > 0) {
    console.log(`  First few: ${campaigns.slice(0, 5).join(', ')}`);
  }
});