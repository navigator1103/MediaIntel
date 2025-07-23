'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTarget, FiEdit, FiTrash2, FiRefreshCw, FiZap } from 'react-icons/fi';
import Link from 'next/link';

interface Campaign {
  id: number;
  name: string;
  range: string | null;
  rangeId: number | null;
  createdAt: string;
  updatedAt: string;
  gamePlansCount: number;
}

interface Range {
  id: number;
  name: string;
}

export default function CampaignsAdmin() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ranges, setRanges] = useState<Range[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCampaign, setNewCampaign] = useState({ 
    name: '', 
    rangeId: '' 
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Load campaigns and ranges
  useEffect(() => {
    fetchCampaigns();
    fetchRanges();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      } else {
        setError('Failed to load campaigns');
      }
    } catch (err) {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchRanges = async () => {
    try {
      const response = await fetch('/api/admin/ranges');
      if (response.ok) {
        const data = await response.json();
        setRanges(data);
      }
    } catch (err) {
      console.error('Failed to load ranges:', err);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCampaign.name.trim(),
          rangeId: newCampaign.rangeId ? parseInt(newCampaign.rangeId) : null
        }),
      });

      if (response.ok) {
        setNewCampaign({ name: '', rangeId: '' });
        fetchCampaigns();
        alert('Campaign created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create campaign: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;

    try {
      const response = await fetch(`/api/admin/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCampaign.name,
          rangeId: editingCampaign.rangeId
        }),
      });

      if (response.ok) {
        setEditingCampaign(null);
        fetchCampaigns();
        alert('Campaign updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update campaign: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to update campaign');
    }
  };

  const handleDeleteCampaign = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the campaign "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCampaigns();
        alert('Campaign deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete campaign: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to delete campaign');
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
        <h1 className="text-3xl font-bold text-gray-800">Campaigns Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={fetchCampaigns}
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

      {/* Create New Campaign */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Campaign</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              placeholder="e.g., Summer Launch 2024"
              className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isCreating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Range (Optional)
            </label>
            <select
              value={newCampaign.rangeId}
              onChange={(e) => setNewCampaign({ ...newCampaign, rangeId: e.target.value })}
              className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              disabled={isCreating}
            >
              <option value="">Select Range</option>
              {ranges.map(range => (
                <option key={range.id} value={range.id}>{range.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleCreateCampaign}
              disabled={isCreating}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <FiPlus className="mr-2" />
              {isCreating ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Existing Campaigns</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiTarget className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No campaigns found</p>
            <p className="text-sm">Create your first campaign above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game Plans
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
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCampaign?.id === campaign.id ? (
                        <input
                          type="text"
                          value={editingCampaign.name}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="flex items-center">
                          <FiZap className="mr-2 text-indigo-500" />
                          <span className="text-sm font-medium text-gray-900">{campaign.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingCampaign?.id === campaign.id ? (
                        <select
                          value={editingCampaign.rangeId || ''}
                          onChange={(e) => setEditingCampaign({ ...editingCampaign, rangeId: e.target.value ? parseInt(e.target.value) : null })}
                          className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">None</option>
                          {ranges.map(range => (
                            <option key={range.id} value={range.id}>{range.name}</option>
                          ))}
                        </select>
                      ) : (
                        campaign.range || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.gamePlansCount > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.gamePlansCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(campaign.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {editingCampaign?.id === campaign.id ? (
                          <>
                            <button
                              onClick={handleUpdateCampaign}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCampaign(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingCampaign(campaign)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <FiEdit className="mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                              className="text-red-600 hover:text-red-900 flex items-center"
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