import { NextRequest, NextResponse } from 'next/server';
import { listGamePlanBackups } from '@/lib/utils/backupUtils';
import fs from 'fs';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups', 'game-plans');

interface BackupMetadata {
  filename: string;
  timestamp: string;
  countryName: string;
  lastUpdateName: string;
  recordCount: number;
  fileSize: string;
  created: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function GET() {
  try {
    console.log('Fetching backup list...');
    
    const backupFiles = await listGamePlanBackups();
    const backups: BackupMetadata[] = [];

    for (const filename of backupFiles) {
      try {
        const filePath = path.join(BACKUPS_DIR, filename);
        const stats = fs.statSync(filePath);
        
        // Read backup metadata
        const backupContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        backups.push({
          filename,
          timestamp: backupContent.timestamp,
          countryName: backupContent.countryName,
          lastUpdateName: backupContent.lastUpdateName,
          recordCount: backupContent.recordCount,
          fileSize: formatFileSize(stats.size),
          created: stats.birthtime.toISOString()
        });
      } catch (error) {
        console.error(`Error reading backup file ${filename}:`, error);
        // Skip corrupted files
      }
    }

    // Sort by creation time (newest first)
    backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    console.log(`Found ${backups.length} backup files`);
    
    return NextResponse.json({
      success: true,
      backups
    });
    
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backups', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(BACKUPS_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    console.log(`Deleted backup file: ${filename}`);
    
    return NextResponse.json({
      success: true,
      message: `Backup ${filename} deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}