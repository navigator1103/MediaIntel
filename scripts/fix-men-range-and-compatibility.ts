import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function fixMenRangeAndCompatibility() {
  try {
    console.log('🔄 Fixing Men range and compatibility mappings...');

    // 1. First, let's add some campaigns to the Men range
    // Looking at existing patterns, these campaigns likely belong to Men:
    const menCampaigns = [
      "Deep", // Deep campaigns are often for men
      "Deep Espresso",
      "Extra Bright", // Could be men's brightening
      "Sensitive Cleansing", // Men's sensitive products
      "Sensitive Moisture"
    ];

    const menRange = await prisma.range.findUnique({
      where: { name: "Men" }
    });

    if (!menRange) {
      console.log('❌ Men range not found');
      return;
    }

    console.log(`✅ Found Men range (ID: ${menRange.id})`);

    // Update some campaigns to Men range
    let updatedCount = 0;
    for (const campaignName of menCampaigns) {
      try {
        const campaign = await prisma.campaign.findUnique({
          where: { name: campaignName }
        });

        if (campaign) {
          await prisma.campaign.update({
            where: { name: campaignName },
            data: { rangeId: menRange.id }
          });
          console.log(`✅ Moved '${campaignName}' to Men range`);
          updatedCount++;
        }
      } catch (error) {
        console.log(`⚠️  Could not update ${campaignName}: ${error}`);
      }
    }

    console.log(`📊 Updated ${updatedCount} campaigns to Men range`);

    // 2. Update compatibility mappings to be more flexible
    const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

    // Add more compatibility mappings
    const additionalCompatibility = {
      // Allow Epigenetics to work with multiple ranges
      "Epigenetics": ["Anti Age", "Face Care", "Cellular"],
      
      // Allow Brand (Institutional) campaigns to be flexible
      "Brand (Institutional)": ["Brand (Institutional)", "X-Cat"],
      "Search AWON": ["Brand (Institutional)", "X-Cat", "Alt"],
      
      // Allow men's campaigns to work across ranges
      "Deep": ["Deep", "Men", "Deo"],
      "Deep Espresso": ["Deep", "Men", "Deo"],
      "Extra Bright": ["Even Tone", "Extra Bright", "Men"],
      "Sensitive Cleansing": ["Sensitive", "Men", "Face Cleansing"],
      "Sensitive Moisture": ["Sensitive", "Men", "Face Care"]
    };

    // Merge with existing compatibility mappings
    const updatedCompatibility = {
      ...masterData.campaignCompatibilityMap,
      ...additionalCompatibility
    };

    masterData.campaignCompatibilityMap = updatedCompatibility;

    // Regenerate reverse mapping
    const rangeCompatibleCampaigns: Record<string, string[]> = {};
    
    Object.entries(updatedCompatibility).forEach(([campaign, ranges]) => {
      (ranges as string[]).forEach(range => {
        if (!rangeCompatibleCampaigns[range]) {
          rangeCompatibleCampaigns[range] = [];
        }
        if (!rangeCompatibleCampaigns[range].includes(campaign)) {
          rangeCompatibleCampaigns[range].push(campaign);
        }
      });
    });

    masterData.rangeCompatibleCampaigns = rangeCompatibleCampaigns;
    masterData.lastUpdated = new Date().toISOString();

    // Write updated file
    fs.writeFileSync(masterDataPath, JSON.stringify(masterData, null, 2));

    console.log('\n✅ Updated compatibility mappings:');
    console.log('Epigenetics can now work with:', additionalCompatibility.Epigenetics);
    console.log('Search AWON can now work with:', additionalCompatibility["Search AWON"]);
    console.log('Deep can now work with:', additionalCompatibility.Deep);

    // 3. Verify Men range now has campaigns
    const menCampaignsInDb = await prisma.campaign.findMany({
      where: { rangeId: menRange.id }
    });

    console.log(`\n📊 Men range now has ${menCampaignsInDb.length} campaigns:`);
    menCampaignsInDb.forEach(campaign => {
      console.log(`  - ${campaign.name}`);
    });

  } catch (error) {
    console.error('❌ Error fixing Men range and compatibility:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMenRangeAndCompatibility();