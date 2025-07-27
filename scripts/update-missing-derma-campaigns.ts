import fs from 'fs';
import path from 'path';

async function updateMissingDermaCampaigns() {
  console.log('🔄 UPDATING: Master Data with Missing Derma Campaigns\n');

  // Load current masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log(`📊 Current master data has ${Object.keys(masterData.campaignToRangeMap || {}).length} campaigns`);

  // Missing campaigns to add (based on the analysis)
  const missingCampaigns = {
    // Anti Pigment - 11 missing campaigns
    "Globe": "Anti Pigment",  // Simplified from "Globe - Body"
    "Avengers": "Anti Pigment", // Already exists, but updating reference
    "Thiamidol Roof": "Anti Pigment", // Simplified from "Thiamidol Roof - Face & Body"
    "Boosting Essence": "Anti Pigment", // Simplified from "Dragon (Boosting Essence)"
    "Eyes (KFP)": "Anti Pigment", // Already exists as "Eyes (KFP)" - should map to Anti Pigment
    "Power Duo (Avengers + Gel)": "Anti Pigment", // Simplified from "Power Duo (Serum + Gel)"
    "Anti-Pigment Range": "Anti Pigment", // Simplified from "Anti-Pigment Range - Face"
    "Bridge Campaign - Body AP": "Anti Pigment",
    "Alice - Body": "Anti Pigment", 
    "Trilogy RL": "Anti Pigment",
    "Bridge Campaign - Face": "Anti Pigment",

    // Anti Age - 7 missing campaigns
    "Gold Revamp": "Anti Age", // Already exists but may need to be confirmed
    "3D Serum + Dragon": "Anti Age", // Already exists but may need to be confirmed  
    "Club55 Serum": "Anti Age",
    "Epigenetics (Benjamin Button)": "Anti Age",
    "Epigenetics (Epi 2.0)": "Anti Age", 
    "Epigenius RL": "Anti Age",
    "Refillution": "Anti Age",

    // Sun - 2 missing campaigns
    "Sun Oil Control": "Sun", // Simplified from "Sun Oil Control Core"
    "Superstar": "Sun",

    // X-Cat - 4 missing campaigns  
    "Yo voy al derm": "X-Cat",
    "Customers AWON": "X-Cat",
    "Lead Capturing AWON": "X-Cat", 
    "Eucerin brand AWON": "X-Cat"
  };

  // Also need to fix existing mappings that are in wrong ranges
  const rangeFixes = {
    // These should be in Dry Skin but are mapped to other ranges
    "Search AWON": "Dry Skin", // Currently mapped to "Body Range"
    "Body Roof": "Dry Skin", // Currently mapped to "Repair"  
    "Urea": "Dry Skin", // Currently mapped to "Body Lotion"
    "Body Lotion": "Dry Skin", // Currently mapped to "Body Lotion"
    "pH5 Wannabe": "Dry Skin", // Currently mapped to "pH5"
    "Atopi": "Dry Skin", // Currently mapped to "Atopi"

    // These should be in X-Cat but are mapped to other ranges
    "Club Eucerin": "X-Cat", // Currently mapped to "Brand (Institutional)"
    "Brand (Institutional)": "X-Cat" // Currently mapped to "Brand (Institutional)"
  };

  console.log(`\n📝 Adding ${Object.keys(missingCampaigns).length} missing campaigns...`);
  console.log(`🔧 Fixing ${Object.keys(rangeFixes).length} existing mappings...`);

  // Create backup
  const backupPath = masterDataPath + `.backup.${Date.now()}`;
  fs.writeFileSync(backupPath, JSON.stringify(masterData, null, 2));
  console.log(`💾 Backup created: ${backupPath}`);

  // Update campaignToRangeMap
  const updatedCampaignToRangeMap = { 
    ...masterData.campaignToRangeMap, 
    ...missingCampaigns,
    ...rangeFixes
  };

  // Update the master data object
  masterData.campaignToRangeMap = updatedCampaignToRangeMap;

  // Also need to update rangeToCampaigns map
  console.log('\n🔄 Updating rangeToCampaigns mapping...');
  
  // Rebuild rangeToCampaigns from campaignToRangeMap
  const newRangeToCampaigns: Record<string, string[]> = {};
  
  for (const [campaign, range] of Object.entries(updatedCampaignToRangeMap)) {
    const rangeStr = range as string;
    if (!newRangeToCampaigns[rangeStr]) {
      newRangeToCampaigns[rangeStr] = [];
    }
    newRangeToCampaigns[rangeStr].push(campaign);
  }

  // Sort campaigns within each range
  for (const range in newRangeToCampaigns) {
    newRangeToCampaigns[range].sort();
  }

  masterData.rangeToCampaigns = newRangeToCampaigns;

  // Update rangeToCategories if needed (ensure all ranges have categories)
  console.log('\n🔄 Updating rangeToCategories mapping...');
  
  const rangeToCategories = masterData.rangeToCategories || {};
  
  // Ensure all Derma ranges have their corresponding categories
  const dermaCategoryMappings = {
    "Acne": ["Acne"],
    "Anti Pigment": ["Anti Pigment"], 
    "Sun": ["Sun"],
    "Anti Age": ["Anti Age"],
    "Aquaphor": ["Aquaphor"],
    "X-Cat": ["X-Cat"],
    "Dry Skin": ["Dry Skin"],
    // Also ensure these other ranges have categories
    "Atopi": ["Atopi"],
    "pH5": ["pH5"],  
    "Body Lotion": ["Body Lotion"],
    "Repair": ["Repair"],
    "Body Range": ["Body Range"],
    "Brand (Institutional)": ["Brand (Institutional)"]
  };

  // Update rangeToCategories
  for (const [range, categories] of Object.entries(dermaCategoryMappings)) {
    rangeToCategories[range] = categories;
  }

  masterData.rangeToCategories = rangeToCategories;

  // Update categoryToRanges (reverse mapping)
  console.log('🔄 Updating categoryToRanges mapping...');
  
  const categoryToRanges: Record<string, string[]> = {};
  for (const [range, categories] of Object.entries(rangeToCategories)) {
    for (const category of categories as string[]) {
      if (!categoryToRanges[category]) {
        categoryToRanges[category] = [];
      }
      if (!categoryToRanges[category].includes(range)) {
        categoryToRanges[category].push(range);
      }
    }
  }

  // Sort ranges within each category
  for (const category in categoryToRanges) {
    categoryToRanges[category].sort();
  }

  masterData.categoryToRanges = categoryToRanges;

  // Write updated master data
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

  console.log('\n✅ Master data updated successfully!');
  console.log(`📊 Updated totals:`);
  console.log(`   - Total campaigns: ${Object.keys(masterData.campaignToRangeMap).length}`);
  console.log(`   - Total ranges: ${Object.keys(masterData.rangeToCampaigns).length}`);
  console.log(`   - Total categories: ${Object.keys(masterData.categoryToRanges).length}`);

  // Show what was added/changed
  console.log('\n📝 Changes made:');
  console.log('\n🆕 Added missing campaigns:');
  Object.entries(missingCampaigns).forEach(([campaign, range]) => {
    console.log(`   + ${campaign} → ${range}`);
  });

  console.log('\n🔧 Fixed existing mappings:');
  Object.entries(rangeFixes).forEach(([campaign, range]) => {
    console.log(`   → ${campaign} → ${range}`);
  });

  console.log(`\n💾 Backup saved as: ${backupPath}`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Restart your development server (npm run dev)');
  console.log('   2. Test validation with your campaigns');
  console.log('   3. Non-existent campaigns should now show warnings instead of critical errors');
}

updateMissingDermaCampaigns().catch(console.error);