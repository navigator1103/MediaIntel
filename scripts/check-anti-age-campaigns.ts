import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAntiAgeCampaigns() {
  console.log('🔍 CHECKING: Anti Age Campaign Mappings\n');

  // Load masterData
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  // Campaigns to check
  const antiAgeCampaigns = [
    'Elasticity Motown',
    'Golden Age (Gold Revamp)',
    '3D Serum + Dragon (Gold)',
    'Club55 Serum',
    'Epigenetics (Benjamin Button)',
    'Epigenetics (Epi 2.0)',
    'Epigenius RL',
    'Refillution'
  ];

  console.log('📊 MASTER DATA ANALYSIS:');
  console.log(`Total campaigns in campaignToRangeMap: ${Object.keys(masterData.campaignToRangeMap || {}).length}`);
  
  // Check each campaign in master data
  console.log('\n🔍 Master Data Mappings:');
  for (const campaign of antiAgeCampaigns) {
    const mappedRange = masterData.campaignToRangeMap?.[campaign];
    const status = mappedRange ? `✅ Mapped to "${mappedRange}"` : '❌ NOT FOUND';
    console.log(`   ${campaign}: ${status}`);
  }

  // Check what campaigns ARE mapped to Anti Age range
  console.log('\n📋 All campaigns mapped to Anti Age range in master data:');
  const antiAgeRangeCampaigns = Object.entries(masterData.campaignToRangeMap || {})
    .filter(([campaign, range]) => range === 'Anti Age')
    .map(([campaign]) => campaign);
  
  console.log(`Found ${antiAgeRangeCampaigns.length} campaigns mapped to Anti Age:`);
  antiAgeRangeCampaigns.forEach(campaign => {
    console.log(`   - ${campaign}`);
  });

  // Check database mappings
  console.log('\n🗄️  DATABASE ANALYSIS:');
  
  try {
    // Get Anti Age range ID
    const antiAgeRange = await prisma.range.findFirst({
      where: { name: 'Anti Age' }
    });
    
    if (!antiAgeRange) {
      console.log('❌ Anti Age range not found in database!');
      return;
    }
    
    console.log(`✅ Anti Age range found in database (ID: ${antiAgeRange.id})`);

    // Check each campaign in database
    console.log('\n🔍 Database Campaign Status:');
    for (const campaign of antiAgeCampaigns) {
      const dbCampaign = await prisma.campaign.findFirst({
        where: { 
          name: campaign,
          status: { not: 'archived' }
        },
        include: {
          range: true
        }
      });
      
      if (!dbCampaign) {
        console.log(`   ${campaign}: ❌ NOT FOUND in database`);
      } else {
        const linkedRange = dbCampaign.range?.name;
        const hasAntiAge = linkedRange === 'Anti Age';
        const status = hasAntiAge ? '✅ Linked to Anti Age' : `⚠️  Linked to: ${linkedRange || 'NULL'}`;
        console.log(`   ${campaign}: ${status}`);
      }
    }

    // Get all campaigns linked to Anti Age range from database
    console.log('\n📋 All campaigns linked to Anti Age RANGE in database:');
    const antiAgeCampaignsFromDB = await prisma.campaign.findMany({
      where: {
        status: { not: 'archived' },
        range: {
          name: 'Anti Age'
        }
      },
      select: {
        name: true
      }
    });

    console.log(`Found ${antiAgeCampaignsFromDB.length} campaigns linked to Anti Age RANGE in database:`);
    antiAgeCampaignsFromDB.forEach(campaign => {
      console.log(`   - ${campaign.name}`);
    });

    // Also check Anti Age Category
    console.log('\n📋 Anti Age CATEGORY check:');
    const antiAgeCategory = await prisma.category.findFirst({
      where: { name: 'Anti Age' }
    });
    
    if (antiAgeCategory) {
      console.log(`✅ Anti Age category found in database (ID: ${antiAgeCategory.id})`);
      
      // Check which ranges are linked to Anti Age category
      const categoryRanges = await prisma.categoryToRange.findMany({
        where: { categoryId: antiAgeCategory.id },
        include: { range: true }
      });
      
      console.log(`Anti Age category is linked to ${categoryRanges.length} ranges:`);
      categoryRanges.forEach((cr: any) => {
        console.log(`   - ${cr.range.name}`);
      });
    } else {
      console.log('❌ Anti Age category not found in database!');
    }

    // Find discrepancies
    console.log('\n⚠️  DISCREPANCIES:');
    const masterDataAntiAge = new Set(antiAgeRangeCampaigns);
    const databaseAntiAge = new Set(antiAgeCampaignsFromDB.map(c => c.name));
    
    const inMasterNotDB = [...masterDataAntiAge].filter(c => !databaseAntiAge.has(c));
    const inDBNotMaster = [...databaseAntiAge].filter(c => !masterDataAntiAge.has(c));
    
    if (inMasterNotDB.length > 0) {
      console.log('📋 In master data but NOT in database:');
      inMasterNotDB.forEach(campaign => console.log(`   - ${campaign}`));
    }
    
    if (inDBNotMaster.length > 0) {
      console.log('🗄️  In database but NOT in master data:');
      inDBNotMaster.forEach(campaign => console.log(`   - ${campaign}`));
    }
    
    if (inMasterNotDB.length === 0 && inDBNotMaster.length === 0) {
      console.log('✅ Master data and database are in sync for Anti Age campaigns');
    }

    // Check case sensitivity issues
    console.log('\n🔍 CASE SENSITIVITY CHECK:');
    for (const campaign of antiAgeCampaigns) {
      // Check for case-insensitive matches
      const masterMatch = Object.keys(masterData.campaignToRangeMap || {})
        .find(key => key.toLowerCase() === campaign.toLowerCase());
      
      if (masterMatch && masterMatch !== campaign) {
        console.log(`   "${campaign}" found as "${masterMatch}" in master data (case difference)`);
      }
      
      // Check database case sensitivity (SQLite doesn't support mode: 'insensitive')
      const allCampaigns = await prisma.campaign.findMany({
        where: {
          status: { not: 'archived' }
        },
        select: {
          name: true
        }
      });
      
      const dbCaseMatch = allCampaigns.find(c => 
        c.name.toLowerCase() === campaign.toLowerCase() && c.name !== campaign
      );
      
      if (dbCaseMatch && dbCaseMatch.name !== campaign) {
        console.log(`   "${campaign}" found as "${dbCaseMatch.name}" in database (case difference)`);
      }
    }

  } catch (error: any) {
    console.log(`❌ Database error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

checkAntiAgeCampaigns().catch(console.error);