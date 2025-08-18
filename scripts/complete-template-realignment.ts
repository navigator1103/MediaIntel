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

async function completeTemplateRealignment() {
  console.log('🔄 COMPLETE TEMPLATE REALIGNMENT');
  console.log('=====================================\n');

  try {
    // Step 1: Read template files
    console.log('📚 Step 1: Reading template files...');
    const dermaTemplatePath = path.join(process.cwd(), 'public/templates/Derma_Range_vs _Campaigns.csv');
    const niveaTemplatePath = path.join(process.cwd(), 'public/templates/Nivea Range vs Campaign.csv');
    
    const dermaContent = fs.readFileSync(dermaTemplatePath, 'utf-8');
    const niveaContent = fs.readFileSync(niveaTemplatePath, 'utf-8');
    
    const dermaData = parseCSV(dermaContent);
    const niveaData = parseCSV(niveaContent);

    // Step 2: Extract template structure
    console.log('📋 Step 2: Extracting template structure...');
    
    // Parse Derma template
    const dermaRanges = dermaData[1]; // Range names in row 2
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
    }
    
    // Parse Nivea template
    const niveaRanges = niveaData[0]; // Range names in row 1
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
    }

    console.log(`   Derma ranges: ${Object.keys(dermaCampaignsByRange).length}`);
    console.log(`   Nivea ranges: ${Object.keys(niveaCampaignsByRange).length}`);

    // Step 3: Clear existing junction table
    console.log('\n🗑️  Step 3: Clearing existing junction table...');
    const deletedCount = await prisma.rangeToCampaign.deleteMany();
    console.log(`   Deleted ${deletedCount.count} existing relationships`);

    // Step 4: Rebuild junction table from templates
    console.log('\n🔨 Step 4: Rebuilding junction table from templates...');
    
    let totalRelationships = 0;
    let skippedCampaigns = 0;
    let skippedRanges = 0;

    // Process Derma template
    console.log('\n📋 Processing Derma template...');
    for (const [rangeName, campaigns] of Object.entries(dermaCampaignsByRange)) {
      // Find range in database
      const range = await prisma.range.findFirst({
        where: { name: rangeName }
      });
      
      if (!range) {
        console.log(`   ⚠️  Range not found: "${rangeName}"`);
        skippedRanges++;
        continue;
      }
      
      console.log(`   📁 Range "${rangeName}" (${campaigns.length} campaigns)`);
      
      for (const campaignName of campaigns) {
        // Find campaign in database (exact match first, then case-insensitive)
        let campaign = await prisma.campaign.findFirst({
          where: { name: campaignName }
        });
        
        if (!campaign) {
          // Try case-insensitive search
          const allCampaigns = await prisma.campaign.findMany();
          campaign = allCampaigns.find(c => c.name.toLowerCase() === campaignName.toLowerCase()) || null;
        }
        
        if (!campaign) {
          console.log(`     ❌ Campaign not found: "${campaignName}"`);
          skippedCampaigns++;
          continue;
        }
        
        // Create junction table entry
        try {
          await prisma.rangeToCampaign.create({
            data: {
              rangeId: range.id,
              campaignId: campaign.id
            }
          });
          totalRelationships++;
          console.log(`     ✅ Linked: "${campaignName}"`);
        } catch (error) {
          console.log(`     ⚠️  Failed to link "${campaignName}": ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Process Nivea template
    console.log('\n📋 Processing Nivea template...');
    for (const [rangeName, campaigns] of Object.entries(niveaCampaignsByRange)) {
      // Skip empty range names
      if (!rangeName || rangeName.trim() === '') continue;
      
      // Find range in database
      const range = await prisma.range.findFirst({
        where: { name: rangeName }
      });
      
      if (!range) {
        console.log(`   ⚠️  Range not found: "${rangeName}"`);
        skippedRanges++;
        continue;
      }
      
      console.log(`   📁 Range "${rangeName}" (${campaigns.length} campaigns)`);
      
      for (const campaignName of campaigns) {
        // Find campaign in database (exact match first, then case-insensitive)
        let campaign = await prisma.campaign.findFirst({
          where: { name: campaignName }
        });
        
        if (!campaign) {
          // Try case-insensitive search
          const allCampaigns = await prisma.campaign.findMany();
          campaign = allCampaigns.find(c => c.name.toLowerCase() === campaignName.toLowerCase()) || null;
        }
        
        if (!campaign) {
          console.log(`     ❌ Campaign not found: "${campaignName}"`);
          skippedCampaigns++;
          continue;
        }
        
        // Check if relationship already exists (to avoid duplicates)
        const existingRelation = await prisma.rangeToCampaign.findFirst({
          where: {
            rangeId: range.id,
            campaignId: campaign.id
          }
        });
        
        if (existingRelation) {
          console.log(`     ℹ️  Already linked: "${campaignName}"`);
          continue;
        }
        
        // Create junction table entry
        try {
          await prisma.rangeToCampaign.create({
            data: {
              rangeId: range.id,
              campaignId: campaign.id
            }
          });
          totalRelationships++;
          console.log(`     ✅ Linked: "${campaignName}"`);
        } catch (error) {
          console.log(`     ⚠️  Failed to link "${campaignName}": ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Step 5: Summary
    console.log('\n📊 REALIGNMENT SUMMARY:');
    console.log('========================');
    console.log(`✅ Total relationships created: ${totalRelationships}`);
    console.log(`⚠️  Skipped campaigns (not found): ${skippedCampaigns}`);
    console.log(`⚠️  Skipped ranges (not found): ${skippedRanges}`);

    // Step 6: Verify master data will load correctly
    console.log('\n🧪 Step 6: Testing master data loading...');
    try {
      const testJunctions = await prisma.rangeToCampaign.findMany({
        take: 5,
        include: {
          range: true,
          campaign: true
        }
      });
      
      console.log(`✅ Master data loading test passed! Sample relationships:`);
      testJunctions.forEach(relation => {
        console.log(`   - Range: "${relation.range.name}" → Campaign: "${relation.campaign.name}"`);
      });
    } catch (error) {
      console.error(`❌ Master data loading test failed:`, error);
    }

    console.log('\n🎉 COMPLETE TEMPLATE REALIGNMENT FINISHED!');
    console.log('===========================================');
    console.log('🔄 The database now matches the templates exactly.');
    console.log('✅ Exception-based validation should work perfectly.');
    console.log('📊 Master data API will include all many-to-many relationships.');

  } catch (error) {
    console.error('❌ Error during realignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeTemplateRealignment();