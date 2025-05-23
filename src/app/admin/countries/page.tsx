'use client';

import { useState, useEffect } from 'react';

interface Country {
  id: number;
  name: string;
  regionId: number;
  region?: {
    id: number;
    name: string;
  };
}

interface Region {
  id: number;
  name: string;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCountry, setNewCountry] = useState<Partial<Country>>({ name: '', regionId: 0 });
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [deletingCountry, setDeletingCountry] = useState<Country | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch countries and regions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch countries
        const countriesResponse = await fetch('/api/admin/countries', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!countriesResponse.ok) {
          throw new Error('Failed to fetch countries');
        }
        
        const countriesData = await countriesResponse.json();
        setCountries(countriesData);
        
        // Extract unique regions from countries
        const uniqueRegions = Array.from(
          new Map(countriesData.map((country: Country) => 
            [country.region?.id, country.region])
          ).values()
        ).filter(Boolean);
        
        setRegions(uniqueRegions as Region[]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle form submission for new country
  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate form
      if (!newCountry.name || !newCountry.regionId) {
        setError('Please provide both a name and region for the new country');
        setLoading(false);
        return;
      }
      
      // Add country via API
      const response = await fetch('/api/admin/countries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCountry),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add country');
      }
      
      // Refresh countries list
      const countriesResponse = await fetch('/api/admin/countries', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!countriesResponse.ok) {
        throw new Error('Failed to refresh countries list');
      }
      
      const countriesData = await countriesResponse.json();
      setCountries(countriesData);
      
      // Reset form
      setNewCountry({ name: '', regionId: 0 });
      setSuccess('Country added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error adding country:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle country deletion
  const handleDeleteCountry = async (country: Country) => {
    setDeletingCountry(country);
    setConfirmDelete(true);
  };

  // Confirm country deletion
  const confirmDeleteCountry = async () => {
    if (!deletingCountry) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Delete country via API
      const response = await fetch(`/api/admin/countries/${deletingCountry.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete country');
      }
      
      // Refresh countries list
      const countriesResponse = await fetch('/api/admin/countries', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!countriesResponse.ok) {
        throw new Error('Failed to refresh countries list');
      }
      
      const countriesData = await countriesResponse.json();
      setCountries(countriesData);
      
      setSuccess(`Country "${deletingCountry.name}" deleted successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error deleting country:', err);
    } finally {
      setLoading(false);
      setDeletingCountry(null);
      setConfirmDelete(false);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setDeletingCountry(null);
    setConfirmDelete(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold font-quicksand text-gray-800 mb-6">Manage Countries</h1>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      {/* Add New Country Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Add New Country</h2>
        
        <form onSubmit={handleAddCountry} className="space-y-4">
          <div>
            <label htmlFor="countryName" className="block text-sm font-medium text-gray-700 mb-1">Country Name</label>
            <input
              id="countryName"
              type="text"
              placeholder="Enter country name"
              value={newCountry.name}
              onChange={(e) => setNewCountry({...newCountry, name: e.target.value})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="regionSelect" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              id="regionSelect"
              value={newCountry.regionId || ''}
              onChange={(e) => setNewCountry({...newCountry, regionId: parseInt(e.target.value)})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : 'Add Country'}
          </button>
        </form>
      </div>
      
      {/* Countries Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Countries</h2>
        
        {loading && !countries.length ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-lg font-quicksand">Loading countries...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {countries.map((country) => (
                  <tr key={country.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{country.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{country.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{country.region?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteCountry(country)}
                        className="text-red-600 hover:text-red-900 mr-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!countries.length && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No countries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {confirmDelete && deletingCountry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Delete</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">Are you sure you want to delete the country "{deletingCountry.name}"?</p>
                <p className="text-sm text-red-600 mt-2">This will also delete all scores and ratings associated with this country.</p>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors font-quicksand"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCountry}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-quicksand"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
