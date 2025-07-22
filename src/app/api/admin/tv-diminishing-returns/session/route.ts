import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);

    if (!fs.existsSync(sessionFile)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));

    if (sessionData.type !== 'tv-diminishing-returns') {
      return NextResponse.json({ error: 'Invalid session type for TV Diminishing Returns' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      session: sessionData
    });

  } catch (error: any) {
    console.error('TV Diminishing Returns session error:', error);
    return NextResponse.json({
      error: 'Failed to load session',
      details: error.message
    }, { status: 500 });
  }
}