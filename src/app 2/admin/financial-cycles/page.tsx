'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiCalendar, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';

interface FinancialCycle {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function FinancialCyclesAdmin() {
  const router = useRouter();
  const [cycles, setCycles] = useState<FinancialCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCycleName, setNewCycleName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load financial cycles
  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/financial-cycles');
      if (response.ok) {
        const data = await response.json();
        setCycles(data);
      } else {
        setError('Failed to load financial cycles');
      }
    } catch (err) {
      setError('Failed to load financial cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async () => {
    if (!newCycleName.trim()) {
      alert('Please enter a financial cycle name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/financial-cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCycleName.trim() }),
      });

      if (response.ok) {
        setNewCycleName('');
        fetchCycles(); // Refresh the list
        alert('Financial cycle created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create financial cycle: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to create financial cycle');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCycle = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the financial cycle "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/financial-cycles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCycles(); // Refresh the list
        alert('Financial cycle deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete financial cycle: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to delete financial cycle');
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Financial Cycles Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={fetchCycles}
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

      {/* Create New Financial Cycle */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Financial Cycle</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financial Cycle Name
            </label>
            <input
              type="text"
              value={newCycleName}
              onChange={(e) => setNewCycleName(e.target.value)}
              placeholder="e.g., ABP 2026, FC07 2025, LE 2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isCreating}
            />
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleCreateCycle}
              disabled={isCreating}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <FiPlus className="mr-2" />
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Common formats: ABP (Annual Business Plan), FC (Forecast), FS (Financial Statement), LE (Latest Estimate)
        </p>
      </div>

      {/* Financial Cycles List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Existing Financial Cycles</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : cycles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No financial cycles found</p>
            <p className="text-sm">Create your first financial cycle above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
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
                {cycles.map((cycle) => (
                  <tr key={cycle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cycle.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 text-indigo-500" />
                        {cycle.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cycle.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cycle.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteCycle(cycle.id, cycle.name)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <FiTrash2 className="mr-1" />
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

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-2">About Financial Cycles</h3>
        <p className="text-blue-700 text-sm mb-2">
          Financial cycles are used to organize game plans data by planning periods. When uploading forecast data, 
          you select which financial cycle the data belongs to.
        </p>
        <p className="text-blue-700 text-sm">
          <strong>Important:</strong> When uploading data for a country and financial cycle combination, 
          all existing data for that combination will be replaced with the new upload.
        </p>
      </div>
    </div>
  );
}