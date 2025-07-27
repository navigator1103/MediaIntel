import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING ANTI AGE RANGE ASSOCIATIONS ===\n');

  try {
    // Load master data to see current mappings
    const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

    console.log('1. MASTER DATA ANTI AGE MAPPINGS:');
    console.log('---------------------------------');
    console.log('Anti Age category → ranges:', masterData.categoryToRanges?.['Anti Age'] || []);
    console.log('Anti Age range → campaigns:', masterData.rangeToCampaigns?.['Anti Age'] || []);
    
    // Get Anti Age campaigns from master data
    const antiAgeCampaigns = masterData.rangeToCampaigns?.['Anti Age'] || [];
    console.log(`Found ${antiAgeCampaigns.length} Anti Age campaigns in master data:`);
    antiAgeCampaigns.forEach((campaign: string, index: number) => {
      console.log(`  ${index + 1}. ${campaign}`);
    });

    console.log('\\n2. DATABASE ANTI AGE RANGE CHECK:');
    console.log('---------------------------------');
    
    // Check if Anti Age range exists in database
    const antiAgeRange = await prisma.range.findUnique({
      where: { name: 'Anti Age' },
      include: {
        campaigns: true,
        categories: {
          include: { category: true }
        }
      }
    });

    if (antiAgeRange) {
      console.log(`✅ Anti Age range found in database:`);
      console.log(`  ID: ${antiAgeRange.id}`);
      console.log(`  Name: ${antiAgeRange.name}`);
      console.log(`  Associated categories: [${antiAgeRange.categories.map(c => c.category.name).join(', ')}]`);
      console.log(`  Associated campaigns: ${antiAgeRange.campaigns.length}`);
      
      const dbCampaignNames = antiAgeRange.campaigns.map(c => c.name);
      console.log('  Campaign names in DB:');
      dbCampaignNames.forEach((name, index) => {
        console.log(`    ${index + 1}. ${name}`);
      });
      
      // Compare with master data
      const missingFromDB = antiAgeCampaigns.filter((name: string) => !dbCampaignNames.includes(name));
      const extraInDB = dbCampaignNames.filter(name => !antiAgeCampaigns.includes(name));
      
      if (missingFromDB.length > 0) {
        console.log(`\\n⚠️  Campaigns in master data but missing from DB: ${missingFromDB.length}`);
        missingFromDB.forEach((name: string) => console.log(`    - ${name}`));
      }
      
      if (extraInDB.length > 0) {
        console.log(`\\n⚠️  Campaigns in DB but not in master data: ${extraInDB.length}`);
        extraInDB.forEach(name => console.log(`    - ${name}`));
      }
      
      if (missingFromDB.length === 0 && extraInDB.length === 0) {
        console.log('\\n✅ Perfect sync between master data and database!');
      }
      
    } else {
      console.log('❌ Anti Age range NOT found in database');
    }

    console.log('\\n3. GAME PLANS WITH ANTI AGE CATEGORY:');
    console.log('------------------------------------');
    
    // Find game plans that have Anti Age category
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
      take: 10 // Limit to first 10 for readability
    });

    console.log(`Found ${antiAgeGamePlans.length} game plans with Anti Age category (showing first 10):`);
    
    antiAgeGamePlans.forEach((plan, index) => {
      const rangeName = plan.campaign?.range?.name || 'N/A';
      const campaignName = plan.campaign?.name || 'N/A';
      console.log(`  ${index + 1}. Campaign: "${campaignName}" → Range: "${rangeName}"`);
      
      if (rangeName === 'N/A') {
        console.log(`       ⚠️  ISSUE: Campaign "${campaignName}" has no range association!`);
      }
    });

    console.log('\\n4. CAMPAIGNS WITHOUT RANGE ASSOCIATIONS:');
    console.log('----------------------------------------');
    
    // Find campaigns that don't have range associations
    const campaignsWithoutRange = await prisma.campaign.findMany({
      where: {
        rangeId: null
      },
      take: 20
    });

    console.log(`Found ${campaignsWithoutRange.length} campaigns without range associations (showing first 20):`);
    campaignsWithoutRange.forEach((campaign, index) => {
      console.log(`  ${index + 1}. "${campaign.name}" (ID: ${campaign.id})`);
    });

    console.log('\\n5. RECOMMENDATIONS:');
    console.log('-------------------');
    
    if (antiAgeRange && antiAgeRange.campaigns.length > 0) {
      console.log('✅ Anti Age range exists with campaigns');
    } else {
      console.log('❌ Anti Age range missing or has no campaigns');
    }
    
    if (antiAgeGamePlans.some(plan => !plan.campaign?.range)) {
      console.log('⚠️  Some Anti Age game plans have campaigns without range associations');
      console.log('    → Need to update campaign-range relationships in database');
    }
    
    if (campaignsWithoutRange.length > 0) {
      console.log(`⚠️  ${campaignsWithoutRange.length} total campaigns lack range associations`);
      console.log('    → Consider running a script to sync campaign-range relationships from master data');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);