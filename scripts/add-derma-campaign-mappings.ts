import fs from 'fs';
import path from 'path';

// Parse the derma range vs campaign data from the user's table
const dermaCampaignMappings = {
  // Derma ranges to campaigns mapping
  "Acne": [
    "Dermo Purifyer",
    "Anti-Acne Range",
    "Dermopure Body (Bacne)",
    "Eucerin DermoPure",
    "Acne Guard"
  ],
  "Anti Age": [
    "Anti Age Serum",
    "Hyaluron Filler Range",
    "Age Defense Cream",
    "Cellular Anti Age",
    "Collagen Plus"
  ],
  "Anti Pigment": [
    "Anti Pigment Serum",
    "Thiamidol Range",
    "Dark Spot Corrector",
    "Brightening Complex",
    "Pigment Control"
  ],
  "Dry Skin": [
    "Aquaphor Range",
    "pH5 Gentle",
    "Atopi Control",
    "Ultra Hydrating",
    "Dry Skin Relief",
    "Moisture Barrier"
  ]
};

async function addDermaCampaignMappings() {
  try {
    console.log('🔄 Adding derma range vs campaign mappings...');

    // Read current masterData.json
    const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
    const existingData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

    let campaignsAdded = 0;
    let mappingsAdded = 0;

    // Add new derma campaigns to the campaigns array
    const existingCampaigns = new Set(existingData.campaigns);
    const newCampaigns: string[] = [];

    Object.values(dermaCampaignMappings).flat().forEach(campaign => {
      if (!existingCampaigns.has(campaign)) {
        newCampaigns.push(campaign);
        campaignsAdded++;
      }
    });

    // Update campaigns list
    existingData.campaigns = [...existingData.campaigns, ...newCampaigns].sort();

    // Add campaign to range mappings
    const updatedCampaignToRangeMap = { ...existingData.campaignToRangeMap };
    
    Object.entries(dermaCampaignMappings).forEach(([range, campaigns]) => {
      campaigns.forEach(campaign => {
        updatedCampaignToRangeMap[campaign] = range;
        mappingsAdded++;
      });
    });

    existingData.campaignToRangeMap = updatedCampaignToRangeMap;

    // Generate reverse mapping (range to campaigns)
    const rangeToCampaignsMap: Record<string, string[]> = {};
    
    Object.entries(updatedCampaignToRangeMap).forEach(([campaign, range]) => {
      if (!rangeToCampaignsMap[range as string]) {
        rangeToCampaignsMap[range as string] = [];
      }
      rangeToCampaignsMap[range as string].push(campaign);
    });

    // Sort campaigns within each range
    Object.keys(rangeToCampaignsMap).forEach(range => {
      rangeToCampaignsMap[range].sort();
    });

    existingData.rangeToCampaignsMap = rangeToCampaignsMap;

    // Update timestamp
    existingData.lastUpdated = new Date().toISOString();

    // Write updated file
    fs.writeFileSync(masterDataPath, JSON.stringify(existingData, null, 2));

    console.log(`✅ Added ${campaignsAdded} new derma campaigns`);
    console.log(`✅ Added ${mappingsAdded} new campaign-range mappings`);
    
    console.log('\n📊 New derma campaign mappings:');
    Object.entries(dermaCampaignMappings).forEach(([range, campaigns]) => {
      console.log(`${range} → [${campaigns.join(', ')}]`);
    });

    console.log('\n📈 Updated campaign counts:');
    console.log(`Total campaigns: ${existingData.campaigns.length}`);
    console.log(`Total campaign-range mappings: ${Object.keys(existingData.campaignToRangeMap).length}`);

  } catch (error) {
    console.error('❌ Error adding derma campaign mappings:', error);
  }
}

addDermaCampaignMappings();