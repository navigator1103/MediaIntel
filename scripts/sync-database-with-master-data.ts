import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncDatabaseWithMasterData() {
  console.log('🔄 SYNCING: Database with Master Data\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log(`📊 Master data has ${Object.keys(masterData.campaignToRangeMap || {}).length} campaigns`);

  try {
    // Get all ranges from database to create a mapping
    const ranges = await prisma.range.findMany();
    const rangeMap = new Map(ranges.map(r => [r.name, r.id]));
    
    console.log(`📊 Database has ${ranges.length} ranges`);

    // Get all existing campaigns from database
    const existingCampaigns = await prisma.campaign.findMany({
      where: { status: { not: 'archived' } },
      select: { name: true, rangeId: true, range: { select: { name: true } } }
    });

    const existingCampaignMap = new Map(existingCampaigns.map(c => [c.name, c]));
    console.log(`📊 Database has ${existingCampaigns.length} active campaigns`);

    // Track what we need to do
    let campaignsToAdd = [];
    let campaignsToUpdate = [];
    let campaignsSkipped = [];

    // Process all campaigns from master data
    for (const [campaignName, rangeName] of Object.entries(masterData.campaignToRangeMap)) {
      const rangeStr = rangeName as string;
      const rangeId = rangeMap.get(rangeStr);
      
      if (!rangeId) {
        console.log(`⚠️  Range "${rangeStr}" not found in database - skipping campaign "${campaignName}"`);
        campaignsSkipped.push({ campaign: campaignName, range: rangeStr, reason: 'Range not found' });
        continue;
      }

      const existingCampaign = existingCampaignMap.get(campaignName);
      
      if (!existingCampaign) {
        // Campaign doesn't exist - need to add it
        campaignsToAdd.push({
          name: campaignName,
          rangeId: rangeId,
          rangeName: rangeStr
        });
      } else if (existingCampaign.rangeId !== rangeId) {
        // Campaign exists but in wrong range - need to update it
        campaignsToUpdate.push({
          name: campaignName,
          currentRange: existingCampaign.range?.name,
          newRangeId: rangeId,
          newRangeName: rangeStr
        });
      }
      // If campaign exists in correct range, do nothing
    }

    console.log(`\n📊 Analysis Complete:`);
    console.log(`   Campaigns to ADD: ${campaignsToAdd.length}`);
    console.log(`   Campaigns to UPDATE: ${campaignsToUpdate.length}`);
    console.log(`   Campaigns SKIPPED: ${campaignsSkipped.length}`);

    // Add missing campaigns
    if (campaignsToAdd.length > 0) {
      console.log(`\n🆕 Adding ${campaignsToAdd.length} missing campaigns:`);
      
      for (const campaign of campaignsToAdd) {
        try {
          await prisma.campaign.create({
            data: {
              name: campaign.name,
              rangeId: campaign.rangeId,
              status: 'active',
              createdBy: 'sync_script',
              notes: `Added by sync script on ${new Date().toISOString()}`
            }
          });
          console.log(`   ✅ Added: ${campaign.name} → ${campaign.rangeName}`);
        } catch (error: any) {
          console.log(`   ❌ Failed to add ${campaign.name}: ${error.message}`);
        }
      }
    }

    // Update campaigns in wrong ranges
    if (campaignsToUpdate.length > 0) {
      console.log(`\n🔄 Updating ${campaignsToUpdate.length} campaigns to correct ranges:`);
      
      for (const campaign of campaignsToUpdate) {
        try {
          await prisma.campaign.updateMany({
            where: { 
              name: campaign.name,
              status: { not: 'archived' }
            },
            data: {
              rangeId: campaign.newRangeId,
              notes: `Range updated by sync script on ${new Date().toISOString()}`
            }
          });
          console.log(`   ✅ Updated: ${campaign.name} → ${campaign.currentRange} → ${campaign.newRangeName}`);
        } catch (error: any) {
          console.log(`   ❌ Failed to update ${campaign.name}: ${error.message}`);
        }
      }
    }

    // Show skipped campaigns
    if (campaignsSkipped.length > 0) {
      console.log(`\n⚠️  Skipped ${campaignsSkipped.length} campaigns:`);
      for (const skipped of campaignsSkipped) {
        console.log(`   - ${skipped.campaign} (${skipped.reason})`);
      }
    }

    // Final verification
    console.log(`\n🔍 Final Verification:`);
    const updatedCampaigns = await prisma.campaign.findMany({
      where: { status: { not: 'archived' } },
      include: { range: true }
    });

    console.log(`📊 Database now has ${updatedCampaigns.length} active campaigns`);

    // Check how many campaigns from master data are now in database
    let foundInDB = 0;
    let correctRange = 0;

    for (const [campaignName, rangeName] of Object.entries(masterData.campaignToRangeMap)) {
      const dbCampaign = updatedCampaigns.find(c => c.name === campaignName);
      if (dbCampaign) {
        foundInDB++;
        if (dbCampaign.range?.name === rangeName) {
          correctRange++;
        }
      }
    }

    console.log(`✅ Campaigns from master data found in DB: ${foundInDB}/${Object.keys(masterData.campaignToRangeMap).length}`);
    console.log(`✅ Campaigns in correct ranges: ${correctRange}/${Object.keys(masterData.campaignToRangeMap).length}`);

    // Show success rate
    const successRate = Math.round((correctRange / Object.keys(masterData.campaignToRangeMap).length) * 100);
    console.log(`\n🎯 Database Sync Success Rate: ${successRate}%`);

    if (successRate === 100) {
      console.log('\n🎉 PERFECT! Database is now fully synced with master data!');
    } else {
      console.log(`\n⚠️  ${Object.keys(masterData.campaignToRangeMap).length - correctRange} campaigns still need attention`);
    }

  } catch (error: any) {
    console.log(`❌ Database sync error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

syncDatabaseWithMasterData().catch(console.error);