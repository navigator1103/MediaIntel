import fs from 'fs';
import path from 'path';

// Test the Milk range validation
function testMilkValidation() {
  console.log('🧪 Testing Milk range validation...');
  
  const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

  console.log('\n📊 Milk Range Mappings:');
  console.log('Campaigns mapped to Milk range:', masterData.rangeToCampaignsMap["Milk"]);
  
  console.log('\n🔍 Campaign-to-Range Mappings:');
  const milkCampaigns = ["Body Aloe Summer", "Body Milk 5 in 1"];
  milkCampaigns.forEach(campaign => {
    const range = masterData.campaignToRangeMap[campaign];
    console.log(`${campaign} → ${range}`);
  });

  console.log('\n✅ Validation Tests:');
  
  // Test if campaigns exist in master campaigns list
  milkCampaigns.forEach(campaign => {
    const exists = masterData.campaigns.includes(campaign);
    console.log(`${campaign} in campaigns list: ${exists ? '✅' : '❌'}`);
  });

  // Test if range exists
  const milkRangeExists = masterData.ranges.includes("Milk");
  console.log(`Milk range in ranges list: ${milkRangeExists ? '✅' : '❌'}`);

  // Test bidirectional consistency
  console.log('\n🔄 Bidirectional Mapping Consistency:');
  milkCampaigns.forEach(campaign => {
    const mappedRange = masterData.campaignToRangeMap[campaign];
    const rangeCampaigns = masterData.rangeToCampaignsMap[mappedRange] || [];
    const isConsistent = rangeCampaigns.includes(campaign);
    console.log(`${campaign} ↔ ${mappedRange}: ${isConsistent ? '✅' : '❌'}`);
  });

  console.log('\n🎯 Milk validation test complete!');
}

testMilkValidation();