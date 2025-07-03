'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiGlobe, FiEdit, FiTrash2, FiRefreshCw, FiMapPin } from 'react-icons/fi';
import Link from 'next/link';

interface Country {
  id: number;
  name: string;
  region: string | null;
  regionId: number | null;
  subRegion: string | null;
  subRegionId: number | null;
  cluster: string | null;
  clusterId: number | null;
  createdAt: string;
  updatedAt: string;
  gamePlansCount?: number;
}

interface RegionData {
  regions: Array<{ id: number; name: string }>;
  subRegions: Array<{ id: number; name: string }>;
  clusters: Array<{ id: number; name: string }>;
}

export default function CountriesAdmin() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [regionData, setRegionData] = useState<RegionData>({ regions: [], subRegions: [], clusters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCountry, setNewCountry] = useState({
    name: '',
    regionId: '',
    subRegionId: '',
    clusterId: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);

  // Load countries and region data
  useEffect(() => {
    fetchCountries();
    fetchRegionData();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/countries');
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      } else {
        setError('Failed to load countries');
      }
    } catch (err) {
      setError('Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegionData = async () => {
    try {
      const response = await fetch('/api/admin/regions');
      if (response.ok) {
        const data = await response.json();
        setRegionData(data);
      }
    } catch (err) {
      console.error('Failed to load region data:', err);
    }
  };

  const handleCreateCountry = async () => {
    if (!newCountry.name.trim()) {
      alert('Please enter a country name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/countries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCountry.name.trim(),
          regionId: newCountry.regionId ? parseInt(newCountry.regionId) : null,
          subRegionId: newCountry.subRegionId ? parseInt(newCountry.subRegionId) : null,
          clusterId: newCountry.clusterId ? parseInt(newCountry.clusterId) : null
        }),
      });

      if (response.ok) {
        setNewCountry({ name: '', regionId: '', subRegionId: '', clusterId: '' });
        fetchCountries();
        alert('Country created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create country: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to create country');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCountry = async () => {
    if (!editingCountry) return;

    try {
      const response = await fetch(`/api/admin/countries/${editingCountry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCountry.name,
          regionId: editingCountry.regionId,
          subRegionId: editingCountry.subRegionId,
          clusterId: editingCountry.clusterId
        }),
      });

      if (response.ok) {
        setEditingCountry(null);
        fetchCountries();
        alert('Country updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update country: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to update country');
    }
  };

  const handleDeleteCountry = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the country "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/countries/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCountries();
        alert('Country deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete country: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to delete country');
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
        <h1 className="text-3xl font-bold text-gray-800">Countries Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={fetchCountries}
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

      {/* Create New Country */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Country</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country Name *
            </label>
            <input
              type="text"
              value={newCountry.name}
              onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
              placeholder="e.g., Singapore"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isCreating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              value={newCountry.regionId}
              onChange={(e) => setNewCountry({ ...newCountry, regionId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isCreating}
            >
              <option value="">Select Region</option>
              {regionData.regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub Region
            </label>
            <select
              value={newCountry.subRegionId}
              onChange={(e) => setNewCountry({ ...newCountry, subRegionId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isCreating}
            >
              <option value="">Select Sub Region</option>
              {regionData.subRegions.map(subRegion => (
                <option key={subRegion.id} value={subRegion.id}>{subRegion.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cluster
            </label>
            <select
              value={newCountry.clusterId}
              onChange={(e) => setNewCountry({ ...newCountry, clusterId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isCreating}
            >
              <option value="">Select Cluster</option>
              {regionData.clusters.map(cluster => (
                <option key={cluster.id} value={cluster.id}>{cluster.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleCreateCountry}
              disabled={isCreating}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <FiPlus className="mr-2" />
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>

      {/* Countries List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Existing Countries</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : countries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiGlobe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No countries found</p>
            <p className="text-sm">Create your first country above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sub Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cluster
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game Plans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {countries.map((country) => (
                  <tr key={country.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCountry?.id === country.id ? (
                        <input
                          type="text"
                          value={editingCountry.name}
                          onChange={(e) => setEditingCountry({ ...editingCountry, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="flex items-center">
                          <FiMapPin className="mr-2 text-indigo-500" />
                          <span className="text-sm font-medium text-gray-900">{country.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingCountry?.id === country.id ? (
                        <select
                          value={editingCountry.regionId || ''}
                          onChange={(e) => setEditingCountry({ ...editingCountry, regionId: e.target.value ? parseInt(e.target.value) : null })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">None</option>
                          {regionData.regions.map(region => (
                            <option key={region.id} value={region.id}>{region.name}</option>
                          ))}
                        </select>
                      ) : (
                        country.region || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingCountry?.id === country.id ? (
                        <select
                          value={editingCountry.subRegionId || ''}
                          onChange={(e) => setEditingCountry({ ...editingCountry, subRegionId: e.target.value ? parseInt(e.target.value) : null })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">None</option>
                          {regionData.subRegions.map(subRegion => (
                            <option key={subRegion.id} value={subRegion.id}>{subRegion.name}</option>
                          ))}
                        </select>
                      ) : (
                        country.subRegion || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingCountry?.id === country.id ? (
                        <select
                          value={editingCountry.clusterId || ''}
                          onChange={(e) => setEditingCountry({ ...editingCountry, clusterId: e.target.value ? parseInt(e.target.value) : null })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">None</option>
                          {regionData.clusters.map(cluster => (
                            <option key={cluster.id} value={cluster.id}>{cluster.name}</option>
                          ))}
                        </select>
                      ) : (
                        country.cluster || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (country.gamePlansCount || 0) > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {country.gamePlansCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {editingCountry?.id === country.id ? (
                          <>
                            <button
                              onClick={handleUpdateCountry}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCountry(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingCountry(country)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <FiEdit className="mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCountry(country.id, country.name)}
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