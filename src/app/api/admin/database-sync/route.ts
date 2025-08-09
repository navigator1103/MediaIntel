import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseSyncService } from '@/lib/database-sync';
import { getUserFromToken } from '@/lib/getUserFromToken';

// GET /api/admin/database-sync - Get sync status and history
export async function GET(request: NextRequest) {
  try {
    // Check authentication and super admin role
    const user = getUserFromToken(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Super Admin access required' },
        { status: 401 }
      );
    }

    const syncService = getDatabaseSyncService();
    
    const response = {
      enabled: syncService.isEnabled(),
      inProgress: syncService.isSyncInProgress(),
      lastSync: syncService.getLastSyncInfo(),
      history: syncService.getSyncHistory(10)
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status', message: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/database-sync - Trigger manual sync
export async function POST(request: NextRequest) {
  try {
    // Check authentication and super admin role
    const user = getUserFromToken(request);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Super Admin access required' },
        { status: 401 }
      );
    }

    const syncService = getDatabaseSyncService();
    
    // Check if sync is already in progress
    if (syncService.isSyncInProgress()) {
      return NextResponse.json(
        { error: 'Sync already in progress', message: 'Please wait for the current sync to complete' },
        { status: 409 }
      );
    }

    // Start sync in background
    const syncPromise = syncService.performSync();
    
    // Return immediately with accepted status
    return NextResponse.json(
      { 
        message: 'Sync started', 
        status: 'in_progress',
        timestamp: new Date().toISOString()
      },
      { status: 202 }
    );

  } catch (error: any) {
    console.error('Error starting sync:', error);
    return NextResponse.json(
      { error: 'Failed to start sync', message: error.message },
      { status: 500 }
    );
  }
}