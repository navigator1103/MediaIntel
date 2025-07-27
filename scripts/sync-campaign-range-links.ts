import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SYNCING CAMPAIGN-RANGE LINKS FROM MASTER DATA ===\n');

  try {
    // Load master data
    const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

    console.log('1. LOADING MASTER DATA MAPPINGS:');
    console.log('--------------------------------');
    
    const campaignToRange = masterData.campaignToRange || {};
    console.log(`Found ${Object.keys(campaignToRange).length} campaign-to-range mappings in master data`);

    console.log('\n2. ANALYZING DATABASE vs MASTER DATA:');
    console.log('------------------------------------');
    
    // Get all campaigns from database
    const allCampaigns = await prisma.campaign.findMany({
      include: {
        range: true
      }
    });
    
    console.log(`Found ${allCampaigns.length} campaigns in database`);
    
    // Get all ranges from database for lookup
    const allRanges = await prisma.range.findMany();
    const rangeNameToId = new Map(allRanges.map(r => [r.name, r.id]));
    
    console.log(`Found ${allRanges.length} ranges in database`);

    let updatedCount = 0;
    let missingRanges = new Set<string>();
    let exactMatches = 0;
    let campaignsWithoutMasterData = 0;

    console.log('\n3. PROCESSING CAMPAIGN-RANGE LINKS:');
    console.log('----------------------------------');

    for (const campaign of allCampaigns) {
      const expectedRangeName = campaignToRange[campaign.name];
      
      if (!expectedRangeName) {
        campaignsWithoutMasterData++;
        console.log(`  ⚠️  Campaign "${campaign.name}" not found in master data`);
        continue;
      }

      const expectedRangeId = rangeNameToId.get(expectedRangeName);
      
      if (!expectedRangeId) {
        missingRanges.add(expectedRangeName);
        console.log(`  ❌ Range "${expectedRangeName}" not found in database for campaign "${campaign.name}"`);
        continue;
      }

      // Check if campaign already has correct range
      if (campaign.rangeId === expectedRangeId) {
        exactMatches++;
        continue; // Already correct
      }

      // Update campaign with correct range
      try {
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { rangeId: expectedRangeId }
        });
        
        updatedCount++;
        const oldRangeName = campaign.range?.name || 'None';
        console.log(`  ✅ Updated "${campaign.name}": ${oldRangeName} → ${expectedRangeName}`);
        
      } catch (error) {
        console.log(`  ❌ Failed to update "${campaign.name}": ${error}`);
      }
    }

    console.log('\n4. SUMMARY:');
    console.log('----------');
    console.log(`✅ Successfully updated: ${updatedCount} campaigns`);
    console.log(`✅ Already correct: ${exactMatches} campaigns`);
    console.log(`⚠️  No master data: ${campaignsWithoutMasterData} campaigns`);
    console.log(`❌ Missing ranges: ${missingRanges.size} ranges`);

    if (missingRanges.size > 0) {
      console.log('\nMissing ranges in database:');
      missingRanges.forEach(rangeName => {
        console.log(`  - ${rangeName}`);
      });
    }

    console.log('\n5. VERIFICATION - ANTI AGE CAMPAIGNS:');
    console.log('------------------------------------');
    
    // Check Anti Age campaigns specifically
    const antiAgeRange = await prisma.range.findUnique({
      where: { name: 'Anti Age' },
      include: {
        campaigns: true
      }
    });

    if (antiAgeRange) {
      console.log(`Anti Age range now has ${antiAgeRange.campaigns.length} linked campaigns:`);
      antiAgeRange.campaigns.forEach((campaign, index) => {
        console.log(`  ${index + 1}. ${campaign.name}`);
      });
    }

    // Check for Anti Age game plans
    const antiAgeGamePlans = await prisma.gamePlan.findMany({
      where: {
        category: {
          name: 'Anti Age'
        }
      },
      include: {
        campaign: {
          include: {
            range: true
          }
        },
        category: true
      },
      take: 5
    });

    console.log(`\nAnti Age game plans with range info (showing first 5):`);
    antiAgeGamePlans.forEach((plan, index) => {
      const rangeName = plan.campaign?.range?.name || 'N/A';
      const campaignName = plan.campaign?.name || 'N/A';
      console.log(`  ${index + 1}. Campaign: "${campaignName}" → Range: "${rangeName}"`);
    });

    console.log('\n6. RECOMMENDATIONS:');
    console.log('------------------');
    
    if (updatedCount > 0) {
      console.log('✅ Campaign-range links updated successfully');
      console.log('✅ Anti Age campaigns should now show correct ranges in game plan management');
    }
    
    if (missingRanges.size > 0) {
      console.log('⚠️  Some ranges from master data are missing in database');
      console.log('   → Consider adding missing ranges or updating master data');
    }
    
    if (campaignsWithoutMasterData > 0) {
      console.log('⚠️  Some database campaigns are not in master data');
      console.log('   → Consider updating master data or cleaning up database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);