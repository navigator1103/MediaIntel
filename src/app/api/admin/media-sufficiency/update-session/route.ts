import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to the sessions directory
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

// Helper function for logging with timestamp
function logWithTimestamp(message: string) {
  console.log(`[${new Date().toISOString()}] [update-session] ${message}`);
}

// Helper function for logging errors with timestamp
function logErrorWithTimestamp(message: string, error?: any) {
  console.error(`[${new Date().toISOString()}] [update-session] ERROR: ${message}`, error || '');
}

export async function POST(request: NextRequest) {
  logWithTimestamp('Update session API called');
  
  try {
    // Parse the request body
    const body = await request.json();
    const { sessionId, records } = body;
    
    if (!sessionId) {
      logErrorWithTimestamp('No session ID provided');
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }
    
    if (!records || !Array.isArray(records)) {
      logErrorWithTimestamp('Invalid records data provided');
      return NextResponse.json(
        { error: 'Invalid records data provided' },
        { status: 400 }
      );
    }
    
    // Check if session file exists
    const sessionFilePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    logWithTimestamp(`Looking for session file: ${sessionFilePath}`);
    
    if (!fs.existsSync(sessionFilePath)) {
      logErrorWithTimestamp(`Session file not found: ${sessionFilePath}`);
      return NextResponse.json(
        { error: 'Session file not found' },
        { status: 404 }
      );
    }
    
    // Read the session data from the file
    const sessionDataRaw = fs.readFileSync(sessionFilePath, 'utf8');
    const sessionData = JSON.parse(sessionDataRaw);
    
    // Update the records in the session data
    sessionData.records = records;
    
    // Write the updated session data back to the file
    fs.writeFileSync(sessionFilePath, JSON.stringify(sessionData));
    logWithTimestamp(`Updated session file with ${records.length} records`);
    
    return NextResponse.json({
      success: true,
      message: 'Session data updated successfully',
      recordCount: records.length
    });
    
  } catch (error) {
    logErrorWithTimestamp('Unexpected error during session update:', error);
    return NextResponse.json(
      { error: 'Unexpected error during session update', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
