import fs from 'fs';
import path from 'path';

// Create campaign compatibility mappings
function createCampaignCompatibilityMap() {
  console.log('🔄 Creating campaign compatibility mappings...');
  
  const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

  // Define campaigns that can belong to multiple ranges
  const campaignCompatibilityMap: Record<string, string[]> = {
    // Body Aloe Summer can be in both Aloe and Milk ranges
    "Body Aloe Summer": ["Aloe", "Milk"],
    
    // Body Milk 5 in 1 could be in both Milk and Luminous 630
    "Body Milk 5 in 1": ["Milk", "Luminous 630"],
    
    // Q10 campaigns could span multiple ranges
    "Q10 Body": ["Q10", "Body Lotion"],
    "Q10 Guardian": ["Q10", "Face Care"],
    "Q10 Range": ["Q10", "Anti Age"],
    
    // Luminous 630 campaigns might also belong to specific body/face ranges
    "Luminous Launch": ["Luminous 630", "Face Care"],
    "Luminous Foam": ["Luminous 630", "Face Cleansing"],
    
    // Sun campaigns could be valid for both Sun and UV Face
    "UV Face": ["UV Face", "Sun"],
    "UV Face Fluid": ["UV Face", "Sun"],
    "UV Face Fluid Tinted": ["UV Face", "Sun"],
    
    // Anti-aging campaigns could span multiple ranges
    "Cellular Anti Age": ["Anti Age", "Cellular"],
    "Hyaluron Filler Range": ["Anti Age", "Hydration"],
    
    // Acne campaigns might be valid across different ranges
    "Derma Skin Clear": ["Acne", "Face Cleansing"],
    "Bright Oil Clear": ["Acne", "Face Care"],
    
    // Deep campaigns could span deo and men's ranges
    "Deep": ["Deep", "Men"],
    "Deep Espresso": ["Deep", "Men"],
    
    // Extra Bright could be in both Even Tone and Men's ranges
    "Extra Bright": ["Even Tone", "Extra Bright", "Men"]
  };

  // Add the compatibility map to master data
  masterData.campaignCompatibilityMap = campaignCompatibilityMap;

  // Create reverse mapping for easier lookups
  const rangeCompatibleCampaigns: Record<string, string[]> = {};
  
  Object.entries(campaignCompatibilityMap).forEach(([campaign, ranges]) => {
    ranges.forEach(range => {
      if (!rangeCompatibleCampaigns[range]) {
        rangeCompatibleCampaigns[range] = [];
      }
      if (!rangeCompatibleCampaigns[range].includes(campaign)) {
        rangeCompatibleCampaigns[range].push(campaign);
      }
    });
  });

  masterData.rangeCompatibleCampaigns = rangeCompatibleCampaigns;

  // Update timestamp
  masterData.lastUpdated = new Date().toISOString();

  // Write updated file
  fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

  console.log('✅ Campaign compatibility mappings created:');
  console.log(`📊 ${Object.keys(campaignCompatibilityMap).length} campaigns with multiple range compatibility`);
  
  console.log('\n🔍 Key compatibility mappings:');
  Object.entries(campaignCompatibilityMap).slice(0, 5).forEach(([campaign, ranges]) => {
    console.log(`${campaign} → [${ranges.join(', ')}]`);
  });

  console.log('\n📋 Ranges with compatible campaigns:');
  Object.entries(rangeCompatibleCampaigns).slice(0, 5).forEach(([range, campaigns]) => {
    console.log(`${range} ← [${campaigns.join(', ')}]`);
  });

  console.log('\n🎯 Campaign compatibility system created!');
}

createCampaignCompatibilityMap();