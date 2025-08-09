'use client';

import { useState, useEffect } from 'react';
import { FiDatabase, FiRefreshCw, FiCheck, FiX, FiClock, FiDownloadCloud } from 'react-icons/fi';

interface SyncStatus {
  enabled: boolean;
  inProgress: boolean;
  lastSync: any;
  history: any[];
}

export default function DatabaseSyncPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSyncStatus();
    // Poll for status every 5 seconds if sync is in progress
    const interval = setInterval(() => {
      if (syncing) {
        fetchSyncStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [syncing]);

  const fetchSyncStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/database-sync', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const data = await response.json();
      setSyncStatus(data);
      setSyncing(data.inProgress);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    if (syncing) return;

    try {
      setSyncing(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/database-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start sync');
      }

      // Start polling for status
      setTimeout(fetchSyncStatus, 1000);
    } catch (err: any) {
      setError(err.message);
      setSyncing(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FiDatabase className="text-blue-600" />
          Database Synchronization (Production → Local)
        </h1>
        <p className="text-gray-600 mt-2">
          <strong>One-way sync:</strong> Pull production data into your local database from Google Cloud Storage
        </p>
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <FiDownloadCloud className="text-yellow-600" />
            <strong>Important:</strong> This only downloads data FROM production TO local. Your local changes are never pushed to production.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 flex items-center gap-2">
            <FiX className="text-red-600" />
            {error}
          </p>
        </div>
      )}

      {/* Sync Control Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sync Control</h2>
            <p className="text-sm text-gray-600">
              Status: {syncStatus?.enabled ? 'Enabled' : 'Disabled'} | 
              Mode: {process.env.NEXT_PUBLIC_DB_SYNC_MODE || 'Manual'}
            </p>
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing || !syncStatus?.enabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              syncing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {syncing ? (
              <>
                <FiRefreshCw className="animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <FiDownloadCloud />
                Pull from Production
              </>
            )}
          </button>
        </div>

        {/* Last Sync Info */}
        {syncStatus?.lastSync && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Sync</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  {syncStatus.lastSync.success ? (
                    <><FiCheck className="text-green-500" /> Success</>
                  ) : (
                    <><FiX className="text-red-500" /> Failed</>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium">{formatDate(syncStatus.lastSync.timestamp)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium">{formatDuration(syncStatus.lastSync.duration)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Records Synced</p>
                <p className="text-sm font-medium">{syncStatus.lastSync.totalRecords}</p>
              </div>
            </div>

            {/* Table Sync Details */}
            {syncStatus.lastSync.tablesSync && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Table Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(syncStatus.lastSync.tablesSync).map(([table, stats]: [string, any]) => (
                    <div key={table} className="bg-gray-50 rounded p-2">
                      <p className="text-xs font-medium text-gray-700">{table}</p>
                      <p className="text-xs text-gray-600">
                        +{stats.added} / ↑{stats.updated} / →{stats.skipped}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync History</h2>
        
        {syncStatus?.history && syncStatus.history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Records
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Tables
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {syncStatus.history.map((sync, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {sync.success ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <FiCheck /> Success
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <FiX /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(sync.timestamp)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(sync.duration)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {sync.totalRecords}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {Object.keys(sync.tablesSync || {}).length} tables
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No sync history available</p>
        )}
      </div>

      {/* Configuration Info */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Configuration</h3>
        <div className="text-xs text-blue-800 space-y-1">
          <p>• Source: Google Cloud Storage</p>
          <p>• Path: gs://goldenrulesnextjs-db/golden_rules.db</p>
          <p>• Mode: {syncStatus?.enabled ? 'Enabled' : 'Disabled'}</p>
          <p>• Tables: users, campaigns, game_plans, media_sufficiency, share_of_voice, diminishing_returns</p>
        </div>
      </div>
    </div>
  );
}