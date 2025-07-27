import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllDermaCampaigns() {
  console.log('🔍 CHECKING: ALL DERMA CAMPAIGNS\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log('📊 MASTER DATA ANALYSIS:');
  console.log(`Total campaigns in campaignToRangeMap: ${Object.keys(masterData.campaignToRangeMap || {}).length}`);
  
  // Get all Derma ranges from master data
  const dermaRanges = Object.entries(masterData.rangeToBusinessUnit || {})
    .filter(([range, businessUnit]) => businessUnit === 'Derma')
    .map(([range]) => range);
  
  console.log(`\n📋 Derma ranges found: ${dermaRanges.length}`);
  dermaRanges.forEach(range => console.log(`   - ${range}`));

  // Get all campaigns mapped to Derma ranges in master data
  const dermaCampaignsInMaster = Object.entries(masterData.campaignToRangeMap || {})
    .filter(([campaign, range]) => dermaRanges.includes(range as string))
    .map(([campaign, range]) => ({ campaign, range }));
  
  console.log(`\n📋 Campaigns mapped to Derma ranges in MASTER DATA: ${dermaCampaignsInMaster.length}`);
  
  // Group by range
  const campaignsByRange = dermaRanges.reduce((acc: any, range) => {
    acc[range] = dermaCampaignsInMaster
      .filter(item => item.range === range)
      .map(item => item.campaign);
    return acc;
  }, {});

  for (const range of dermaRanges) {
    const campaigns = campaignsByRange[range] || [];
    console.log(`\n   ${range} (${campaigns.length} campaigns):`);
    if (campaigns.length === 0) {
      console.log('      (No campaigns mapped)');
    } else {
      campaigns.forEach((campaign: string) => console.log(`      - ${campaign}`));
    }
  }

  // Now check DATABASE
  console.log('\n🗄️  DATABASE ANALYSIS:');
  
  try {
    // Get all Derma ranges from database
    const dermaRangesInDB = await prisma.range.findMany({
      where: {
        name: { in: dermaRanges }
      }
    });

    // Get campaigns for each range separately
    const rangesWithCampaigns = [];
    for (const range of dermaRangesInDB) {
      const campaigns = await prisma.campaign.findMany({
        where: {
          rangeId: range.id,
          status: { not: 'archived' }
        }
      });
      rangesWithCampaigns.push({
        ...range,
        campaigns
      });
    }

    console.log(`\nDerma ranges found in database: ${rangesWithCampaigns.length}`);
    
    let totalCampaignsInDB = 0;
    for (const range of rangesWithCampaigns) {
      console.log(`\n   ${range.name} (${range.campaigns.length} campaigns):`);
      if (range.campaigns.length === 0) {
        console.log('      (No campaigns linked)');
      } else {
        range.campaigns.forEach(campaign => console.log(`      - ${campaign.name}`));
        totalCampaignsInDB += range.campaigns.length;
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Master Data: ${dermaCampaignsInMaster.length} Derma campaigns`);
    console.log(`   Database: ${totalCampaignsInDB} Derma campaigns`);

    // Find discrepancies by range
    console.log('\n⚠️  DISCREPANCIES BY RANGE:');
    for (const range of dermaRanges) {
      const masterCampaigns = new Set(campaignsByRange[range] || []);
      const dbRange = rangesWithCampaigns.find(r => r.name === range);
      const dbCampaigns = new Set(dbRange?.campaigns.map(c => c.name) || []);
      
      const inMasterNotDB = Array.from(masterCampaigns).filter(c => !dbCampaigns.has(c));
      const inDBNotMaster = Array.from(dbCampaigns).filter(c => !masterCampaigns.has(c));
      
      if (inMasterNotDB.length > 0 || inDBNotMaster.length > 0) {
        console.log(`\n   ${range}:`);
        if (inMasterNotDB.length > 0) {
          console.log(`      In Master but NOT in DB: ${inMasterNotDB.join(', ')}`);
        }
        if (inDBNotMaster.length > 0) {
          console.log(`      In DB but NOT in Master: ${inDBNotMaster.join(', ')}`);
        }
      }
    }

    // Check for campaigns that might be in wrong ranges
    console.log('\n🔍 POTENTIAL MISSING CAMPAIGNS:');
    console.log('Checking for campaigns in database that might belong to Derma but are not mapped...\n');
    
    const allCampaigns = await prisma.campaign.findMany({
      where: {
        status: { not: 'archived' }
      },
      include: {
        range: true
      }
    });

    // Look for campaigns with Derma-like names that might be missing
    const potentialDermaCampaigns = allCampaigns.filter(campaign => {
      const name = campaign.name.toLowerCase();
      return (
        name.includes('serum') ||
        name.includes('anti') ||
        name.includes('age') ||
        name.includes('pigment') ||
        name.includes('acne') ||
        name.includes('sun') ||
        name.includes('elasticity') ||
        name.includes('gold') ||
        name.includes('club') ||
        name.includes('epigen') ||
        name.includes('refill') ||
        name.includes('hydra') ||
        name.includes('moisture') ||
        name.includes('repair') ||
        name.includes('aquaphor') ||
        name.includes('atopi') ||
        name.includes('urea') ||
        name.includes('ph5')
      ) && !dermaRanges.includes(campaign.range?.name || '');
    });

    if (potentialDermaCampaigns.length > 0) {
      console.log('Campaigns that might belong to Derma but are in other ranges:');
      potentialDermaCampaigns.forEach(campaign => {
        console.log(`   - "${campaign.name}" → Currently in range: ${campaign.range?.name || 'NULL'}`);
      });
    } else {
      console.log('No obviously misplaced Derma campaigns found.');
    }

  } catch (error: any) {
    console.log(`❌ Database error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllDermaCampaigns().catch(console.error);