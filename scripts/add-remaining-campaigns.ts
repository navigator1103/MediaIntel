import fs from 'fs';
import path from 'path';

async function addRemainingCampaigns() {
  console.log('🔄 ADDING: Remaining Campaigns with Exact Names\n');

  // Load current masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Remaining campaigns that need exact name matches
  const remainingCampaigns = {
    // Anti Pigment - exact names from user list
    "Globe - Body": "Anti Pigment",
    "Avengers (Search is Over)": "Anti Pigment", 
    "Thiamidol Roof - Face & Body": "Anti Pigment",
    "Dragon (Boosting Essence)": "Anti Pigment",
    "Kung Fu Panda (Eyes)": "Anti Pigment",
    "Power Duo (Serum + Gel)": "Anti Pigment",
    "Anti-Pigment Range - Face": "Anti Pigment",

    // Anti Age - exact names from user list  
    "Golden Age (Gold Revamp)": "Anti Age",
    "3D Serum + Dragon (Gold)": "Anti Age",

    // Sun - exact names from user list
    "Sun Oil Control Core": "Sun"
  };

  console.log(`📝 Adding ${Object.keys(remainingCampaigns).length} remaining campaigns with exact names...`);

  // Create backup
  const backupPath = masterDataPath + `.backup.exact-names.${Date.now()}`;
  fs.writeFileSync(backupPath, JSON.stringify(masterData, null, 2));
  console.log(`💾 Backup created: ${backupPath}`);

  // Add the remaining campaigns
  for (const [campaign, range] of Object.entries(remainingCampaigns)) {
    masterData.campaignToRangeMap[campaign] = range;
    console.log(`   + ${campaign} → ${range}`);
  }

  // Rebuild rangeToCampaigns from updated campaignToRangeMap
  const newRangeToCampaigns: Record<string, string[]> = {};
  
  for (const [campaign, range] of Object.entries(masterData.campaignToRangeMap)) {
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

  // Write updated master data
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

  console.log('\n✅ Remaining campaigns added successfully!');
  console.log(`📊 Updated total campaigns: ${Object.keys(masterData.campaignToRangeMap).length}`);
  console.log(`💾 Backup: ${backupPath}`);

  console.log('\n🎯 All Derma campaigns should now be in master data!');
  console.log('Next: Restart dev server and test validation');
}

addRemainingCampaigns().catch(console.error);