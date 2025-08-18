'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiTag, FiEdit, FiTrash2, FiRefreshCw, FiLayers, FiChevronRight, FiChevronDown, FiX } from 'react-icons/fi';
import Link from 'next/link';

interface Range {
  id: number;
  name: string;
  campaignsCount: number;
}

interface Category {
  id: number;
  name: string;
  businessUnitId: number;
  businessUnitName: string;
  createdAt: string;
  updatedAt: string;
  ranges: Range[];
  rangesCount: number;
  gamePlansCount: number;
}

interface BusinessUnit {
  id: number;
  name: string;
  categoriesCount: number;
  categories: Category[];
}

export default function CategoriesAdmin() {
  const router = useRouter();
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBUs, setExpandedBUs] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Load data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setBusinessUnits(data);
        // Auto-expand all business units for better visibility
        const buIds = new Set(data.map((bu: BusinessUnit) => bu.id));
        setExpandedBUs(buIds);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const toggleBU = (buId: number) => {
    const newExpanded = new Set(expandedBUs);
    if (newExpanded.has(buId)) {
      newExpanded.delete(buId);
    } else {
      newExpanded.add(buId);
    }
    setExpandedBUs(newExpanded);
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim() || !selectedBusinessUnit) {
      alert('Please enter a category name and select a business unit');
      return;
    }

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: categoryName.trim(),
          businessUnitId: selectedBusinessUnit 
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setCategoryName('');
        setSelectedBusinessUnit(null);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create category');
      }
    } catch (err) {
      alert('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryName.trim()) return;

    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim() }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingCategory(null);
        setCategoryName('');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update category');
      }
    } catch (err) {
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      const response = await fetch(`/api/admin/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setDeletingCategory(null);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const openCreateModal = (buId: number) => {
    setSelectedBusinessUnit(buId);
    setCategoryName('');
    setShowCreateModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowEditModal(true);
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading categories...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Admin Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FiLayers className="mr-3 text-blue-600" />
                Categories Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage categories organized by business units with their associated ranges
              </p>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-blue-600">
              {businessUnits.length}
            </div>
            <div className="text-sm text-gray-600">Business Units</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-green-600">
              {businessUnits.reduce((sum, bu) => sum + bu.categoriesCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Categories</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-purple-600">
              {businessUnits.reduce((sum, bu) => 
                sum + bu.categories.reduce((catSum, cat) => catSum + cat.rangesCount, 0), 0
              )}
            </div>
            <div className="text-sm text-gray-600">Total Ranges</div>
          </div>
        </div>

        {/* Hierarchical List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {businessUnits.map((bu) => (
            <div key={bu.id} className="border-b last:border-b-0">
              {/* Business Unit Level */}
              <div className="px-6 py-4 bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={() => toggleBU(bu.id)}
                  >
                    {expandedBUs.has(bu.id) ? (
                      <FiChevronDown className="mr-2 text-gray-600" />
                    ) : (
                      <FiChevronRight className="mr-2 text-gray-600" />
                    )}
                    <span className="font-semibold text-lg text-blue-800">{bu.name}</span>
                    <span className="ml-3 text-sm text-gray-600">
                      ({bu.categoriesCount} categories)
                    </span>
                  </div>
                  <button
                    onClick={() => openCreateModal(bu.id)}
                    className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                  >
                    <FiPlus className="inline mr-1" />
                    Add Category
                  </button>
                </div>
              </div>

              {/* Categories */}
              {expandedBUs.has(bu.id) && (
                <div className="bg-gray-50">
                  {bu.categories.length === 0 ? (
                    <div className="px-12 py-4 text-gray-500 italic">
                      No categories in this business unit
                    </div>
                  ) : (
                    bu.categories.map((category) => (
                      <div key={category.id} className="border-t border-gray-200">
                        {/* Category Level */}
                        <div className="px-12 py-3 hover:bg-green-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center flex-1 cursor-pointer"
                              onClick={() => toggleCategory(category.id)}
                            >
                              {category.rangesCount > 0 && (
                                expandedCategories.has(category.id) ? (
                                  <FiChevronDown className="mr-2 text-gray-500" />
                                ) : (
                                  <FiChevronRight className="mr-2 text-gray-500" />
                                )
                              )}
                              {category.rangesCount === 0 && (
                                <div className="w-4 mr-2" />
                              )}
                              <FiTag className="mr-2 text-green-600" />
                              <span className="font-medium text-green-700">{category.name}</span>
                              <span className="ml-3 text-sm text-gray-500">
                                ({category.rangesCount} ranges, {category.gamePlansCount} game plans)
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(category)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(category)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Ranges */}
                        {expandedCategories.has(category.id) && category.ranges.length > 0 && (
                          <div className="px-20 py-2 bg-white">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {category.ranges.map((range) => (
                                <div 
                                  key={range.id}
                                  className="px-3 py-2 bg-purple-50 rounded text-sm"
                                >
                                  <span className="text-purple-700 font-medium">{range.name}</span>
                                  <span className="ml-2 text-gray-500">
                                    ({range.campaignsCount} campaigns)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create New Category</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Business Unit: <strong>
                    {businessUnits.find(bu => bu.id === selectedBusinessUnit)?.name}
                  </strong>
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Create Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Edit Category</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Business Unit: <strong>{editingCategory.businessUnitName}</strong>
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCategory}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Update Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && deletingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-600">Delete Category</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <p className="mb-4">
                Are you sure you want to delete <strong>{deletingCategory.name}</strong>?
              </p>
              
              <p className="text-sm text-gray-600 mb-4">
                Business Unit: <strong>{deletingCategory.businessUnitName}</strong>
              </p>
              
              {deletingCategory.rangesCount > 0 && (
                <p className="text-sm text-red-600 mb-4">
                  Warning: This category has {deletingCategory.rangesCount} ranges and {deletingCategory.gamePlansCount} game plans.
                </p>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}