import fs from 'fs';
import path from 'path';

async function debugSessionData() {
  try {
    console.log('🔍 Debugging session data...');
    
    // Get all session files
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    
    if (!fs.existsSync(sessionsDir)) {
      console.log('❌ Sessions directory does not exist');
      return;
    }
    
    const files = fs.readdirSync(sessionsDir);
    const sessionFiles = files.filter(f => f.endsWith('.json'));
    
    console.log(`📂 Found ${sessionFiles.length} session files`);
    
    // Check the most recent session files
    const recentSessions = sessionFiles
      .map(f => ({
        name: f,
        stats: fs.statSync(path.join(sessionsDir, f))
      }))
      .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())
      .slice(0, 3); // Get 3 most recent
    
    recentSessions.forEach((session, index) => {
      console.log(`\n📄 Session ${index + 1}: ${session.name}`);
      console.log(`   Modified: ${session.stats.mtime.toISOString()}`);
      
      try {
        const sessionPath = path.join(sessionsDir, session.name);
        const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
        
        console.log(`   Status: ${sessionData.status || 'unknown'}`);
        console.log(`   LastUpdateId: ${sessionData.lastUpdateId || 'missing'}`);
        console.log(`   Records count: ${sessionData.data?.records?.length || sessionData.records?.length || 'unknown'}`);
        
        // Check if this is the session with your upload
        if (sessionData.data?.records || sessionData.records) {
          const records = sessionData.data?.records || sessionData.records;
          if (records.length > 0) {
            const firstRecord = records[0];
            console.log(`   Sample record country: ${firstRecord.Country || 'unknown'}`);
            console.log(`   Sample record campaign: ${firstRecord.Campaign || 'unknown'}`);
          }
        }
        
        // Log the entire session structure for debugging
        console.log(`   Session structure keys: ${Object.keys(sessionData).join(', ')}`);
        
        if (sessionData.lastUpdateId) {
          console.log(`   ✅ LastUpdateId found: ${sessionData.lastUpdateId} (type: ${typeof sessionData.lastUpdateId})`);
        } else {
          console.log(`   ❌ LastUpdateId missing or null`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error reading session: ${error}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging session data:', error);
  }
}

debugSessionData();