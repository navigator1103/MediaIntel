import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificDermaCampaigns() {
  console.log('🔍 CHECKING: Specific Derma Campaigns from User List\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // User-provided campaign list organized by range
  const dermaCampaignsByRange = {
    "Acne": [
      "Dermopure Body (Bacne)",
      "Dermopure RL", 
      "Dermo Purifyer",
      "Gel to Foam",
      "Triple Effect",
      "Dermopure Cleansing (Activia)",
      "Dermopure Cleansing (Yoda)",
      "Anti-Acne Range"
    ],
    "Anti Pigment": [
      "Globe - Body",
      "Avengers (Search is Over)",
      "Hidden Spots",
      "Thiamidol Roof - Face & Body",
      "Dragon (Boosting Essence)", 
      "Kung Fu Panda (Eyes)",
      "Power Duo (Serum + Gel)",
      "Anti-Pigment Range - Face",
      "Bridge Campaign - Body AP",
      "Alice - Body",
      "Trilogy RL",
      "Bridge Campaign - Face"
    ],
    "Sun": [
      "Hydro Fluid Tinted (Bacalar)",
      "Sun Range",
      "Actinic",
      "Sun Oil Control Core",
      "Sun-Protection Range",
      "Superstar"
    ],
    "Anti Age": [
      "Elasticity Motown",
      "Golden Age (Gold Revamp)",
      "3D Serum + Dragon (Gold)",
      "Club55 Serum",
      "Epigenetics (Benjamin Button)",
      "Epigenetics (Epi 2.0)",
      "Epigenius RL",
      "Refillution"
    ],
    "Aquaphor": [
      "Aquaphor"
    ],
    "X-Cat": [
      "Club Eucerin",
      "Brand (Institutional)",
      "Yo voy al derm",
      "Customers AWON",
      "Lead Capturing AWON",
      "Eucerin brand AWON"
    ],
    "Dry Skin": [
      "Atopi",
      "Search AWON",
      "pH5 Wannabe",
      "Body Roof", 
      "Urea",
      "Body Lotion"
    ]
  };

  // Flatten all campaigns
  const allUserCampaigns = Object.values(dermaCampaignsByRange).flat();
  console.log(`📊 Total campaigns provided: ${allUserCampaigns.length}\n`);

  // Check each range
  let totalMissingFromMaster = 0;
  let totalMissingFromDB = 0;

  for (const [rangeName, campaigns] of Object.entries(dermaCampaignsByRange)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ${rangeName.toUpperCase()} (${campaigns.length} campaigns)`);
    console.log(`${'='.repeat(60)}`);

    let missingFromMaster = 0;
    let missingFromDB = 0;

    for (const campaign of campaigns) {
      // Check master data
      const inMaster = masterData.campaignToRangeMap?.[campaign];
      const masterStatus = inMaster ? `✅ Mapped to "${inMaster}"` : '❌ MISSING';
      if (!inMaster) missingFromMaster++;

      // Check database
      let dbStatus = '';
      try {
        const dbCampaign = await prisma.campaign.findFirst({
          where: { 
            name: campaign,
            status: { not: 'archived' }
          },
          include: { range: true }
        });
        
        if (dbCampaign) {
          const dbRange = dbCampaign.range?.name || 'NULL';
          dbStatus = dbRange === rangeName ? '✅ Correct range' : `⚠️  Wrong range: ${dbRange}`;
        } else {
          dbStatus = '❌ MISSING';
          missingFromDB++;
        }
      } catch (error) {
        dbStatus = '💥 ERROR';
      }

      console.log(`   ${campaign}:`);
      console.log(`      Master Data: ${masterStatus}`);
      console.log(`      Database:    ${dbStatus}`);
    }

    console.log(`\n   📊 ${rangeName} Summary:`);
    console.log(`      Missing from Master Data: ${missingFromMaster}/${campaigns.length}`);
    console.log(`      Missing from Database: ${missingFromDB}/${campaigns.length}`);
    
    totalMissingFromMaster += missingFromMaster;
    totalMissingFromDB += missingFromDB;
  }

  // Overall summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('🎯 OVERALL SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total campaigns checked: ${allUserCampaigns.length}`);
  console.log(`Missing from Master Data: ${totalMissingFromMaster} (${Math.round((totalMissingFromMaster/allUserCampaigns.length)*100)}%)`);
  console.log(`Missing from Database: ${totalMissingFromDB} (${Math.round((totalMissingFromDB/allUserCampaigns.length)*100)}%)`);

  // Find campaigns with name variations
  console.log(`\n🔍 POTENTIAL NAME VARIATIONS:`);
  const masterCampaigns = Object.keys(masterData.campaignToRangeMap || {});
  
  for (const userCampaign of allUserCampaigns) {
    if (!masterData.campaignToRangeMap?.[userCampaign]) {
      // Look for similar names
      const similar = masterCampaigns.filter(masterCamp => {
        const userLower = userCampaign.toLowerCase();
        const masterLower = masterCamp.toLowerCase();
        
        // Check for partial matches or common variations
        return (
          masterLower.includes(userLower.split(' ')[0]) ||
          userLower.includes(masterLower.split(' ')[0]) ||
          // Remove parentheses and check
          userLower.replace(/\([^)]*\)/g, '').trim() === masterLower.replace(/\([^)]*\)/g, '').trim() ||
          // Check without special characters
          userLower.replace(/[^a-z0-9\s]/g, '') === masterLower.replace(/[^a-z0-9\s]/g, '')
        );
      });

      if (similar.length > 0) {
        console.log(`   "${userCampaign}" → Possible matches: ${similar.join(', ')}`);
      }
    }
  }

  await prisma.$disconnect();
}

checkSpecificDermaCampaigns().catch(console.error);