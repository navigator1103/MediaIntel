'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTarget, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';

interface CampaignArchetype {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  gamePlansCount?: number;
}

export default function CampaignArchetypesAdmin() {
  const router = useRouter();
  const [archetypes, setArchetypes] = useState<CampaignArchetype[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newArchetype, setNewArchetype] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingArchetype, setEditingArchetype] = useState<CampaignArchetype | null>(null);

  useEffect(() => {
    fetchArchetypes();
  }, []);

  const fetchArchetypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/campaign-archetypes');
      if (response.ok) {
        const data = await response.json();
        setArchetypes(data);
      } else {
        setError('Failed to load campaign archetypes');
      }
    } catch (err) {
      setError('Failed to load campaign archetypes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArchetype = async () => {
    if (!newArchetype.trim()) {
      alert('Please enter a campaign archetype name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/campaign-archetypes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newArchetype.trim()
        }),
      });

      if (response.ok) {
        setNewArchetype('');
        fetchArchetypes();
        alert('Campaign archetype created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create campaign archetype: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to create campaign archetype');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateArchetype = async () => {
    if (!editingArchetype) return;

    try {
      const response = await fetch(`/api/admin/campaign-archetypes/${editingArchetype.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingArchetype.name
        }),
      });

      if (response.ok) {
        setEditingArchetype(null);
        fetchArchetypes();
        alert('Campaign archetype updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update campaign archetype: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to update campaign archetype');
    }
  };

  const handleDeleteArchetype = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the campaign archetype "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/campaign-archetypes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchArchetypes();
        alert('Campaign archetype deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete campaign archetype: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to delete campaign archetype');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Campaign Archetypes Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={fetchArchetypes}
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

      {/* Create New Campaign Archetype */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Campaign Archetype</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Archetype Name *
            </label>
            <input
              type="text"
              value={newArchetype}
              onChange={(e) => setNewArchetype(e.target.value)}
              placeholder="e.g., Always On, Seasonal, Product Launch"
              className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isCreating}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleCreateArchetype}
              disabled={isCreating}
              className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <FiPlus className="mr-2" />
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {/* Campaign Archetypes List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Existing Campaign Archetypes</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : archetypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiTarget className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No campaign archetypes found</p>
            <p className="text-sm">Create your first campaign archetype above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Archetype
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game Plans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {archetypes.map((archetype) => (
                  <tr key={archetype.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingArchetype?.id === archetype.id ? (
                        <input
                          type="text"
                          value={editingArchetype.name}
                          onChange={(e) => setEditingArchetype({ ...editingArchetype, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded w-full"
                        />
                      ) : (
                        <div className="flex items-center">
                          <FiTarget className="mr-2 text-indigo-500" />
                          <span className="text-sm font-medium text-gray-900">{archetype.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (archetype.gamePlansCount || 0) > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {archetype.gamePlansCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(archetype.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(archetype.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {editingArchetype?.id === archetype.id ? (
                          <>
                            <button
                              onClick={handleUpdateArchetype}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingArchetype(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingArchetype(archetype)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <FiEdit className="mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteArchetype(archetype.id, archetype.name)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                              disabled={(archetype.gamePlansCount || 0) > 0}
                              title={(archetype.gamePlansCount || 0) > 0 ? 'Cannot delete: This archetype is used in game plans' : ''}
                            >
                              <FiTrash2 className="mr-1" />
                              Delete
                            </button>
                          </>
                        )}
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