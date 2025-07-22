import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'sov-';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    if (!sessionId.startsWith(SESSION_PREFIX)) {
      return NextResponse.json({ error: 'Invalid SOV session ID' }, { status: 400 });
    }
    
    // Load session data
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    
    // Load full records if available
    const allRecordsFile = path.join(SESSIONS_DIR, `${sessionId}-full-records.json`);
    if (fs.existsSync(allRecordsFile)) {
      const fullData = JSON.parse(fs.readFileSync(allRecordsFile, 'utf8'));
      sessionData.records = fullData.records || sessionData.records;
    }
    
    return NextResponse.json({
      success: true,
      session: sessionData
    });
    
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve session data',
      details: error.message
    }, { status: 500 });
  }
}