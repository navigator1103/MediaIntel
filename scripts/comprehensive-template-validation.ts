import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Parse CSV data
function parseCSV(content: string): string[][] {
  return content.split('\n')
    .map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')))
    .filter(row => row.some(cell => cell.length > 0));
}

async function comprehensiveTemplateValidation() {
  console.log('🔍 Comprehensive Template Validation\n');
  console.log('==========================================\n');

  try {
    // Read template files
    const dermaTemplatePath = path.join(process.cwd(), 'public/templates/Derma_Range_vs _Campaigns.csv');
    const niveaTemplatePath = path.join(process.cwd(), 'public/templates/Nivea Range vs Campaign.csv');
    
    const dermaContent = fs.readFileSync(dermaTemplatePath, 'utf-8');
    const niveaContent = fs.readFileSync(niveaTemplatePath, 'utf-8');
    
    const dermaData = parseCSV(dermaContent);
    const niveaData = parseCSV(niveaContent);
    
    // Extract template structure
    console.log('📋 DERMA TEMPLATE STRUCTURE:');
    console.log('============================');
    
    const dermaRanges = dermaData[1]; // Range names in row 2
    console.log(`Ranges (${dermaRanges.length}): [${dermaRanges.join(', ')}]\n`);
    
    // Map each range to its campaigns
    const dermaCampaignsByRange: Record<string, string[]> = {};
    for (let rangeIndex = 0; rangeIndex < dermaRanges.length; rangeIndex++) {
      const rangeName = dermaRanges[rangeIndex];
      if (!rangeName) continue;
      
      const campaigns: string[] = [];
      for (let rowIndex = 2; rowIndex < dermaData.length; rowIndex++) {
        const campaign = dermaData[rowIndex][rangeIndex];
        if (campaign && campaign.trim()) {
          campaigns.push(campaign.trim());
        }
      }
      dermaCampaignsByRange[rangeName] = campaigns;
      console.log(`${rangeName}: [${campaigns.join(', ')}]`);
    }
    
    console.log('\n📋 NIVEA TEMPLATE STRUCTURE:');
    console.log('============================');
    
    const niveaRanges = niveaData[0]; // Range names in row 1
    console.log(`Ranges (${niveaRanges.length}): [${niveaRanges.join(', ')}]\n`);
    
    // Map each range to its campaigns
    const niveaCampaignsByRange: Record<string, string[]> = {};
    for (let rangeIndex = 0; rangeIndex < niveaRanges.length; rangeIndex++) {
      const rangeName = niveaRanges[rangeIndex];
      if (!rangeName) continue;
      
      const campaigns: string[] = [];
      for (let rowIndex = 1; rowIndex < niveaData.length; rowIndex++) {
        const campaign = niveaData[rowIndex][rangeIndex];
        if (campaign && campaign.trim()) {
          campaigns.push(campaign.trim());
        }
      }
      niveaCampaignsByRange[rangeName] = campaigns;
      console.log(`${rangeName}: [${campaigns.join(', ')}]`);
    }
    
    console.log('\n🔍 DATABASE vs TEMPLATE COMPARISON:');
    console.log('=====================================');
    
    // Get current database state
    const dbRangesToCampaigns = await prisma.rangeToCampaign.findMany({
      include: {
        range: true,
        campaign: true
      }
    });
    
    const dbCampaignsByRange: Record<string, string[]> = {};
    dbRangesToCampaigns.forEach(relation => {
      if (relation.range && relation.campaign) {
        const rangeName = relation.range.name;
        const campaignName = relation.campaign.name;
        
        if (!dbCampaignsByRange[rangeName]) {
          dbCampaignsByRange[rangeName] = [];
        }
        if (!dbCampaignsByRange[rangeName].includes(campaignName)) {
          dbCampaignsByRange[rangeName].push(campaignName);
        }
      }
    });
    
    // Compare each range
    console.log('\n📊 RANGE-BY-RANGE COMPARISON:');
    console.log('==============================\n');
    
    // Check Derma ranges
    console.log('🔍 DERMA RANGES:');
    for (const rangeName of Object.keys(dermaCampaignsByRange)) {
      console.log(`\n📋 Range: "${rangeName}"`);
      const templateCampaigns = dermaCampaignsByRange[rangeName];
      const dbCampaigns = dbCampaignsByRange[rangeName] || [];
      
      console.log(`   Template campaigns (${templateCampaigns.length}): [${templateCampaigns.join(', ')}]`);
      console.log(`   Database campaigns (${dbCampaigns.length}): [${dbCampaigns.join(', ')}]`);
      
      // Find missing campaigns
      const missingInDb = templateCampaigns.filter(campaign => 
        !dbCampaigns.some(dbCamp => dbCamp.toLowerCase() === campaign.toLowerCase())
      );
      
      const extraInDb = dbCampaigns.filter(campaign => 
        !templateCampaigns.some(templateCamp => templateCamp.toLowerCase() === campaign.toLowerCase())
      );
      
      if (missingInDb.length > 0) {
        console.log(`   ❌ Missing in DB: [${missingInDb.join(', ')}]`);
      }
      
      if (extraInDb.length > 0) {
        console.log(`   ⚠️  Extra in DB: [${extraInDb.join(', ')}]`);
      }
      
      if (missingInDb.length === 0 && extraInDb.length === 0) {
        console.log(`   ✅ Perfect match!`);
      }
    }
    
    // Check Nivea ranges
    console.log('\n🔍 NIVEA RANGES:');
    for (const rangeName of Object.keys(niveaCampaignsByRange)) {
      console.log(`\n📋 Range: "${rangeName}"`);
      const templateCampaigns = niveaCampaignsByRange[rangeName];
      const dbCampaigns = dbCampaignsByRange[rangeName] || [];
      
      console.log(`   Template campaigns (${templateCampaigns.length}): [${templateCampaigns.join(', ')}]`);
      console.log(`   Database campaigns (${dbCampaigns.length}): [${dbCampaigns.join(', ')}]`);
      
      // Find missing campaigns
      const missingInDb = templateCampaigns.filter(campaign => 
        !dbCampaigns.some(dbCamp => dbCamp.toLowerCase() === campaign.toLowerCase())
      );
      
      const extraInDb = dbCampaigns.filter(campaign => 
        !templateCampaigns.some(templateCamp => templateCamp.toLowerCase() === campaign.toLowerCase())
      );
      
      if (missingInDb.length > 0) {
        console.log(`   ❌ Missing in DB: [${missingInDb.join(', ')}]`);
      }
      
      if (extraInDb.length > 0) {
        console.log(`   ⚠️  Extra in DB: [${extraInDb.join(', ')}]`);
      }
      
      if (missingInDb.length === 0 && extraInDb.length === 0) {
        console.log(`   ✅ Perfect match!`);
      }
    }
    
    console.log('\n✅ Comprehensive template validation completed!');
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveTemplateValidation();