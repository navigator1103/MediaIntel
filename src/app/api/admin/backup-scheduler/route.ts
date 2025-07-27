import { NextRequest, NextResponse } from 'next/server';
import { BackupScheduler } from '../../../../lib/scheduler/backupScheduler';

// Get scheduler status or trigger manual backup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const scheduler = BackupScheduler.getInstance();

    if (action === 'status') {
      const status = scheduler.getStatus();
      return NextResponse.json({
        success: true,
        status
      });
    }

    if (action === 'trigger') {
      const result = await scheduler.triggerManualBackup();
      return NextResponse.json({
        success: result.success,
        message: result.success ? 
          `Manual backup completed: ${result.fileName}` : 
          `Manual backup failed: ${result.error}`,
        fileName: result.fileName,
        error: result.error
      });
    }

    // Default: return status
    const status = scheduler.getStatus();
    return NextResponse.json({
      success: true,
      status
    });

  } catch (error: any) {
    console.error('Backup scheduler API error:', error);
    return NextResponse.json({
      error: 'Failed to process scheduler request',
      details: error.message
    }, { status: 500 });
  }
}

// Enable/disable scheduler
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const scheduler = BackupScheduler.getInstance();

    if (action === 'enable') {
      scheduler.enableScheduler();
      return NextResponse.json({
        success: true,
        message: 'Backup scheduler enabled'
      });
    }

    if (action === 'disable') {
      scheduler.disableScheduler();
      return NextResponse.json({
        success: true,
        message: 'Backup scheduler disabled'
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Use "enable" or "disable"' 
    }, { status: 400 });

  } catch (error: any) {
    console.error('Backup scheduler control error:', error);
    return NextResponse.json({
      error: 'Failed to control scheduler',
      details: error.message
    }, { status: 500 });
  }
}