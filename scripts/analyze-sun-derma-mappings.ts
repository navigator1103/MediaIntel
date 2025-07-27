import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== SUN & DERMA MAPPINGS ANALYSIS ===\n');

  // Load master data
  const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
  const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

  console.log('1. CURRENT SUN MAPPINGS ANALYSIS:');
  console.log('---------------------------------');
  
  // Analyze Sun category and range mappings
  const sunCategoryToRanges = masterData.categoryToRanges?.Sun || [];
  const sunRangeToCampaigns = masterData.rangeToCampaigns?.Sun || [];
  const sunRangeBusinessUnit = masterData.rangeToBusinessUnit?.Sun;
  const sunCategoryBusinessUnit = masterData.categoryToBusinessUnit?.Sun;
  
  console.log('Sun Category Analysis:');
  console.log(`  Sun category business unit: ${sunCategoryBusinessUnit}`);
  console.log(`  Sun category ranges: [${sunCategoryToRanges.join(', ')}]`);
  console.log();
  console.log('Sun Range Analysis:');
  console.log(`  Sun range business unit: ${sunRangeBusinessUnit}`);
  console.log(`  Sun range campaigns: [${sunRangeToCampaigns.join(', ')}]`);
  
  // Find all campaigns that should belong to Sun range based on campaignToRange
  const allSunCampaigns: string[] = [];
  Object.entries(masterData.campaignToRange || {}).forEach(([campaign, range]) => {
    if (range === 'Sun') {
      allSunCampaigns.push(campaign);
    }
  });
  
  console.log(`\nAll campaigns mapped to Sun range in campaignToRange: ${allSunCampaigns.length}`);
  console.log(`  [${allSunCampaigns.join(', ')}]`);
  
  // Check discrepancy
  const missingFromRangeToCampaigns = allSunCampaigns.filter(campaign => !sunRangeToCampaigns.includes(campaign));
  console.log(`\nCampaigns missing from rangeToCampaigns["Sun"]: ${missingFromRangeToCampaigns.length}`);
  if (missingFromRangeToCampaigns.length > 0) {
    console.log(`  [${missingFromRangeToCampaigns.join(', ')}]`);
  }

  console.log('\n2. DATABASE ANALYSIS:');
  console.log('---------------------');
  
  try {
    // Check for Superstar campaign in database
    const superstarCampaign = await prisma.campaign.findFirst({
      where: { name: { contains: 'Superstar' } }
    });
    
    if (superstarCampaign) {
      console.log(`✅ Found "Superstar" campaign in database:`);
      console.log(`  ID: ${superstarCampaign.id}`);
      console.log(`  Name: ${superstarCampaign.name}`);
      console.log(`  Range ID: ${superstarCampaign.rangeId}`);
      console.log(`  Status: ${superstarCampaign.status}`);
    } else {
      console.log('❌ "Superstar" campaign NOT found in database');
    }
    
    // Get all Sun-related campaigns from database
    const sunRangeDb = await prisma.range.findFirst({
      where: { name: 'Sun' },
      include: {
        campaigns: true,
        categories: {
          include: { category: true }
        }
      }
    });
    
    if (sunRangeDb) {
      console.log(`\n✅ Found Sun range in database:`);
      console.log(`  ID: ${sunRangeDb.id}`);
      console.log(`  Name: ${sunRangeDb.name}`);
      console.log(`  Categories: [${sunRangeDb.categories.map(c => c.category.name).join(', ')}]`);
      console.log(`  Campaigns: ${sunRangeDb.campaigns.length}`);
      
      const dbSunCampaigns = sunRangeDb.campaigns.map(c => c.name);
      console.log(`  Campaign names: [${dbSunCampaigns.join(', ')}]`);
      
      // Check if Superstar is in the database campaigns
      const hasSuperstar = dbSunCampaigns.some(name => name.toLowerCase().includes('superstar'));
      console.log(`  Contains "Superstar": ${hasSuperstar}`);
      
      // Compare with master data
      const dbOnlyCampaigns = dbSunCampaigns.filter(name => !allSunCampaigns.includes(name));
      const masterOnlyCampaigns = allSunCampaigns.filter(name => !dbSunCampaigns.includes(name));
      
      console.log(`\n  Campaigns in DB but not in master data: ${dbOnlyCampaigns.length}`);
      if (dbOnlyCampaigns.length > 0) {
        console.log(`    [${dbOnlyCampaigns.join(', ')}]`);
      }
      
      console.log(`  Campaigns in master data but not in DB: ${masterOnlyCampaigns.length}`);
      if (masterOnlyCampaigns.length > 0) {
        console.log(`    [${masterOnlyCampaigns.join(', ')}]`);
      }
    } else {
      console.log('❌ Sun range NOT found in database');
    }
    
    // Check for any campaigns with "sun" in the name
    const sunNamedCampaigns = await prisma.campaign.findMany({
      where: { 
        OR: [
          { name: { contains: 'Sun' } },
          { name: { contains: 'UV' } },
          { name: { contains: 'Superstar' } }
        ]
      }
    });
    
    console.log(`\nAll Sun/UV/Superstar related campaigns in database: ${sunNamedCampaigns.length}`);
    
    // Get range names for these campaigns
    for (const campaign of sunNamedCampaigns) {
      let rangeName = 'No Range';
      if (campaign.rangeId) {
        const range = await prisma.range.findUnique({ where: { id: campaign.rangeId } });
        rangeName = range?.name || 'Unknown Range';
      }
      console.log(`  "${campaign.name}" → Range: "${rangeName}"`);
    }
    
  } catch (error) {
    console.log('Database connection error:', error);
  }

  console.log('\n3. BUSINESS UNIT CONFLICTS:');
  console.log('---------------------------');
  
  // Check for business unit conflicts
  console.log('Sun category vs Sun range business unit:');
  console.log(`  Category "Sun" → Business Unit: ${sunCategoryBusinessUnit}`);
  console.log(`  Range "Sun" → Business Unit: ${sunRangeBusinessUnit}`);
  
  if (sunCategoryBusinessUnit !== sunRangeBusinessUnit) {
    console.log('  ⚠️  CONFLICT: Category and Range have different business units!');
  } else {
    console.log('  ✅ No conflict');
  }
  
  // Check UV Face range (since it's also Sun category)
  const uvFaceRangeToCampaigns = masterData.rangeToCampaigns?.['UV Face'] || [];
  const uvFaceRangeBusinessUnit = masterData.rangeToBusinessUnit?.['UV Face'];
  
  console.log('\nUV Face range analysis (also maps to Sun category):');
  console.log(`  UV Face range business unit: ${uvFaceRangeBusinessUnit}`);
  console.log(`  UV Face range campaigns: [${uvFaceRangeToCampaigns.join(', ')}]`);

  console.log('\n4. RECOMMENDATIONS:');
  console.log('-------------------');
  
  console.log('Issues found:');
  if (missingFromRangeToCampaigns.length > 0) {
    console.log(`  1. ${missingFromRangeToCampaigns.length} campaigns missing from rangeToCampaigns["Sun"]`);
  }
  
  if (sunCategoryBusinessUnit !== sunRangeBusinessUnit) {
    console.log('  2. Business unit conflict between Sun category and Sun range');
  }
  
  console.log('\nNext steps:');
  console.log('  1. Check if "Superstar" exists in any campaign data sources');
  console.log('  2. Sync rangeToCampaigns["Sun"] with all campaigns that map to Sun range');
  console.log('  3. Resolve business unit conflicts for Sun');
  console.log('  4. Consider if separate Sun ranges needed for Nivea vs Derma');

  await prisma.$disconnect();
}

main().catch(console.error);