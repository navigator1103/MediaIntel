'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiX, FiGitMerge, FiEye, FiClock, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiSearch } from 'react-icons/fi';
import Link from 'next/link';

interface PendingEntity {
  id: number;
  name: string;
  type: 'campaign' | 'range';
  status: 'pending_review' | 'active' | 'archived' | 'merged';
  createdBy: string | null;
  createdAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  originalName?: string | null;
  notes?: string | null;
  usageCount: number;
  relatedRange?: string | null;
  relatedCategories?: string[];
  campaignsCount?: number;
  mergedInto?: number | null;
}

interface GovernanceStats {
  pendingCampaigns: number;
  pendingRanges: number;
  totalPending: number;
  highUsage: number;
  approvedToday: number;
  mergedToday: number;
}

interface SearchResult {
  id: number;
  name: string;
  status: string;
  usageCount: number;
  relatedRange?: string | null;
  relatedCategories?: string[];
  campaignsCount?: number;
  createdBy?: string | null;
}

export default function GovernanceAdmin() {
  const router = useRouter();
  const [entities, setEntities] = useState<PendingEntity[]>([]);
  const [stats, setStats] = useState<GovernanceStats>({
    pendingCampaigns: 0,
    pendingRanges: 0,
    totalPending: 0,
    highUsage: 0,
    approvedToday: 0,
    mergedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<number[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<PendingEntity | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMergeTarget, setSelectedMergeTarget] = useState<SearchResult | null>(null);

  // Load governance data
  useEffect(() => {
    fetchGovernanceData();
  }, []);

  const fetchGovernanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/governance');
      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities);
        setStats(data.stats);
      } else {
        setError('Failed to load governance data');
      }
    } catch (err) {
      setError('Failed to load governance data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number, type: 'campaign' | 'range') => {
    try {
      const response = await fetch('/api/admin/governance/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          entityType: type,
          entityId: id,
          reviewedBy: 'admin', // In a real app, get from session
          notes: 'Approved via governance interface'
        })
      });

      if (response.ok) {
        await fetchGovernanceData();
        alert(`${type} approved successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed to approve ${type}: ${error.error}`);
      }
    } catch (err) {
      alert(`Failed to approve ${type}`);
    }
  };

  const handleArchive = async (id: number, type: 'campaign' | 'range') => {
    if (!confirm(`Are you sure you want to archive this ${type}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/governance/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive',
          entityType: type,
          entityId: id,
          reviewedBy: 'admin',
          notes: 'Archived via governance interface'
        })
      });

      if (response.ok) {
        await fetchGovernanceData();
        alert(`${type} archived successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed to archive ${type}: ${error.error}`);
      }
    } catch (err) {
      alert(`Failed to archive ${type}`);
    }
  };

  const handleMerge = (entity: PendingEntity) => {
    setSelectedForMerge(entity);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMergeTarget(null);
    setShowMergeDialog(true);
  };

  const searchEntities = async (query: string) => {
    if (!query.trim() || !selectedForMerge) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/governance/search?entityType=${selectedForMerge.type}&query=${encodeURIComponent(query)}&excludeId=${selectedForMerge.id}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const confirmMerge = async () => {
    if (!selectedForMerge || !selectedMergeTarget) {
      alert('Please select a target to merge into');
      return;
    }

    try {
      const response = await fetch('/api/admin/governance/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'merge',
          entityType: selectedForMerge.type,
          entityId: selectedForMerge.id,
          mergeIntoId: selectedMergeTarget.id,
          reviewedBy: 'admin',
          notes: `Merged "${selectedForMerge.name}" into "${selectedMergeTarget.name}"`
        })
      });

      if (response.ok) {
        await fetchGovernanceData();
        setShowMergeDialog(false);
        alert(`${selectedForMerge.type} merged successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed to merge ${selectedForMerge.type}: ${error.error}`);
      }
    } catch (err) {
      alert(`Failed to merge ${selectedForMerge.type}`);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedEntities.length === 0) return;

    try {
      const response = await fetch('/api/admin/governance/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          entityType: 'campaign', // We'll need to handle mixed types differently
          entityIds: selectedEntities,
          reviewedBy: 'admin',
          notes: 'Bulk approved via governance interface'
        })
      });

      if (response.ok) {
        await fetchGovernanceData();
        setSelectedEntities([]);
        alert('Entities approved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to bulk approve: ${error.error}`);
      }
    } catch (err) {
      alert('Failed to bulk approve');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const pendingEntities = entities; // Show all entities returned by API (includes auto-imported)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg">Loading governance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Entity Governance</h1>
          <p className="text-gray-600 mt-2">Review and manage auto-created campaigns and ranges</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={fetchGovernanceData}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            <FiRefreshCw className="mr-2" />
            Refresh
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{stats.totalPending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center">
            <FiCheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedToday}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center">
            <FiGitMerge className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Merged Today</p>
              <p className="text-2xl font-bold text-blue-600">{stats.mergedToday}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <FiAlertTriangle className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">High Usage</p>
              <p className="text-2xl font-bold text-gray-600">{stats.highUsage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {pendingEntities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300"
                  checked={selectedEntities.length === pendingEntities.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedEntities(pendingEntities.map(entity => entity.id));
                    } else {
                      setSelectedEntities([]);
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">Select All</span>
              </label>
              {selectedEntities.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedEntities.length} selected
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={handleBulkApprove}
                disabled={selectedEntities.length === 0}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Bulk Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entities Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Entities ({stats.totalPending})
          </h3>
        </div>
        
        {pendingEntities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No entities pending review</p>
            <p className="text-sm">All auto-created entities have been processed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage Count
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
                {pendingEntities.map((entity) => (
                  <tr key={`${entity.type}-${entity.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 mr-3"
                          checked={selectedEntities.includes(entity.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntities([...selectedEntities, entity.id]);
                            } else {
                              setSelectedEntities(selectedEntities.filter(id => id !== entity.id));
                            }
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                          {entity.notes && (
                            <div className="text-xs text-gray-500">{entity.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entity.type === 'campaign' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {entity.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entity.usageCount > 10 
                          ? 'bg-red-100 text-red-800' 
                          : entity.usageCount > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entity.usageCount} game plans
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entity.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(entity.id, entity.type)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Approve"
                        >
                          <FiCheck className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleMerge(entity)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Merge"
                        >
                          <FiGitMerge className="mr-1" />
                          Merge
                        </button>
                        <button
                          onClick={() => handleArchive(entity.id, entity.type)}
                          className="text-gray-600 hover:text-gray-900 flex items-center"
                          title="Archive"
                        >
                          <FiX className="mr-1" />
                          Archive
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

      {/* Merge Dialog */}
      {showMergeDialog && selectedForMerge && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Merge "{selectedForMerge.name}"
            </h3>
            <p className="text-gray-600 mb-4">
              Search for an existing {selectedForMerge.type} to merge this into:
            </p>
            
            <div className="relative mb-4">
              <input 
                type="text" 
                placeholder={`Search existing ${selectedForMerge.type}s...`}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 2) {
                    searchEntities(e.target.value);
                  } else {
                    setSearchResults([]);
                  }
                }}
              />
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
            </div>

            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mb-4 max-h-60 overflow-y-auto border border-gray-200 rounded">
                {searchResults.map((result) => (
                  <div 
                    key={result.id}
                    className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedMergeTarget?.id === result.id ? 'bg-indigo-50 border-indigo-200' : ''
                    }`}
                    onClick={() => setSelectedMergeTarget(result)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-gray-500">
                          {result.usageCount} game plans • {result.status}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        result.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowMergeDialog(false);
                  setSelectedForMerge(null);
                  setSelectedMergeTarget(null);
                  setSearchResults([]);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmMerge}
                disabled={!selectedMergeTarget}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Merge into "{selectedMergeTarget?.name || 'selected entity'}"
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}