import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const prisma = new PrismaClient();

async function migrateMissingData() {
  console.log('🚀 Starting migration of missing data...\n');
  
  // Open production database
  const prodDb = new Database('/Users/naveedshah/Downloads/golden_rules_backup_2025-08-09.db');
  
  try {
    // 1. Migrate missing TV Diminishing Returns
    console.log('📤 Migrating TV Diminishing Returns...');
    
    // Get max ID from local database
    const localMaxId = await prisma.tvDiminishingReturns.aggregate({
      _max: { id: true }
    });
    const maxId = localMaxId._max.id || 0;
    
    // Get new records from production
    const newTvRecords = prodDb.prepare(`
      SELECT * FROM tv_diminishing_returns 
      WHERE id > ?
      ORDER BY id
    `).all(maxId) as any[];
    
    console.log(`  Found ${newTvRecords.length} new TV diminishing returns records to migrate`);
    
    let tvAdded = 0;
    for (const record of newTvRecords) {
      try {
        await prisma.tvDiminishingReturns.create({
          data: {
            id: record.id,
            countryId: record.country_id,
            businessUnitId: record.business_unit_id,
            trp: record.trp,
            audience1Reach: record.audience1_reach,
            audience2Reach: record.audience2_reach,
            audience3Reach: record.audience3_reach,
            audience4Reach: record.audience4_reach,
            audience5Reach: record.audience5_reach
          }
        });
        tvAdded++;
        if (tvAdded % 10 === 0) {
          console.log(`    Processed ${tvAdded} records...`);
        }
      } catch (error: any) {
        console.log(`  ⚠️ Error adding TV diminishing returns ${record.id}: ${error.message}`);
      }
    }
    console.log(`  ✅ Added ${tvAdded} new TV diminishing returns records\n`);
    
    // 2. Check SOV data integrity
    console.log('📤 Checking Share of Voice data...');
    const localSovCount = await prisma.shareOfVoice.count();
    const prodSovCount = prodDb.prepare('SELECT COUNT(*) as count FROM share_of_voice').get() as any;
    
    if (localSovCount === prodSovCount.count) {
      console.log(`  ✅ SOV data is in sync (${localSovCount} records)\n`);
    } else {
      console.log(`  ⚠️ SOV mismatch: Local has ${localSovCount}, Production has ${prodSovCount.count}\n`);
    }
    
    // 3. Check MediaSufficiency data integrity
    console.log('📤 Checking Media Sufficiency data...');
    const localMsCount = await prisma.mediaSufficiency.count();
    const prodMsCount = prodDb.prepare('SELECT COUNT(*) as count FROM media_sufficiency').get() as any;
    
    if (localMsCount === prodMsCount.count) {
      console.log(`  ✅ Media Sufficiency data is in sync (${localMsCount} records)\n`);
    } else {
      console.log(`  ⚠️ Media Sufficiency mismatch: Local has ${localMsCount}, Production has ${prodMsCount.count}\n`);
    }
    
    // Final summary
    console.log('✨ Migration completed!');
    console.log('📊 Final counts:');
    const finalTvCount = await prisma.tvDiminishingReturns.count();
    const finalDigitalCount = await prisma.digitalDiminishingReturns.count();
    const finalSovCount = await prisma.shareOfVoice.count();
    const finalMsCount = await prisma.mediaSufficiency.count();
    
    console.log(`   - TV Diminishing Returns: ${finalTvCount}`);
    console.log(`   - Digital Diminishing Returns: ${finalDigitalCount}`);
    console.log(`   - Share of Voice: ${finalSovCount}`);
    console.log(`   - Media Sufficiency: ${finalMsCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    prodDb.close();
    await prisma.$disconnect();
  }
}

migrateMissingData().catch(console.error);