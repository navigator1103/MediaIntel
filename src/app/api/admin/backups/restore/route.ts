import { NextRequest, NextResponse } from 'next/server';
import { restoreGamePlanBackup } from '@/lib/utils/backupUtils';
import fs from 'fs';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups', 'game-plans');

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json();
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const backupFilePath = path.join(BACKUPS_DIR, filename);
    
    if (!fs.existsSync(backupFilePath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    console.log(`Starting restore from backup: ${filename}`);
    
    // Read backup metadata first
    const backupContent = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    console.log(`Restoring ${backupContent.recordCount} game plans for ${backupContent.countryName} - ${backupContent.lastUpdateName}`);
    
    const restoredCount = await restoreGamePlanBackup(backupFilePath);
    
    return NextResponse.json({
      success: true,
      message: `Successfully restored ${restoredCount} game plans from backup`,
      details: {
        filename,
        restoredCount,
        country: backupContent.countryName,
        lastUpdate: backupContent.lastUpdateName,
        originalCount: backupContent.recordCount
      }
    });
    
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}