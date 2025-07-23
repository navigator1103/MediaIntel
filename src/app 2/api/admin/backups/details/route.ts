import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups', 'game-plans');

export async function GET(request: NextRequest) {
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

    // Read and parse backup file
    const backupContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Create summary of game plans
    const gamePlansSummary = backupContent.gamePlans.map((gp: any) => ({
      id: gp.id,
      campaignName: gp.campaign?.name || 'Unknown',
      mediaSubTypeName: gp.mediaSubType?.name || 'Unknown',
      startDate: gp.startDate,
      endDate: gp.endDate,
      totalBudget: gp.totalBudget,
      q1Budget: gp.q1Budget,
      q2Budget: gp.q2Budget,
      q3Budget: gp.q3Budget,
      q4Budget: gp.q4Budget
    }));

    const details = {
      filename,
      metadata: {
        timestamp: backupContent.timestamp,
        countryId: backupContent.countryId,
        countryName: backupContent.countryName,
        lastUpdateId: backupContent.lastUpdateId,
        lastUpdateName: backupContent.lastUpdateName,
        recordCount: backupContent.recordCount,
        backupFile: backupContent.backupFile
      },
      fileInfo: {
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString()
      },
      gamePlans: gamePlansSummary,
      totalBudget: gamePlansSummary.reduce((sum, gp) => sum + (gp.totalBudget || 0), 0)
    };
    
    return NextResponse.json({
      success: true,
      details
    });
    
  } catch (error) {
    console.error('Error getting backup details:', error);
    return NextResponse.json(
      { error: 'Failed to get backup details', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}