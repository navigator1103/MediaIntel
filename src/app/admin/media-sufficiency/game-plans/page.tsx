'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiRefreshCw, FiFilter, FiChevronLeft, FiChevronRight, FiGrid, FiCalendar } from 'react-icons/fi';
import SimpleEditableGrid from '@/components/media-sufficiency/SimpleEditableGrid';
import GamePlansCalendar from '@/components/media-sufficiency/GamePlansCalendar';
import { createPermissionChecker } from '@/lib/auth/permissions';

export default function GamePlansAdmin() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gamePlans, setGamePlans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGamePlans, setFilteredGamePlans] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedImportBatch, setSelectedImportBatch] = useState<string | null>(null);
  const [availableImportBatches, setAvailableImportBatches] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('');
  
  // Initialize user permissions
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const permissionChecker = createPermissionChecker(userData);
        setUserPermissions(permissionChecker);
      } catch (error) {
        console.error('Error loading user permissions:', error);
      }
    }
  }, []);
  
  // Load game plans data
  useEffect(() => {
    const fetchGamePlans = async () => {
      setLoading(true);
      try {
        let url = '/api/admin/media-sufficiency/game-plans';
        if (selectedImportBatch === 'all') {
          url += '?showAll=true';
        } else if (selectedImportBatch) {
          url += `?lastUpdateId=${selectedImportBatch}`;
        }
        
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          throw new Error(`Error fetching game plans: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle new API response format
        const gamePlansData = data.gamePlans || data; // Fallback for backward compatibility
        const availableUpdates = data.availableUpdates || [];
        
        setGamePlans(gamePlansData);
        setFilteredGamePlans(gamePlansData);
        setTotalPages(Math.ceil(gamePlansData.length / rowsPerPage));
        setAvailableImportBatches(availableUpdates);
        
        // Set default selected import batch if not already set
        if (!selectedImportBatch && data.currentFilter) {
          setSelectedImportBatch(data.currentFilter.toString());
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch game plans:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };
    
    fetchGamePlans();
  }, [rowsPerPage, refreshTrigger, selectedImportBatch]);
  
  // Filter game plans based on search term and business unit
  useEffect(() => {
    let filtered = gamePlans;
    
    // Apply business unit filter first
    if (selectedBusinessUnit) {
      filtered = filtered.filter(plan => 
        plan.category?.businessUnit?.name?.toLowerCase() === selectedBusinessUnit.toLowerCase()
      );
    }
    
    // Then apply search filter
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => {
        // Search in multiple fields (excluding business unit to avoid confusion)
        return (
          (plan.campaign?.name?.toLowerCase().includes(searchTermLower)) ||
          (plan.mediaSubType?.name?.toLowerCase().includes(searchTermLower)) ||
          (plan.mediaSubType?.mediaType?.name?.toLowerCase().includes(searchTermLower)) ||
          (plan.country?.name?.toLowerCase().includes(searchTermLower)) ||
          (plan.category?.name?.toLowerCase().includes(searchTermLower)) ||
          (plan.pmType?.name?.toLowerCase().includes(searchTermLower)) ||
          (plan.startDate?.includes(searchTerm)) ||
          (plan.endDate?.includes(searchTerm))
        );
      });
    }
    
    setFilteredGamePlans(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedBusinessUnit, gamePlans, rowsPerPage]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle delete
  const handleDelete = (deletedIds: number[]) => {
    // Remove deleted rows from state
    setGamePlans(prev => prev.filter(plan => !deletedIds.includes(plan.id)));
    setFilteredGamePlans(prev => prev.filter(plan => !deletedIds.includes(plan.id)));
    
    // Update pagination
    const newTotalPages = Math.ceil((filteredGamePlans.length - deletedIds.length) / rowsPerPage);
    setTotalPages(newTotalPages);
    
    // Adjust current page if needed
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  };
  
  // Handle data changes
  const handleDataChange = (updatedData: any[]) => {
    // Update the filtered game plans with the changes
    const updatedGamePlans = gamePlans.map(plan => {
      const updatedPlan = updatedData.find(item => item.id === plan.id);
      return updatedPlan || plan;
    });
    
    setGamePlans(updatedGamePlans);
    
    // Re-apply filtering (both business unit and search)
    let filtered = updatedGamePlans;
    
    // Apply business unit filter
    if (selectedBusinessUnit) {
      filtered = filtered.filter(plan => 
        plan.category?.businessUnit?.name?.toLowerCase() === selectedBusinessUnit.toLowerCase()
      );
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => {
        return (
          String(plan.id).includes(searchTerm) ||
          (plan.campaign?.name && plan.campaign.name.toLowerCase().includes(searchTermLower)) ||
          (plan.mediaSubType?.name && plan.mediaSubType.name.toLowerCase().includes(searchTermLower)) ||
          (plan.mediaSubType?.mediaType?.name && plan.mediaSubType.mediaType.name.toLowerCase().includes(searchTermLower)) ||
          (plan.country?.name && plan.country.name.toLowerCase().includes(searchTermLower)) ||
          (plan.category?.name && plan.category.name.toLowerCase().includes(searchTermLower)) ||
          (plan.pmType?.name && plan.pmType.name.toLowerCase().includes(searchTermLower))
        );
      });
    }
    
    setFilteredGamePlans(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    
    setUnsavedChanges(true);
  };
  
  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Calculate current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredGamePlans.slice(startIndex, endIndex);
  };
  
  return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Game Plans Management</h1>
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiGrid className="mr-1" size={16} />
                Table
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiCalendar className="mr-1" size={16} />
                Calendar
              </button>
            </div>
            
            <button 
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {viewMode === 'table' && (
            <>
              <div className="flex items-center mb-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search game plans..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="ml-4">
                  <select
                    value={selectedBusinessUnit}
                    onChange={(e) => setSelectedBusinessUnit(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Business Units</option>
                    <option value="Derma">Derma</option>
                    <option value="Nivea">Nivea</option>
                  </select>
                </div>
                <div className="ml-4">
                  <select
                    value={selectedImportBatch || ''}
                    onChange={(e) => setSelectedImportBatch(e.target.value || null)}
                    className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Latest Import</option>
                    <option value="all">All Data (No Filter)</option>
                    {availableImportBatches.map((batch) => (
                      <option key={batch.last_update_id} value={batch.last_update_id}>
                        {batch.lastUpdate?.name || `Import ${batch.last_update_id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ml-4">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredGamePlans.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredGamePlans.length)} of {filteredGamePlans.length} game plans
                </p>
              </div>
            </>
          )}

          {viewMode === 'calendar' && (
            <div className="mb-4">
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search campaigns..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Showing {filteredGamePlans.length} game plans grouped by campaign
              </p>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {viewMode === 'table' ? (
                <>
                  <SimpleEditableGrid 
                    data={getCurrentPageData()} 
                    onSave={handleDataChange}
                    onDelete={handleDelete}
                    userPermissions={userPermissions}
                  />
                  
                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className={`flex items-center px-4 py-2 border rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiChevronLeft className="mr-2" />
                      Previous
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className={`flex items-center px-4 py-2 border rounded-md ${
                        currentPage === totalPages || totalPages === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                      <FiChevronRight className="ml-2" />
                    </button>
                  </div>
                </>
              ) : (
                <GamePlansCalendar 
                  data={filteredGamePlans} 
                  onSave={handleDataChange}
                />
              )}
            </>
          )}
        </div>
      </div>
  );
}
