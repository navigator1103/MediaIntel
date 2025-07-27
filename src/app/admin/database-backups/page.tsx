'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw, FiDatabase, FiTrash2, FiAlertCircle, FiCheckCircle, FiClock, FiHardDrive, FiPlay, FiPause } from 'react-icons/fi';

interface DatabaseBackup {
  name: string;
  size: number;
  sizeFormatted: string;
  date: string;
  downloadUrl: string;
}

interface SchedulerStatus {
  lastBackupTime: string;
  lastBackupResult: 'success' | 'failed' | null;
  nextScheduledTime: string;
  isEnabled: boolean;
  totalBackups: number;
  timeUntilNextBackup: number;
  nextBackupFormatted: string;
  lastBackupFormatted: string;
}

export default function DatabaseBackupsPage() {
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [schedulerLoading, setSchedulerLoading] = useState(false);

  useEffect(() => {
    loadBackups();
    loadSchedulerStatus();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user token for authentication
      const token = localStorage.getItem('token') || 'demo-super-admin-token';
      
      const response = await fetch('/api/admin/database-backups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied: Super admin privileges required');
        }
        throw new Error(`Failed to load backups: ${response.status}`);
      }
      
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Error loading backups:', error);
      setError(error instanceof Error ? error.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      
      // Get user token for authentication
      const token = localStorage.getItem('token') || 'demo-super-admin-token';
      
      const response = await fetch('/api/admin/database-backups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Backup created successfully: ${data.fileName}`);
        loadBackups(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setError(error instanceof Error ? error.message : 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const deleteBackup = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete backup "${fileName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setError(null);
      
      // Get user token for authentication
      const token = localStorage.getItem('token') || 'demo-super-admin-token';
      
      const response = await fetch(`/api/admin/database-backups?file=${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Backup "${fileName}" deleted successfully`);
        loadBackups(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete backup');
    }
  };

  const downloadBackup = (downloadUrl: string, fileName: string) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const loadSchedulerStatus = async () => {
    try {
      const response = await fetch('/api/admin/backup-scheduler?action=status');
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading scheduler status:', error);
    }
  };

  const toggleScheduler = async () => {
    if (!schedulerStatus) return;
    
    try {
      setSchedulerLoading(true);
      const action = schedulerStatus.isEnabled ? 'disable' : 'enable';
      
      const response = await fetch('/api/admin/backup-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        await loadSchedulerStatus();
        setSuccess(`Scheduler ${action}d successfully`);
      } else {
        throw new Error(`Failed to ${action} scheduler`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to toggle scheduler');
    } finally {
      setSchedulerLoading(false);
    }
  };

  const triggerManualBackup = async () => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/admin/backup-scheduler?action=trigger');
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        loadBackups();
        loadSchedulerStatus();
      } else {
        throw new Error(data.error || 'Failed to trigger backup');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to trigger backup');
    } finally {
      setCreating(false);
    }
  };

  const formatTimeUntil = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiDatabase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Database Backups</h1>
              <p className="text-gray-600">Manage automatic database backups (Super Admin Only)</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => { clearMessages(); loadBackups(); }}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <FiRefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={triggerManualBackup}
              disabled={creating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </>
              ) : (
                <>
                  <FiDatabase className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={clearMessages}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <FiCheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
            <button
              onClick={clearMessages}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Backup Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <FiAlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Backup Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Backups are automatically created daily and retained for 30 days</li>
                <li>Manual backups can be created anytime using the "Create Backup" button</li>
                <li>Each backup contains the complete database including all tables and data</li>
                <li>Download backups to store them externally for additional safety</li>
                <li>This feature is only accessible to Super Administrators</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduler Status */}
      {schedulerStatus && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${schedulerStatus.isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <FiClock className={`h-6 w-6 ${schedulerStatus.isEnabled ? 'text-green-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">Automatic Backup Scheduler</h2>
                <p className={`text-sm ${schedulerStatus.isEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {schedulerStatus.isEnabled ? 'Active - Daily backups at 2:00 AM' : 'Disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleScheduler}
              disabled={schedulerLoading}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                schedulerStatus.isEnabled
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } disabled:opacity-50`}
            >
              {schedulerLoading ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
              ) : schedulerStatus.isEnabled ? (
                <FiPause className="h-4 w-4 mr-2" />
              ) : (
                <FiPlay className="h-4 w-4 mr-2" />
              )}
              {schedulerStatus.isEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500">Next Backup</div>
              <div className="text-lg font-semibold text-gray-900">{schedulerStatus.nextBackupFormatted}</div>
              {schedulerStatus.isEnabled && (
                <div className="text-sm text-gray-600">
                  in {formatTimeUntil(schedulerStatus.timeUntilNextBackup)}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500">Last Backup</div>
              <div className="text-lg font-semibold text-gray-900">{schedulerStatus.lastBackupFormatted}</div>
              {schedulerStatus.lastBackupResult && (
                <div className={`text-sm ${
                  schedulerStatus.lastBackupResult === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {schedulerStatus.lastBackupResult === 'success' ? '✅ Success' : '❌ Failed'}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500">Total Backups</div>
              <div className="text-lg font-semibold text-gray-900">{schedulerStatus.totalBackups}</div>
              <div className="text-sm text-gray-600">automatic backups created</div>
            </div>
          </div>
        </div>
      )}

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Available Backups</h2>
          <p className="text-sm text-gray-600 mt-1">
            {backups.length} backup{backups.length !== 1 ? 's' : ''} available
          </p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Loading backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-12">
            <FiDatabase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No backups available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first backup by clicking the "Create Backup" button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiDatabase className="h-4 w-4 mr-2" />
                      Backup File
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiHardDrive className="h-4 w-4 mr-2" />
                      Size
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FiClock className="h-4 w-4 mr-2" />
                      Created
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{backup.sizeFormatted}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(backup.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => downloadBackup(backup.downloadUrl, backup.name)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <FiDownload className="h-4 w-4 mr-1" />
                          Download
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.name)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          <FiTrash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}