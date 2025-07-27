import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function syncMissingCampaigns() {
  console.log('=== SYNCING MISSING CAMPAIGNS FROM MASTER DATA ===\n');

  try {
    // Load master data
    const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

    // Get campaigns from master data
    const masterDataCampaigns = masterData.campaignToRange || {};
    console.log(`Found ${Object.keys(masterDataCampaigns).length} campaigns in master data`);

    // Get campaigns from database
    const dbCampaigns = await prisma.campaign.findMany();
    const dbCampaignNames = new Set(dbCampaigns.map(c => c.name));
    console.log(`Found ${dbCampaigns.length} campaigns in database`);

    // Get ranges mapping
    const ranges = await prisma.range.findMany();
    const rangeNameToId = new Map(ranges.map(r => [r.name, r.id]));

    // Find missing campaigns
    const missingCampaigns = Object.entries(masterDataCampaigns).filter(
      ([campaignName]) => !dbCampaignNames.has(campaignName)
    );

    console.log(`\nFound ${missingCampaigns.length} missing campaigns:`);
    
    if (missingCampaigns.length === 0) {
      console.log('✅ All campaigns from master data exist in database');
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const [campaignName, rangeName] of missingCampaigns) {
      const rangeId = rangeNameToId.get(rangeName as string);
      
      if (!rangeId) {
        console.log(`  ❌ Skipping "${campaignName}" - range "${rangeName}" not found in database`);
        skippedCount++;
        continue;
      }

      try {
        await prisma.campaign.create({
          data: {
            name: campaignName,
            rangeId: rangeId,
            status: 'active',
            createdBy: 'system-sync'
          }
        });
        
        console.log(`  ✅ Added "${campaignName}" → Range: "${rangeName}"`);
        addedCount++;
        
      } catch (error) {
        console.log(`  ❌ Failed to add "${campaignName}": ${error}`);
        skippedCount++;
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`  ✅ Added: ${addedCount} campaigns`);
    console.log(`  ❌ Skipped: ${skippedCount} campaigns`);

    // Verify Superstar specifically
    const superstarCampaign = await prisma.campaign.findFirst({
      where: { name: 'Superstar' },
      include: { range: true }
    });

    if (superstarCampaign) {
      console.log(`\n🌟 Superstar campaign verification:`);
      console.log(`  ✅ Name: ${superstarCampaign.name}`);
      console.log(`  ✅ Range: ${superstarCampaign.range?.name}`);
      console.log(`  ✅ Status: ${superstarCampaign.status}`);
    } else {
      console.log(`\n❌ Superstar campaign not found in database`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncMissingCampaigns().catch(console.error);