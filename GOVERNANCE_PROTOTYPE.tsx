'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiGitMerge, FiEye, FiClock, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

// This is a PROTOTYPE to demonstrate the governance interface concept
// Not a working implementation - just for visualization

interface PendingEntity {
  id: number;
  name: string;
  type: 'campaign' | 'range';
  originalName: string;
  createdAt: string;
  createdBy: 'import_auto' | 'manual';
  usageCount: number;
  importSource: string;
  status: 'pending_review' | 'active' | 'archived' | 'merged';
  notes?: string;
}

// Mock data for demonstration
const mockPendingEntities: PendingEntity[] = [
  {
    id: 1,
    name: 'Summer Campaign 2024',
    type: 'campaign',
    originalName: 'Summer Campaign 2024',
    createdAt: '2024-07-03T10:30:00Z',
    createdBy: 'import_auto',
    usageCount: 15,
    importSource: 'singapore_gameplans_July2024.csv',
    status: 'pending_review',
    notes: 'Auto-created during Singapore import'
  },
  {
    id: 2,
    name: 'Anti-Aging Range',
    type: 'range',
    originalName: 'Anti-Aging Range',
    createdAt: '2024-07-03T10:31:00Z',
    createdBy: 'import_auto',
    usageCount: 8,
    importSource: 'singapore_gameplans_July2024.csv',
    status: 'pending_review'
  },
  {
    id: 3,
    name: 'Holiday Promo',
    type: 'campaign',
    originalName: 'Holiday Promo',
    createdAt: '2024-07-03T09:15:00Z',
    createdBy: 'import_auto',
    usageCount: 0,
    importSource: 'thailand_gameplans_July2024.csv',
    status: 'pending_review',
    notes: 'Potential duplicate of "Holiday Promotion 2024"'
  }
];

export default function GovernanceAdminPrototype() {
  const [pendingEntities, setPendingEntities] = useState<PendingEntity[]>(mockPendingEntities);
  const [selectedEntities, setSelectedEntities] = useState<number[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<PendingEntity | null>(null);

  const handleApprove = (id: number) => {
    setPendingEntities(prev => 
      prev.map(entity => 
        entity.id === id 
          ? { ...entity, status: 'active' as const }
          : entity
      )
    );
  };

  const handleArchive = (id: number) => {
    setPendingEntities(prev => 
      prev.map(entity => 
        entity.id === id 
          ? { ...entity, status: 'archived' as const }
          : entity
      )
    );
  };

  const handleMerge = (entity: PendingEntity) => {
    setSelectedForMerge(entity);
    setShowMergeDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const pendingCount = pendingEntities.filter(e => e.status === 'pending_review').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Entity Governance</h1>
          <p className="text-gray-600 mt-2">Review and manage auto-created campaigns and ranges</p>
        </div>
        <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
          <span className="font-semibold">{pendingCount}</span> entities pending review
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center">
            <FiCheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-green-600">7</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center">
            <FiGitMerge className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Merged Today</p>
              <p className="text-2xl font-bold text-blue-600">3</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <FiAlertTriangle className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">High Usage</p>
              <p className="text-2xl font-bold text-gray-600">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300" />
              <span className="ml-2 text-sm text-gray-700">Select All</span>
            </label>
            {selectedEntities.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedEntities.length} selected
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50">
              Bulk Approve
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50">
              Bulk Archive
            </button>
          </div>
        </div>
      </div>

      {/* Entities Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Entities</h3>
        </div>
        
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
                  Import Source
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
              {pendingEntities.filter(entity => entity.status === 'pending_review').map((entity) => (
                <tr key={entity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 mr-3" 
                        checked={selectedEntities.includes(entity.id)}
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
                    {entity.importSource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(entity.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(entity.id)}
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
                        onClick={() => handleArchive(entity.id)}
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
      </div>

      {/* Recently Processed */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recently Processed</h3>
        </div>
        <div className="p-6">
          <div className="text-sm text-gray-500">
            Entities processed in the last 24 hours will appear here...
          </div>
        </div>
      </div>

      {/* Merge Dialog (Modal) */}
      {showMergeDialog && selectedForMerge && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Merge "{selectedForMerge.name}"
            </h3>
            <p className="text-gray-600 mb-4">
              Search for an existing {selectedForMerge.type} to merge this into:
            </p>
            <input 
              type="text" 
              placeholder={`Search existing ${selectedForMerge.type}s...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowMergeDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}