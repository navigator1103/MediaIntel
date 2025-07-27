import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncMasterDataToDatabase() {
  console.log('🔄 Syncing masterData.json mappings to database...\n');

  try {
    // Load the latest masterData.json
    const masterDataPath = path.join(__dirname, '..', 'src', 'lib', 'validation', 'masterData.json');
    const masterData = JSON.parse(fs.readFileSync(masterDataPath, 'utf-8'));

    console.log('📖 Loaded masterData.json with:');
    console.log(`   - ${Object.keys(masterData.campaignToBusinessUnit || {}).length} campaign-to-business-unit mappings`);
    console.log(`   - ${Object.keys(masterData.categoryToBusinessUnit || {}).length} category-to-business-unit mappings`);
    console.log(`   - ${Object.keys(masterData.rangeToBusinessUnit || {}).length} range-to-business-unit mappings`);
    console.log(`   - ${Object.keys(masterData.rangeToCampaigns || {}).length} range-to-campaigns mappings`);

    // 1. Sync Categories
    console.log('\n📂 Syncing Categories...');
    const categories = masterData.categories || [];
    for (const categoryName of categories) {
      await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });
    }
    console.log(`   ✅ Synced ${categories.length} categories`);

    // 2. Sync Ranges
    console.log('\n📁 Syncing Ranges...');
    const ranges = masterData.ranges || [];
    for (const rangeName of ranges) {
      await prisma.range.upsert({
        where: { name: rangeName },
        update: {},
        create: { name: rangeName }
      });
    }
    console.log(`   ✅ Synced ${ranges.length} ranges`);

    // 3. Sync Category-to-Range relationships
    console.log('\n🔗 Syncing Category-to-Range relationships...');
    const categoryToRanges = masterData.categoryToRanges || {};
    let categoryRangeCount = 0;
    
    for (const [categoryName, rangeNames] of Object.entries(categoryToRanges)) {
      const category = await prisma.category.findUnique({ where: { name: categoryName } });
      if (!category) {
        console.log(`   ⚠️  Category '${categoryName}' not found, skipping...`);
        continue;
      }

      for (const rangeName of rangeNames as string[]) {
        const range = await prisma.range.findUnique({ where: { name: rangeName } });
        if (!range) {
          console.log(`   ⚠️  Range '${rangeName}' not found, skipping...`);
          continue;
        }

        await prisma.categoryToRange.upsert({
          where: {
            categoryId_rangeId: {
              categoryId: category.id,
              rangeId: range.id
            }
          },
          update: {},
          create: {
            categoryId: category.id,
            rangeId: range.id
          }
        });
        categoryRangeCount++;
      }
    }
    console.log(`   ✅ Synced ${categoryRangeCount} category-to-range relationships`);

    // 4. Sync Campaigns
    console.log('\n🎯 Syncing Campaigns...');
    const campaignToRangeMap = masterData.campaignToRangeMap || {};
    let campaignCount = 0;

    for (const [campaignName, rangeName] of Object.entries(campaignToRangeMap)) {
      const range = await prisma.range.findUnique({ where: { name: rangeName as string } });
      if (!range) {
        console.log(`   ⚠️  Range '${rangeName}' not found for campaign '${campaignName}', skipping...`);
        continue;
      }

      await prisma.campaign.upsert({
        where: { name: campaignName },
        update: {
          rangeId: range.id
        },
        create: {
          name: campaignName,
          rangeId: range.id,
          status: 'active'
        }
      });
      campaignCount++;
    }
    console.log(`   ✅ Synced ${campaignCount} campaigns with range relationships`);

    // 5. Verify the sync by checking key mappings
    console.log('\n🔍 Verifying sync results...');
    
    // Check Disney campaign
    const disneyFromDb = await prisma.campaign.findUnique({
      where: { name: 'Disney' },
      include: { range: true }
    });
    
    if (disneyFromDb) {
      console.log(`   📌 Disney campaign: mapped to range '${disneyFromDb.range?.name}' in database`);
      console.log(`   📌 Disney campaign: mapped to range '${masterData.campaignToRangeMap?.Disney}' in masterData.json`);
      const match = disneyFromDb.range?.name === masterData.campaignToRangeMap?.Disney;
      console.log(`   ${match ? '✅' : '❌'} Disney mapping matches: ${match}`);
    } else {
      console.log(`   ❌ Disney campaign not found in database`);
    }

    // Check Triple Effect campaign
    const tripleEffectFromDb = await prisma.campaign.findUnique({
      where: { name: 'Triple Effect' },
      include: { range: true }
    });
    
    if (tripleEffectFromDb) {
      console.log(`   📌 Triple Effect campaign: mapped to range '${tripleEffectFromDb.range?.name}' in database`);
      console.log(`   📌 Triple Effect campaign: mapped to range '${masterData.campaignToRangeMap?.['Triple Effect']}' in masterData.json`);
      const match = tripleEffectFromDb.range?.name === masterData.campaignToRangeMap?.['Triple Effect'];
      console.log(`   ${match ? '✅' : '❌'} Triple Effect mapping matches: ${match}`);
    } else {
      console.log(`   ❌ Triple Effect campaign not found in database`);
    }

    // Check category-range relationships
    const lipCategoryRanges = await prisma.categoryToRange.findMany({
      where: {
        category: { name: 'Lip' }
      },
      include: {
        range: true
      }
    });
    
    console.log(`   📌 Lip category has ${lipCategoryRanges.length} ranges in database: ${lipCategoryRanges.map(cr => cr.range.name).join(', ')}`);
    const expectedLipRanges = masterData.categoryToRanges?.Lip || [];
    console.log(`   📌 Lip category should have ranges: ${expectedLipRanges.join(', ')}`);

    console.log('\n🎉 Database sync completed!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ ${categories.length} categories synced`);
    console.log(`   ✅ ${ranges.length} ranges synced`);  
    console.log(`   ✅ ${categoryRangeCount} category-range relationships synced`);
    console.log(`   ✅ ${campaignCount} campaigns synced with range mappings`);
    
    console.log('\n⚠️  Note: Business unit mappings are still in masterData.json');
    console.log('   The API will load these from the static file since there\'s no');
    console.log('   business unit table in the current database schema.');

  } catch (error) {
    console.error('❌ Error syncing master data to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncMasterDataToDatabase().catch(console.error);