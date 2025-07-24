import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/utils/sessionManager';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting session cleanup...');
    
    // Run cleanup
    const results = await SessionManager.cleanupExpiredSessions();
    
    // Get updated stats
    const stats = await SessionManager.getSessionStats();
    const config = SessionManager.getSessionConfig();
    
    return NextResponse.json({
      success: true,
      message: 'Session cleanup completed',
      results: {
        removedSessions: results.removed,
        errors: results.errors,
        currentStats: stats,
        configuration: config
      }
    });
  } catch (error) {
    console.error('Session cleanup failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Session cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session statistics
    const stats = await SessionManager.getSessionStats();
    const config = SessionManager.getSessionConfig();
    
    return NextResponse.json({
      success: true,
      stats,
      config,
      message: `Total sessions: ${stats.total}, Active: ${stats.active}, Expired: ${stats.expired}, Legacy: ${stats.legacy}`
    });
  } catch (error) {
    console.error('Failed to get session stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get session statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}