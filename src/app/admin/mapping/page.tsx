'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiLayers, FiSearch, FiMaximize, FiMinimize, FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

interface Campaign {
  id: number;
  name: string;
  status: string;
}

interface Range {
  id: number;
  name: string;
  campaignsCount: number;
  campaigns: Campaign[];
}

interface Category {
  id: number;
  name: string;
  rangesCount: number;
  ranges: Range[];
}

interface BusinessUnit {
  id: number;
  name: string;
  categoriesCount: number;
  categories: Category[];
}

interface MappingData {
  mappingData: BusinessUnit[];
  totals: {
    businessUnits: number;
    categories: number;
    ranges: number;
    campaigns: number;
  };
}

interface EditModalData {
  id: number;
  name: string;
  type: 'businessUnit' | 'category' | 'range' | 'campaign';
  parentName?: string;
}

export default function MappingPage() {
  const router = useRouter();
  const [data, setData] = useState<MappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBUs, setExpandedBUs] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expandedRanges, setExpandedRanges] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [editModal, setEditModal] = useState<EditModalData | null>(null);
  const [deleteModal, setDeleteModal] = useState<EditModalData | null>(null);
  const [editName, setEditName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check authentication first
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('Mapping page - checking auth:', { 
      hasUser: !!user, 
      hasToken: !!token,
      user: user ? JSON.parse(user) : null 
    });
    
    if (!user || !token) {
      console.log('No user or token found, redirecting to login');
      router.push('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'super_admin') {
        console.log('User is not super admin, redirecting to dashboard');
        router.push('/dashboard/media-sufficiency');
        return;
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
      router.push('/login');
      return;
    }
    
    fetchMappingData();
  }, [router]);

  const fetchMappingData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching mapping data with token:', !!token);
      
      const response = await fetch('/api/admin/mapping', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Mapping API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('401 Unauthorized, redirecting to login');
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch mapping data: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching mapping data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleBU = (buId: number) => {
    const newExpanded = new Set(expandedBUs);
    if (newExpanded.has(buId)) {
      newExpanded.delete(buId);
      // Collapse all child categories and ranges
      data?.mappingData.find(bu => bu.id === buId)?.categories.forEach(cat => {
        expandedCategories.delete(cat.id);
        cat.ranges.forEach(range => expandedRanges.delete(range.id));
      });
    } else {
      newExpanded.add(buId);
    }
    setExpandedBUs(newExpanded);
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
      // Collapse all child ranges
      data?.mappingData.forEach(bu => {
        bu.categories.find(cat => cat.id === categoryId)?.ranges.forEach(range => {
          expandedRanges.delete(range.id);
        });
      });
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleRange = (rangeId: number) => {
    const newExpanded = new Set(expandedRanges);
    if (newExpanded.has(rangeId)) {
      newExpanded.delete(rangeId);
    } else {
      newExpanded.add(rangeId);
    }
    setExpandedRanges(newExpanded);
  };

  const expandAll = () => {
    if (!data) return;
    const allBUs = new Set<number>();
    const allCategories = new Set<number>();
    const allRanges = new Set<number>();
    
    data.mappingData.forEach(bu => {
      allBUs.add(bu.id);
      bu.categories.forEach(cat => {
        allCategories.add(cat.id);
        cat.ranges.forEach(range => {
          allRanges.add(range.id);
        });
      });
    });
    
    setExpandedBUs(allBUs);
    setExpandedCategories(allCategories);
    setExpandedRanges(allRanges);
  };

  const collapseAll = () => {
    setExpandedBUs(new Set());
    setExpandedCategories(new Set());
    setExpandedRanges(new Set());
  };

  const handleEdit = (item: EditModalData) => {
    setEditModal(item);
    setEditName(item.name);
  };

  const handleDelete = (item: EditModalData) => {
    setDeleteModal(item);
  };

  const submitEdit = async () => {
    if (!editModal || !editName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/mapping', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editModal.id,
          name: editName.trim(),
          type: editModal.type
        })
      });
      
      if (response.ok) {
        setEditModal(null);
        setEditName('');
        fetchMappingData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating:', error);
      alert('Failed to update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteModal) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/mapping?id=${deleteModal.id}&type=${deleteModal.type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setDeleteModal(null);
        fetchMappingData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter data based on search term
  const filteredData = data ? {
    ...data,
    mappingData: data.mappingData.filter(bu => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      
      // Check if BU name matches
      if (bu.name.toLowerCase().includes(searchLower)) return true;
      
      // Check if any category, range, or campaign matches
      return bu.categories.some(cat => 
        cat.name.toLowerCase().includes(searchLower) ||
        cat.ranges.some(range => 
          range.name.toLowerCase().includes(searchLower) ||
          range.campaigns.some(campaign => 
            campaign.name.toLowerCase().includes(searchLower)
          )
        )
      );
    })
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading mapping data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <FiLayers className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Business Unit Mapping</h1>
              <p className="text-sm text-gray-600 mt-1">
                Hierarchical view of Business Units → Categories → Ranges → Campaigns
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{data?.totals.businessUnits || 0}</div>
            <div className="text-sm text-gray-600">Business Units</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{data?.totals.categories || 0}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{data?.totals.ranges || 0}</div>
            <div className="text-sm text-gray-600">Ranges</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{data?.totals.campaigns || 0}</div>
            <div className="text-sm text-gray-600">Campaigns</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all levels..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiMaximize className="mr-2" />
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiMinimize className="mr-2" />
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Mapping Tree */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
                {filteredData?.mappingData.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No results found for "{searchTerm}"
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredData?.mappingData.map(bu => (
                      <div key={bu.id} className="border border-gray-200 rounded-lg">
                        {/* Business Unit Level */}
                        <div
                          className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <div 
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                            onClick={() => toggleBU(bu.id)}
                          >
                            <svg
                              className={`w-4 h-4 text-gray-600 transform transition-transform ${
                                expandedBUs.has(bu.id) ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="font-semibold text-blue-800">{bu.name}</span>
                            <span className="text-sm text-gray-600">({bu.categoriesCount} categories)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit({ id: bu.id, name: bu.name || '', type: 'businessUnit' });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-200 rounded transition-colors"
                              title="Edit Business Unit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete({ id: bu.id, name: bu.name || '', type: 'businessUnit' });
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-200 rounded transition-colors"
                              title="Delete Business Unit"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Categories */}
                        {expandedBUs.has(bu.id) && (
                          <div className="pl-8 pr-3 py-2 space-y-1">
                            {bu.categories.map(category => (
                              <div key={category.id} className="border border-gray-100 rounded">
                                {/* Category Level */}
                                <div
                                  className="flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 transition-colors"
                                >
                                  <div 
                                    className="flex items-center gap-2 flex-1 cursor-pointer"
                                    onClick={() => toggleCategory(category.id)}
                                  >
                                    <svg
                                      className={`w-4 h-4 text-gray-600 transform transition-transform ${
                                        expandedCategories.has(category.id) ? 'rotate-90' : ''
                                      }`}
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="font-medium text-green-700">{category.name}</span>
                                    <span className="text-sm text-gray-600">({category.rangesCount} ranges)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit({ id: category.id, name: category.name, type: 'category', parentName: bu.name });
                                      }}
                                      className="p-1 text-green-600 hover:bg-green-200 rounded transition-colors"
                                      title="Edit Category"
                                    >
                                      <FiEdit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete({ id: category.id, name: category.name, type: 'category', parentName: bu.name });
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-200 rounded transition-colors"
                                      title="Delete Category"
                                    >
                                      <FiTrash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Ranges */}
                                {expandedCategories.has(category.id) && (
                                  <div className="pl-8 pr-2 py-2 space-y-1">
                                    {category.ranges.map(range => (
                                      <div key={range.id} className="border border-gray-50 rounded">
                                        {/* Range Level */}
                                        <div
                                          className="flex items-center justify-between p-2 bg-purple-50 hover:bg-purple-100 transition-colors"
                                        >
                                          <div 
                                            className="flex items-center gap-2 flex-1 cursor-pointer"
                                            onClick={() => toggleRange(range.id)}
                                          >
                                            <svg
                                              className={`w-4 h-4 text-gray-600 transform transition-transform ${
                                                expandedRanges.has(range.id) ? 'rotate-90' : ''
                                              }`}
                                              fill="none"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path d="M9 5l7 7-7 7" />
                                            </svg>
                                            <span className="font-medium text-purple-700">{range.name}</span>
                                            <span className="text-sm text-gray-600">({range.campaignsCount} campaigns)</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit({ id: range.id, name: range.name, type: 'range', parentName: category.name });
                                              }}
                                              className="p-1 text-purple-600 hover:bg-purple-200 rounded transition-colors"
                                              title="Edit Range"
                                            >
                                              <FiEdit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete({ id: range.id, name: range.name, type: 'range', parentName: category.name });
                                              }}
                                              className="p-1 text-red-600 hover:bg-red-200 rounded transition-colors"
                                              title="Delete Range"
                                            >
                                              <FiTrash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Campaigns */}
                                        {expandedRanges.has(range.id) && range.campaigns.length > 0 && (
                                          <div className="pl-8 pr-2 py-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                              {range.campaigns.map(campaign => (
                                                <div
                                                  key={campaign.id}
                                                  className="flex items-center justify-between p-2 bg-orange-50 rounded hover:bg-orange-100 transition-colors group"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                                    <span className="text-sm text-gray-700">{campaign.name}</span>
                                                    {campaign.status !== 'Active' && (
                                                      <span className="text-xs text-gray-500">({campaign.status})</span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit({ id: campaign.id, name: campaign.name, type: 'campaign', parentName: range.name });
                                                      }}
                                                      className="p-0.5 text-orange-600 hover:bg-orange-200 rounded transition-colors"
                                                      title="Edit Campaign"
                                                    >
                                                      <FiEdit2 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete({ id: campaign.id, name: campaign.name, type: 'campaign', parentName: range.name });
                                                      }}
                                                      className="p-0.5 text-red-600 hover:bg-red-200 rounded transition-colors"
                                                      title="Delete Campaign"
                                                    >
                                                      <FiTrash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Edit {editModal.type === 'businessUnit' ? 'Business Unit' : 
                      editModal.type === 'category' ? 'Category' :
                      editModal.type === 'range' ? 'Range' : 'Campaign'}
              </h2>
              <button
                onClick={() => setEditModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {editModal.parentName && (
              <p className="text-sm text-gray-600 mb-4">
                Parent: {editModal.parentName}
              </p>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter name"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                disabled={isSubmitting || !editName.trim()}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-red-600">Confirm Delete</h2>
              <button
                onClick={() => setDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <p className="mb-4">
              Are you sure you want to delete <strong>{deleteModal.name}</strong>?
            </p>
            
            {deleteModal.parentName && (
              <p className="text-sm text-gray-600 mb-4">
                Parent: {deleteModal.parentName}
              </p>
            )}
            
            <p className="text-sm text-red-600 mb-4">
              This action cannot be undone. Make sure this {
                deleteModal.type === 'businessUnit' ? 'business unit' : 
                deleteModal.type === 'category' ? 'category' :
                deleteModal.type === 'range' ? 'range' : 'campaign'
              } has no dependent data.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDelete}
                disabled={isSubmitting}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}