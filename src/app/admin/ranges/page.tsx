'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiBox, FiEdit, FiTrash2, FiRefreshCw, FiPackage } from 'react-icons/fi';
import Link from 'next/link';

interface Range {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  categories: string[];
  categoriesCount: number;
  campaignsCount: number;
}

interface Category {
  id: number;
  name: string;
}

export default function RangesAdmin() {
  const router = useRouter();
  const [ranges, setRanges] = useState<Range[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRange, setNewRange] = useState({ 
    name: '', 
    categoryIds: [] as number[] 
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingRange, setEditingRange] = useState<Range | null>(null);
  const [editingCategoryIds, setEditingCategoryIds] = useState<number[]>([]);

  // Load ranges and categories
  useEffect(() => {
    fetchRanges();
    fetchCategories();
  }, []);

  const fetchRanges = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/ranges');
      if (response.ok) {
        const data = await response.json();
        setRanges(data);
      } else {
        setError('Failed to load ranges');
      }
    } catch (err) {
      setError('Failed to load ranges');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleCreateRange = async () => {
    if (!newRange.name.trim()) {
      alert('Please enter a range name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/ranges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRange.name.trim(),
          categoryIds: newRange.categoryIds
        }),
      });

      if (response.ok) {
        setNewRange({ name: '', categoryIds: [] });
        fetchRanges();
        alert('Range created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to create range: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to create range');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRange = async () => {
    if (!editingRange) return;

    try {
      const response = await fetch(`/api/admin/ranges/${editingRange.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingRange.name,
          categoryIds: editingCategoryIds
        }),
      });

      if (response.ok) {
        setEditingRange(null);
        setEditingCategoryIds([]);
        fetchRanges();
        alert('Range updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update range: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to update range');
    }
  };

  const handleDeleteRange = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the range "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ranges/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRanges();
        alert('Range deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to delete range: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to delete range');
    }
  };

  const handleEditRange = (range: Range) => {
    setEditingRange(range);
    // Convert category names back to IDs for editing
    const categoryIds = categories
      .filter(cat => range.categories.includes(cat.name))
      .map(cat => cat.id);
    setEditingCategoryIds(categoryIds);
  };

  const handleCancelEdit = () => {
    setEditingRange(null);
    setEditingCategoryIds([]);
  };

  const handleCategoryToggle = (categoryId: number, isForNewRange: boolean = false) => {
    if (isForNewRange) {
      setNewRange(prev => ({
        ...prev,
        categoryIds: prev.categoryIds.includes(categoryId)
          ? prev.categoryIds.filter(id => id !== categoryId)
          : [...prev.categoryIds, categoryId]
      }));
    } else {
      setEditingCategoryIds(prev => 
        prev.includes(categoryId)
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      );
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
        <h1 className="text-3xl font-bold text-gray-800">Ranges Management</h1>
        <div className="flex space-x-4">
          <button 
            onClick={fetchRanges}
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

      {/* Create New Range */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Range</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Range Name *
            </label>
            <input
              type="text"
              value={newRange.name}
              onChange={(e) => setNewRange({ ...newRange, name: e.target.value })}
              placeholder="e.g., Skincare Essentials"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isCreating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories (Optional)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newRange.categoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id, true)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isCreating}
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleCreateRange}
              disabled={isCreating}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <FiPlus className="mr-2" />
              {isCreating ? 'Creating...' : 'Create Range'}
            </button>
          </div>
        </div>
      </div>

      {/* Ranges List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Existing Ranges</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : ranges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiBox className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No ranges found</p>
            <p className="text-sm">Create your first range above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaigns
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
                {ranges.map((range) => (
                  <tr key={range.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRange?.id === range.id ? (
                        <input
                          type="text"
                          value={editingRange.name}
                          onChange={(e) => setEditingRange({ ...editingRange, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="flex items-center">
                          <FiPackage className="mr-2 text-indigo-500" />
                          <span className="text-sm font-medium text-gray-900">{range.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingRange?.id === range.id ? (
                        <div className="max-w-xs">
                          <div className="grid grid-cols-2 gap-1 max-h-20 overflow-y-auto text-xs">
                            {categories.map(category => (
                              <label key={category.id} className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={editingCategoryIds.includes(category.id)}
                                  onChange={() => handleCategoryToggle(category.id, false)}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-gray-700">{category.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {range.categoriesCount > 0 ? (
                            <div>
                              <span className="font-medium">{range.categoriesCount} categor{range.categoriesCount !== 1 ? 'ies' : 'y'}</span>
                              {range.categories.length > 0 && (
                                <div className="text-xs mt-1">
                                  {range.categories.slice(0, 3).join(', ')}
                                  {range.categories.length > 3 && ` +${range.categories.length - 3} more`}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">No categories</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        range.campaignsCount > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {range.campaignsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(range.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {editingRange?.id === range.id ? (
                          <>
                            <button
                              onClick={handleUpdateRange}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditRange(range)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <FiEdit className="mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRange(range.id, range.name)}
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