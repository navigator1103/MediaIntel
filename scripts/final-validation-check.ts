// Test the campaigns from the user's table to ensure they're all mapped
const testCases = [
  // From the user's table
  { campaign: "Dermo Purifyer", expectedRange: "Acne" },
  { campaign: "Epigenetics", expectedRange: "Anti Age" },
  { campaign: "Thiamidol Roof", expectedRange: "Anti Pigment" },
  { campaign: "Sun Roof", expectedRange: "Sun" },
  { campaign: "Brand (Institutional)", expectedRange: "Brand (Institutional)" },
  { campaign: "Anti-Acne Range", expectedRange: "Acne" },
  { campaign: "Gold Revamp", expectedRange: "Anti Age" },
  { campaign: "Anti-Pigment Range", expectedRange: "Anti Pigment" },
  { campaign: "Sun-Protection Range", expectedRange: "Sun" },
  { campaign: "Search AWON", expectedRange: "Brand (Institutional)" },
  { campaign: "Dermopure Body (Bacne)", expectedRange: "Acne" },
  { campaign: "Booster Serum", expectedRange: "Anti Pigment" },
  { campaign: "Sun", expectedRange: "Sun" },
  { campaign: "Triple Effect", expectedRange: "Acne" },
  { campaign: "Boosting Essence", expectedRange: "Anti Pigment" },
  { campaign: "Sun 100", expectedRange: "Sun" },
  { campaign: "Dermopure Cleansing (Yoda)", expectedRange: "Acne" },
  { campaign: "Avengers", expectedRange: "Anti Pigment" },
  { campaign: "Sun Range", expectedRange: "Sun" },
  { campaign: "Dermopure Yoda", expectedRange: "Acne" },
  { campaign: "Dragon", expectedRange: "Anti Pigment" },
  { campaign: "Hydro Fluid Tinted (Bacalar)", expectedRange: "Sun" },
  { campaign: "Globe", expectedRange: "Anti Pigment" },
  { campaign: "Sun Range HS1", expectedRange: "Sun" },
  { campaign: "Hidden Spots", expectedRange: "Anti Pigment" },
  { campaign: "Sun Range HS2", expectedRange: "Sun" },
  { campaign: "Serum (Avengers)", expectedRange: "Anti Pigment" },
  { campaign: "Eyes", expectedRange: "Anti Pigment" },
  { campaign: "Power Duo (Avengers + Gel)", expectedRange: "Anti Pigment" },
  { campaign: "AWON Antipigment", expectedRange: "Anti Pigment" },
  { campaign: "The Search is Over", expectedRange: "Anti Pigment" },
  { campaign: "Eyes (KFP)", expectedRange: "Anti Pigment" },
  { campaign: "Body Lotion", expectedRange: "Body Lotion" },
  { campaign: "Urea", expectedRange: "Repair" },
  { campaign: "Body Roof", expectedRange: "Hydration" },
  { campaign: "Aquaphor", expectedRange: "Aquaphor" },
  { campaign: "pH5 Wannabe", expectedRange: "pH5" },
  { campaign: "Atopi", expectedRange: "Atopi" }
];

async function testAllMappings() {
  console.log('🔍 Testing all campaign mappings from user table...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/media-sufficiency/master-data');
    const masterData = await response.json();
    
    let successCount = 0;
    let failCount = 0;
    
    console.log('\n📊 Testing campaign mappings:');
    
    for (const testCase of testCases) {
      const actualRange = masterData.campaignToRangeMap[testCase.campaign];
      
      if (actualRange === testCase.expectedRange) {
        console.log(`✅ ${testCase.campaign} → ${actualRange}`);
        successCount++;
      } else {
        console.log(`❌ ${testCase.campaign} → ${actualRange || 'NOT FOUND'} (expected: ${testCase.expectedRange})`);
        failCount++;
      }
    }
    
    console.log(`\n📈 Results: ${successCount}/${testCases.length} campaigns correctly mapped`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (failCount === 0) {
      console.log('\n🎯 All campaigns from the user table are now properly mapped!');
    } else {
      console.log('\n⚠️  Some campaigns still need attention.');
    }
    
  } catch (error) {
    console.error('❌ Error testing mappings:', error);
  }
}

testAllMappings();