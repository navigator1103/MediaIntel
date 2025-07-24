#!/usr/bin/env ts-node

/**
 * Session Cleanup Script
 * 
 * This script removes expired session files from the data/sessions directory.
 * It should be run periodically (e.g., via cron job) to prevent disk space accumulation.
 * 
 * Usage:
 *   npm run cleanup-sessions
 *   or
 *   ts-node scripts/cleanup-sessions.ts
 * 
 * Environment Variables:
 *   SESSION_TIMEOUT_HOURS - Session timeout in hours (default: 4)
 *   SESSION_CLEANUP_INTERVAL_HOURS - Cleanup interval in hours (default: 1)
 */

import { SessionManager } from '../src/lib/utils/sessionManager';

async function main() {
  console.log('🧹 Starting session cleanup script...');
  console.log(`📅 ${new Date().toISOString()}`);
  
  try {
    // Get current stats before cleanup
    const statsBefore = await SessionManager.getSessionStats();
    const config = SessionManager.getSessionConfig();
    
    console.log('\n📊 Session Statistics (Before Cleanup):');
    console.log(`   Total sessions: ${statsBefore.total}`);
    console.log(`   Active sessions: ${statsBefore.active}`);
    console.log(`   Expired sessions: ${statsBefore.expired}`);
    console.log(`   Legacy sessions: ${statsBefore.legacy}`);
    
    console.log('\n⚙️ Configuration:');
    console.log(`   Session timeout: ${config.timeoutHours} hours`);
    console.log(`   Cleanup interval: ${config.cleanupIntervalHours} hours`);
    
    // Run cleanup
    console.log('\n🚀 Running cleanup...');
    const results = await SessionManager.cleanupExpiredSessions();
    
    // Get updated stats
    const statsAfter = await SessionManager.getSessionStats();
    
    console.log('\n✅ Cleanup Results:');
    console.log(`   Sessions removed: ${results.removed}`);
    console.log(`   Errors encountered: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n📊 Session Statistics (After Cleanup):');
    console.log(`   Total sessions: ${statsAfter.total}`);
    console.log(`   Active sessions: ${statsAfter.active}`);
    console.log(`   Expired sessions: ${statsAfter.expired}`);
    console.log(`   Legacy sessions: ${statsAfter.legacy}`);
    
    // Calculate cleanup effectiveness
    const removed = statsBefore.total - statsAfter.total;
    const diskSpaceSaved = removed * 0.5; // Rough estimate: 0.5MB per session
    
    console.log('\n💾 Impact:');
    console.log(`   Sessions cleaned: ${removed}`);
    console.log(`   Estimated disk space saved: ~${diskSpaceSaved.toFixed(1)} MB`);
    
    console.log('\n🎉 Session cleanup completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Session cleanup failed:', error);
    process.exit(1);
  }
}

// Handle script interruption gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Session cleanup interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Session cleanup terminated');
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});