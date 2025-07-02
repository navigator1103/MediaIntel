'use client';

import React, { useState, useEffect } from 'react';
import { FiDownload, FiTrash2, FiInfo, FiRefreshCw, FiDatabase, FiCalendar, FiFile } from 'react-icons/fi';

interface BackupMetadata {
  filename: string;
  timestamp: string;
  countryName: string;
  lastUpdateName: string;
  recordCount: number;
  fileSize: string;
  created: string;
}

interface BackupDetails {
  filename: string;
  metadata: {
    timestamp: string;
    countryId: number;
    countryName: string;
    lastUpdateId: number;
    lastUpdateName: string;
    recordCount: number;
    backupFile: string;
  };
  fileInfo: {
    size: number;
    created: string;
    modified: string;
  };
  gamePlans: Array<{
    id: number;
    campaignName: string;
    mediaSubTypeName: string;
    startDate: string;
    endDate: string;
    totalBudget: number;
    q1Budget: number;
    q2Budget: number;
    q3Budget: number;
    q4Budget: number;
  }>;
  totalBudget: number;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/backups');
      
      if (!response.ok) {
        throw new Error('Failed to fetch backups');
      }
      
      const data = await response.json();
      setBackups(data.backups);
    } catch (err) {
      console.error('Error loading backups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (filename: string) => {
    try {
      setActionLoading(filename);
      
      const response = await fetch(`/api/admin/backups/details?filename=${encodeURIComponent(filename)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch backup details');
      }
      
      const data = await response.json();
      setSelectedBackup(data.details);
      setShowDetails(true);
    } catch (err) {
      console.error('Error loading backup details:', err);
      alert(err instanceof Error ? err.message : 'Failed to load backup details');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore this backup? This will replace current game plans for the same country and financial cycle.`)) {
      return;
    }

    try {
      setActionLoading(filename);
      
      const response = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to restore backup');
      }
      
      const data = await response.json();
      alert(`✅ Successfully restored ${data.details.restoredCount} game plans from backup!`);
      
    } catch (err) {
      console.error('Error restoring backup:', err);
      alert(`❌ ${err instanceof Error ? err.message : 'Failed to restore backup'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete this backup? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(filename);
      
      const response = await fetch(`/api/admin/backups?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete backup');
      }
      
      alert('✅ Backup deleted successfully');
      loadBackups(); // Refresh the list
      
    } catch (err) {
      console.error('Error deleting backup:', err);
      alert(`❌ ${err instanceof Error ? err.message : 'Failed to delete backup'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-6">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading backups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Plan Backups</h1>
              <p className="text-gray-600">Manage and restore game plan backups</p>
            </div>
            <button
              onClick={loadBackups}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <FiRefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Backups List */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Backups ({backups.length})</h3>
          </div>
          
          {backups.length === 0 ? (
            <div className="p-8 text-center">
              <FiDatabase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No backups found</p>
              <p className="text-sm text-gray-400 mt-1">Backups are created automatically before imports</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Backup Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country & Cycle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.filename} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiFile className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {backup.filename.replace(/^game-plans-backup-/, '').replace(/\.json$/, '')}
                            </div>
                            <div className="text-sm text-gray-500">{backup.fileSize}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{backup.countryName}</div>
                        <div className="text-sm text-gray-500">{backup.lastUpdateName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {backup.recordCount} game plans
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 mr-1" />
                          {formatDate(backup.created)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(backup.filename)}
                            disabled={actionLoading === backup.filename}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                            title="View Details"
                          >
                            <FiInfo className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRestore(backup.filename)}
                            disabled={actionLoading === backup.filename}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Restore Backup"
                          >
                            <FiDownload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(backup.filename)}
                            disabled={actionLoading === backup.filename}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete Backup"
                          >
                            <FiTrash2 className="h-4 w-4" />
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

        {/* Details Modal */}
        {showDetails && selectedBackup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Backup Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Backup Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-500">Country:</span> {selectedBackup.metadata.countryName}</div>
                      <div><span className="text-gray-500">Financial Cycle:</span> {selectedBackup.metadata.lastUpdateName}</div>
                      <div><span className="text-gray-500">Created:</span> {formatDate(selectedBackup.fileInfo.created)}</div>
                      <div><span className="text-gray-500">Records:</span> {selectedBackup.metadata.recordCount}</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Budget Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-500">Total Budget:</span> {formatCurrency(selectedBackup.totalBudget)}</div>
                      <div><span className="text-gray-500">File Size:</span> {(selectedBackup.fileInfo.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Game Plans Preview</h4>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Media</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedBackup.gamePlans.slice(0, 10).map((gp) => (
                          <tr key={gp.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{gp.campaignName}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{gp.mediaSubTypeName}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(gp.totalBudget || 0)}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(gp.startDate).toLocaleDateString()} - {new Date(gp.endDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedBackup.gamePlans.length > 10 && (
                      <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                        ... and {selectedBackup.gamePlans.length - 10} more game plans
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      handleRestore(selectedBackup.filename);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Restore This Backup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}