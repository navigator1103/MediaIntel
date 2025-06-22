import fs from 'fs';
import path from 'path';

// Fix Milk range mappings
function fixMilkRangeMappings() {
  console.log('🔄 Fixing Milk range campaign mappings...');
  
  const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

  // Update campaign to range mappings
  masterData.campaignToRangeMap["Body Aloe Summer"] = "Milk";
  masterData.campaignToRangeMap["Body Milk 5 in 1"] = "Milk";

  // Remove these campaigns from their old range mappings
  if (masterData.rangeToCampaignsMap["Aloe"]) {
    masterData.rangeToCampaignsMap["Aloe"] = masterData.rangeToCampaignsMap["Aloe"].filter(
      (campaign: string) => campaign !== "Body Aloe Summer"
    );
  }

  if (masterData.rangeToCampaignsMap["Luminous 630"]) {
    masterData.rangeToCampaignsMap["Luminous 630"] = masterData.rangeToCampaignsMap["Luminous 630"].filter(
      (campaign: string) => campaign !== "Body Milk 5 in 1"
    );
  }

  // Add campaigns to Milk range
  masterData.rangeToCampaignsMap["Milk"] = [
    "Body Aloe Summer",
    "Body Milk 5 in 1"
  ];

  // Update timestamp
  masterData.lastUpdated = new Date().toISOString();

  // Write updated file
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

  console.log('✅ Updated Milk range mappings:');
  console.log('Campaign → Range updates:');
  console.log('  Body Aloe Summer: Aloe → Milk');
  console.log('  Body Milk 5 in 1: Luminous 630 → Milk');
  
  console.log('\n📊 Range mappings:');
  console.log('Milk →', masterData.rangeToCampaignsMap["Milk"]);
  console.log('Aloe →', masterData.rangeToCampaignsMap["Aloe"]);
  console.log('Luminous 630 →', masterData.rangeToCampaignsMap["Luminous 630"]?.slice(0, 3), '...');

  console.log('\n🎯 Milk range mapping fixed!');
}

fixMilkRangeMappings();