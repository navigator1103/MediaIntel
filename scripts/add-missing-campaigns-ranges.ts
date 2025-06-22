import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Based on the user's table, here are the campaign-range mappings
const newCampaignMappings = {
  // Acne range campaigns
  "Dermo Purifyer": "Acne",
  "Anti-Acne Range": "Acne", 
  "Dermopure Body (Bacne)": "Acne",
  "Triple Effect": "Acne",
  "Dermopure Cleansing (Yoda)": "Acne",
  "Dermopure Yoda": "Acne",
  
  // Anti Age range campaigns
  "Epigenetics": "Anti Age",
  "Gold Revamp": "Anti Age",
  
  // Anti Pigment range campaigns
  "Thiamidol Roof": "Anti Pigment",
  "Anti-Pigment Range": "Anti Pigment",
  "Booster Serum": "Anti Pigment",
  "Boosting Essence": "Anti Pigment",
  "Avengers": "Anti Pigment",
  "Dragon": "Anti Pigment",
  "Globe": "Anti Pigment",
  "Hidden Spots": "Anti Pigment",
  "Serum (Avengers)": "Anti Pigment",
  "Eyes": "Anti Pigment",
  "Power Duo (Avengers + Gel)": "Anti Pigment",
  "AWON Antipigment": "Anti Pigment",
  "The Search is Over": "Anti Pigment",
  "Eyes (KFP)": "Anti Pigment",
  
  // Sun range campaigns
  "Sun Roof": "Sun",
  "Sun-Protection Range": "Sun",
  "Sun": "Sun",
  "Sun 100": "Sun",
  "Sun Range": "Sun",
  "Hydro Fluid Tinted (Bacalar)": "Sun",
  "Sun Range HS1": "Sun",
  "Sun Range HS2": "Sun",
  
  // Brand (Institutional) range campaigns
  "Brand (Institutional)": "Brand (Institutional)",
  "Search AWON": "Brand (Institutional)",
  
  // Body Lotion range campaigns
  "Body Lotion": "Body Lotion",
  
  // Repair range campaigns
  "Urea": "Repair",
  
  // Hydration range campaigns
  "Body Roof": "Hydration",
  
  // Aquaphor range campaigns
  "Aquaphor": "Aquaphor",
  
  // pH5 range campaigns
  "pH5 Wannabe": "pH5",
  
  // Atopi range campaigns
  "Atopi": "Atopi"
};

// New ranges that need to be created
const newRanges = [
  "Body Lotion", "Repair", "Hydration", "Aquaphor", "pH5", "Atopi", "Urea", "Body Roof", "pH5 Wannabe"
];

async function addMissingCampaignsAndRanges() {
  try {
    console.log('🔄 Adding missing campaigns and ranges...');

    // 1. First, create missing ranges
    console.log('\n📝 Creating missing ranges:');
    const createdRanges = new Map();
    
    for (const rangeName of newRanges) {
      try {
        // Check if range already exists
        const existingRange = await prisma.range.findUnique({
          where: { name: rangeName }
        });
        
        if (existingRange) {
          console.log(`ℹ️  Range '${rangeName}' already exists (ID: ${existingRange.id})`);
          createdRanges.set(rangeName, existingRange.id);
        } else {
          const newRange = await prisma.range.create({
            data: { name: rangeName }
          });
          console.log(`✅ Created range '${rangeName}' (ID: ${newRange.id})`);
          createdRanges.set(rangeName, newRange.id);
        }
      } catch (error) {
        console.log(`❌ Error creating range '${rangeName}': ${error}`);
      }
    }

    // 2. Get all existing ranges
    const allRanges = await prisma.range.findMany();
    const rangeMap = new Map(allRanges.map(r => [r.name, r.id]));

    // 3. Create missing campaigns and assign to ranges
    console.log('\n📝 Creating missing campaigns:');
    let campaignsCreated = 0;
    let campaignsUpdated = 0;
    
    for (const [campaignName, rangeName] of Object.entries(newCampaignMappings)) {
      try {
        const rangeId = rangeMap.get(rangeName);
        
        if (!rangeId) {
          console.log(`⚠️  Range '${rangeName}' not found for campaign '${campaignName}'`);
          continue;
        }

        // Check if campaign already exists
        const existingCampaign = await prisma.campaign.findUnique({
          where: { name: campaignName }
        });
        
        if (existingCampaign) {
          // Update existing campaign's range if needed
          if (existingCampaign.rangeId !== rangeId) {
            await prisma.campaign.update({
              where: { name: campaignName },
              data: { rangeId: rangeId }
            });
            console.log(`🔄 Updated '${campaignName}' → '${rangeName}'`);
            campaignsUpdated++;
          } else {
            console.log(`ℹ️  Campaign '${campaignName}' already mapped to '${rangeName}'`);
          }
        } else {
          // Create new campaign
          await prisma.campaign.create({
            data: { 
              name: campaignName,
              rangeId: rangeId
            }
          });
          console.log(`✅ Created '${campaignName}' → '${rangeName}'`);
          campaignsCreated++;
        }
      } catch (error) {
        console.log(`❌ Error processing campaign '${campaignName}': ${error}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Ranges created/verified: ${newRanges.length}`);
    console.log(`✅ Campaigns created: ${campaignsCreated}`);
    console.log(`🔄 Campaigns updated: ${campaignsUpdated}`);

    // 4. Verify some key mappings
    console.log('\n🔍 Verifying key mappings:');
    const testCampaigns = ['Anti-Pigment Range', 'Epigenetics', 'Triple Effect', 'Sun Roof'];
    
    for (const campaignName of testCampaigns) {
      const campaign = await prisma.campaign.findUnique({
        where: { name: campaignName },
        include: { range: true }
      });
      
      if (campaign && campaign.range) {
        console.log(`✅ ${campaignName} → ${campaign.range.name}`);
      } else {
        console.log(`❌ ${campaignName} → NOT FOUND OR NO RANGE`);
      }
    }

  } catch (error) {
    console.error('❌ Error adding missing campaigns and ranges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingCampaignsAndRanges();