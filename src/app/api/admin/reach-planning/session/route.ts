import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const SESSION_PREFIX = 'reach-planning-';

export async function GET(request: NextRequest) {
  console.log('GET request received at /api/admin/reach-planning/session');
  
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Validate session ID format
    if (!sessionId.startsWith(SESSION_PREFIX)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }
    
    console.log(`Retrieving session: ${sessionId}`);
    
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    
    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    
    console.log(`Session retrieved: ${sessionId}, ${sessionData.totalRecords} records`);
    
    return NextResponse.json({
      success: true,
      session: sessionData
    });
    
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve session',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  console.log('DELETE request received at /api/admin/reach-planning/session');
  
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Validate session ID format
    if (!sessionId.startsWith(SESSION_PREFIX)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }
    
    console.log(`Deleting session: ${sessionId}`);
    
    const sessionFile = path.join(SESSIONS_DIR, `${sessionId}.json`);
    const markerFile = path.join(SESSIONS_DIR, `${sessionId}-marker`);
    
    // Delete session files if they exist
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
    }
    
    if (fs.existsSync(markerFile)) {
      fs.unlinkSync(markerFile);
    }
    
    console.log(`Session deleted: ${sessionId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Session deletion error:', error);
    return NextResponse.json({
      error: 'Failed to delete session',
      details: error.message
    }, { status: 500 });
  }
}