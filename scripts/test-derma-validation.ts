import fs from 'fs';
import path from 'path';

// Test the updated validation data
function testDermaValidation() {
  console.log('🧪 Testing derma validation mappings...');
  
  const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

  console.log('\n📊 Validation Summary:');
  console.log(`Categories: ${masterData.categories.length}`);
  console.log(`Ranges: ${masterData.ranges.length}`); 
  console.log(`Campaigns: ${masterData.campaigns.length}`);
  console.log(`Campaign-Range mappings: ${Object.keys(masterData.campaignToRangeMap).length}`);

  console.log('\n🔍 Testing derma-specific mappings:');
  
  // Test derma categories
  const dermaCategories = ['Acne', 'Anti Age', 'Anti Pigment', 'Dry Skin'];
  dermaCategories.forEach(category => {
    const ranges = masterData.categoryToRanges[category];
    console.log(`${category} → [${ranges?.join(', ') || 'NONE'}]`);
  });

  console.log('\n🔍 Testing derma range-campaign mappings:');
  
  // Test derma ranges
  const dermaRanges = ['Acne', 'Anti Age', 'Anti Pigment', 'Dry Skin'];
  dermaRanges.forEach(range => {
    const campaigns = masterData.rangeToCampaignsMap[range];
    console.log(`${range} → [${campaigns?.join(', ') || 'NONE'}]`);
  });

  console.log('\n🔍 Testing specific derma campaigns:');
  
  // Test some derma campaigns
  const testCampaigns = [
    'Dermo Purifyer',
    'Anti Age Serum', 
    'Anti Pigment Serum',
    'Aquaphor Range'
  ];
  
  testCampaigns.forEach(campaign => {
    const range = masterData.campaignToRangeMap[campaign];
    console.log(`${campaign} → ${range || 'NOT MAPPED'}`);
  });

  // Verify data consistency
  console.log('\n✅ Data consistency checks:');
  
  // Check if all campaigns in campaignToRangeMap exist in campaigns array
  const unmappedCampaigns = Object.keys(masterData.campaignToRangeMap).filter(
    campaign => !masterData.campaigns.includes(campaign)
  );
  
  if (unmappedCampaigns.length > 0) {
    console.log(`⚠️  Campaigns in mapping but not in campaigns list: ${unmappedCampaigns.length}`);
    unmappedCampaigns.forEach(campaign => console.log(`  - ${campaign}`));
  } else {
    console.log('✅ All mapped campaigns exist in campaigns list');
  }

  // Check reverse mapping consistency
  let inconsistencies = 0;
  Object.entries(masterData.campaignToRangeMap).forEach(([campaign, range]) => {
    const rangeMap = masterData.rangeToCampaignsMap[range as string];
    if (!rangeMap?.includes(campaign)) {
      console.log(`⚠️  Inconsistency: ${campaign} → ${range} but ${range} doesn't include ${campaign}`);
      inconsistencies++;
    }
  });

  if (inconsistencies === 0) {
    console.log('✅ Campaign-range mappings are consistent');
  } else {
    console.log(`⚠️  Found ${inconsistencies} mapping inconsistencies`);
  }

  console.log('\n🎯 Derma integration complete!');
}

testDermaValidation();