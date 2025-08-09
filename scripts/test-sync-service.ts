import { getDatabaseSyncService } from '../src/lib/database-sync';

async function testSyncService() {
  console.log('🧪 Testing Database Sync Service...\n');
  
  // Configure for local testing
  const syncService = getDatabaseSyncService({
    enabled: true,
    mode: 'manual',
    productionSource: 'local',
    localPath: '/Users/naveedshah/Downloads/golden_rules_backup_2025-08-09.db',
    preserveLocalData: true
  });
  
  console.log('📊 Sync Service Status:');
  console.log('  - Enabled:', syncService.isEnabled());
  console.log('  - In Progress:', syncService.isSyncInProgress());
  
  const lastSync = syncService.getLastSyncInfo();
  if (lastSync) {
    console.log('  - Last Sync:', new Date(lastSync.timestamp).toLocaleString());
    console.log('  - Success:', lastSync.success);
    console.log('  - Records Synced:', lastSync.totalRecords);
  } else {
    console.log('  - No previous sync history');
  }
  
  console.log('\n🚀 Starting sync test...');
  console.log('  Source: /Users/naveedshah/Downloads/golden_rules_backup_2025-08-09.db\n');
  
  try {
    const result = await syncService.performSync();
    
    console.log('\n✨ Sync Test Results:');
    console.log('  - Success:', result.success);
    console.log('  - Duration:', (result.duration / 1000).toFixed(2), 'seconds');
    console.log('  - Total Records:', result.totalRecords);
    console.log('\n  Table Summary:');
    
    for (const [table, stats] of Object.entries(result.tablesSync)) {
      console.log(`    ${table}:`);
      console.log(`      - Added: ${(stats as any).added}`);
      console.log(`      - Updated: ${(stats as any).updated}`);
      console.log(`      - Skipped: ${(stats as any).skipped}`);
      console.log(`      - Errors: ${(stats as any).errors}`);
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n  ⚠️ Errors encountered:');
      result.errors.forEach(err => console.log(`    - ${err}`));
    }
    
  } catch (error: any) {
    console.error('\n❌ Sync test failed:', error.message);
  }
}

testSyncService().catch(console.error);