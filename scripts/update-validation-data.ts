import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function updateValidationData() {
  try {
    console.log('Fetching latest data from database...');

    // Get all campaigns with their ranges
    const campaigns = await prisma.campaign.findMany({
      include: {
        range: true
      }
    });

    // Get all ranges
    const ranges = await prisma.range.findMany();
    
    // Get all countries
    const countries = await prisma.country.findMany({
      include: {
        region: true,
        subRegion: true
      }
    });

    // Build campaign-range mapping
    const campaignToRangeMap: Record<string, string> = {};
    const rangeToCampaignsMap: Record<string, string[]> = {};

    campaigns.forEach(campaign => {
      if (campaign.range) {
        campaignToRangeMap[campaign.name] = campaign.range.name;
        
        if (!rangeToCampaignsMap[campaign.range.name]) {
          rangeToCampaignsMap[campaign.range.name] = [];
        }
        rangeToCampaignsMap[campaign.range.name].push(campaign.name);
      }
    });

    // Read existing masterData.json
    const masterDataPath = path.join(process.cwd(), 'src/lib/validation/masterData.json');
    const existingData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

    // Update with latest database data
    const updatedData = {
      ...existingData,
      campaigns: campaigns.map(c => c.name).sort(),
      ranges: ranges.map(r => r.name).sort(),
      countries: countries.map(c => c.name).sort(),
      campaignToRangeMap,
      rangeToCampaignsMap,
      lastUpdated: new Date().toISOString()
    };

    // Write updated masterData.json
    fs.writeFileSync(masterDataPath, JSON.stringify(updatedData, null, 2));
    
    console.log('✅ Validation data updated successfully!');
    console.log(`📊 Campaigns: ${campaigns.length}`);
    console.log(`📋 Ranges: ${ranges.length}`);
    console.log(`🌍 Countries: ${countries.length}`);
    
  } catch (error) {
    console.error('❌ Error updating validation data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateValidationData();