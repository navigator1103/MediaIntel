import { NextRequest, NextResponse } from 'next/server';
import { createDatabaseBackup, listBackups } from '../../../../lib/backup/backupDatabase';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// Super admin authentication check
async function checkSuperAdminAuth(request: NextRequest): Promise<boolean> {
  try {
    // Check for authorization header with Bearer token
    const authHeader = request.headers.get('authorization');
    
    // For session-based auth, check cookies
    const cookieHeader = request.headers.get('cookie');
    
    // Try to get user data from session storage (for demo accounts)
    // In production, you'd validate JWT tokens or session cookies
    
    // For now, check for demo super admin token in authorization header
    if (authHeader?.includes('demo-super-admin-token')) {
      return true;
    }
    
    // Check JWT token if present
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-here') as any;
        return decoded.role === 'super_admin';
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        return false;
      }
    }
    
    // For demo purposes, allow if the request comes from admin context
    // In production, implement proper session validation
    const referer = request.headers.get('referer');
    if (referer?.includes('/admin/database-backups')) {
      // Additional validation would be needed here
      // For now, we assume the admin layout has already validated the user
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Super admin auth check failed:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check super admin authorization
    const isAuthorized = await checkSuperAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const fileName = searchParams.get('file');

    if (action === 'download' && fileName) {
      // Download specific backup file
      const backupDir = path.join(process.cwd(), 'backups');
      const filePath = path.join(backupDir, fileName);

      // Security check - ensure file is in backup directory and has correct naming
      if (!filePath.startsWith(backupDir) || !fileName.startsWith('golden_rules_backup_') || !fileName.endsWith('.db')) {
        return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
      }

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } else {
      // List all database backups
      const backups = await listBackups();
      
      return NextResponse.json({
        success: true,
        backups: backups.map(backup => ({
          name: backup.name,
          size: backup.size,
          date: backup.date.toISOString(),
          sizeFormatted: formatFileSize(backup.size),
          downloadUrl: `/api/admin/database-backups?action=download&file=${encodeURIComponent(backup.name)}`
        }))
      });
    }
  } catch (error: any) {
    console.error('Database backup API error:', error);
    return NextResponse.json({
      error: 'Failed to process backup request',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check super admin authorization
    const isAuthorized = await checkSuperAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === 'create') {
      // Create new backup
      const result = await createDatabaseBackup();
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Database backup created successfully',
          filePath: result.filePath,
          fileName: path.basename(result.filePath || '')
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Database backup creation error:', error);
    return NextResponse.json({
      error: 'Failed to create backup',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check super admin authorization
    const isAuthorized = await checkSuperAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    
    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    // Security check - ensure filename doesn't contain path traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Additional security check for backup file naming
    if (!fileName.startsWith('golden_rules_backup_') || !fileName.endsWith('.db')) {
      return NextResponse.json({ error: 'Invalid backup file name' }, { status: 400 });
    }

    const backupDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    fs.unlinkSync(filePath);
    console.log(`Deleted database backup: ${fileName}`);
    
    return NextResponse.json({
      success: true,
      message: `Database backup ${fileName} deleted successfully`
    });
    
  } catch (error: any) {
    console.error('Error deleting database backup:', error);
    return NextResponse.json({
      error: 'Failed to delete backup',
      details: error.message
    }, { status: 500 });
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}