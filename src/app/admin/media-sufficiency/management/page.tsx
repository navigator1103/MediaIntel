'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight, FiTrash2, FiDownload } from 'react-icons/fi';
import { createPermissionChecker } from '@/lib/auth/permissions';

export default function MediaSufficiencyManagement() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaSufficiencyData, setMediaSufficiencyData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  
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

  // Load media sufficiency data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/admin/media-sufficiency/management', { headers });
        
        if (!response.ok) {
          throw new Error(`Error fetching media sufficiency data: ${response.status}`);
        }
        
        const data = await response.json();
        
        setMediaSufficiencyData(data);
        setFilteredData(data);
        setTotalPages(Math.ceil(data.length / rowsPerPage));
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch media sufficiency data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [rowsPerPage, refreshTrigger]);
  
  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(mediaSufficiencyData);
      setTotalPages(Math.ceil(mediaSufficiencyData.length / rowsPerPage));
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = mediaSufficiencyData.filter(item => {
      return (
        (item.campaign?.toLowerCase().includes(searchTermLower)) ||
        (item.range?.toLowerCase().includes(searchTermLower)) ||
        (item.category?.toLowerCase().includes(searchTermLower)) ||
        (item.country?.toLowerCase().includes(searchTermLower)) ||
        (item.lastUpdate?.toLowerCase().includes(searchTermLower)) ||
        (item.bu?.toLowerCase().includes(searchTermLower))
      );
    });
    
    setFilteredData(filtered);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setCurrentPage(1);
  }, [searchTerm, mediaSufficiencyData, rowsPerPage]);
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle row selection
  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === getCurrentPageData().length) {
      setSelectedRows(new Set());
    } else {
      const currentPageIds = getCurrentPageData().map(item => item.id);
      setSelectedRows(new Set(currentPageIds));
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (selectedRows.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedRows.size} record(s)?`);
    if (!confirmed) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/admin/media-sufficiency/management', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ ids: Array.from(selectedRows) }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete records');
      }
      
      // Remove deleted records from state
      setMediaSufficiencyData(prev => prev.filter(item => !selectedRows.has(item.id)));
      setFilteredData(prev => prev.filter(item => !selectedRows.has(item.id)));
      setSelectedRows(new Set());
      
      // Update pagination
      const newTotalPages = Math.ceil((filteredData.length - selectedRows.size) / rowsPerPage);
      setTotalPages(newTotalPages);
      
      // Adjust current page if needed
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
    } catch (err) {
      console.error('Error deleting records:', err);
      setError('Failed to delete records. Please try again.');
    } finally {
      setDeleting(false);
    }
  };
  
  // Handle CSV download
  const handleDownloadCSV = () => {
    if (selectedRows.size === 0) {
      alert('Please select rows to download');
      return;
    }
    
    // Get selected data
    const selectedData = filteredData.filter(item => selectedRows.has(item.id));
    
    // Convert to CSV
    const headers = [
      'ID', 'Last Update', 'Sub Region', 'Country', 'BU', 'Category', 'Range', 'Campaign',
      'TV Demo Gender', 'TV Demo Min Age', 'TV Demo Max Age', 'TV Target Size', 'TV R1+ (%)', 'TV R3+ (%)', 'TV Potential R1+',
      'Digital Demo Gender', 'Digital Demo Min Age', 'Digital Demo Max Age', 'Digital Target Size', 'Digital R1+ (%)', 'Digital Potential R1+',
      'Combined Reach (%)', 'Combined Potential (%)', 'CPP 2024', 'CPP 2025', 'CPP 2026', 'Currency', 'Created At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...selectedData.map(item => [
        item.id,
        item.lastUpdate || '',
        item.subRegion || '',
        item.country || '',
        item.bu || '',
        item.category || '',
        item.range || '',
        item.campaign || '',
        item.tvDemoGender || '',
        item.tvDemoMinAge || '',
        item.tvDemoMaxAge || '',
        item.tvTargetSize || '',
        item.tvPlannedR1Plus || '',
        item.tvPlannedR3Plus || '',
        item.tvPotentialR1Plus || '',
        item.digitalDemoGender || '',
        item.digitalDemoMinAge || '',
        item.digitalDemoMaxAge || '',
        item.digitalTargetSizeAbs || '',
        item.digitalPlannedR1Plus || '',
        item.digitalPotentialR1Plus || '',
        item.plannedCombinedReach || '',
        item.combinedPotentialReach || '',
        item.cpp2024 || '',
        item.cpp2025 || '',
        item.cpp2026 || '',
        item.reportedCurrency || '',
        new Date(item.createdAt).toLocaleString()
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `media_sufficiency_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clear selection after download
    setSelectedRows(new Set());
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
    return filteredData.slice(startIndex, endIndex);
  };
  
  // Format percentage values
  const formatPercentage = (value: string | null) => {
    if (!value) return '-';
    return value.includes('%') ? value : `${value}%`;
  };
  
  // Format currency values
  const formatCurrency = (value: number | null, currency?: string) => {
    if (!value) return '-';
    return currency ? `${value} ${currency}` : value.toString();
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Media Sufficiency Management</h1>
        <div className="flex items-center space-x-4">
          {selectedRows.size > 0 && userPermissions && (
            <>
              {userPermissions.isSuperAdmin() ? (
                <button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 transition-colors"
                >
                  <FiTrash2 className="mr-2" />
                  {deleting ? 'Deleting...' : `Delete (${selectedRows.size})`}
                </button>
              ) : (
                <button 
                  onClick={handleDownloadCSV}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <FiDownload className="mr-2" />
                  Download CSV ({selectedRows.size})
                </button>
              )}
            </>
          )}
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
        <div className="flex items-center mb-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search media sufficiency data..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
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
            Showing {filteredData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} records
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === getCurrentPageData().length && getCurrentPageData().length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Region</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TV Demo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TV Target Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TV R1+ (%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TV R3+ (%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TV Potential R1+</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPP 2024</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPP 2025</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digital Demo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digital Target Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digital R1+</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digital Potential R1+</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combined Reach</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combined Potential</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getCurrentPageData().map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(item.id)}
                          onChange={() => handleRowSelect(item.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.lastUpdate || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.subRegion || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.country || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.bu || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.category || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.range || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.campaign || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{`${item.tvDemoGender || ''} ${item.tvDemoMinAge || ''}-${item.tvDemoMaxAge || ''}`.trim() || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.tvTargetSize || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.tvPlannedR1Plus)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.tvPlannedR3Plus)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.tvPotentialR1Plus)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.cpp2024, item.reportedCurrency)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.cpp2025, item.reportedCurrency)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{`${item.digitalDemoGender || ''} ${item.digitalDemoMinAge || ''}-${item.digitalDemoMaxAge || ''}`.trim() || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.digitalTargetSizeAbs || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.digitalPlannedR1Plus)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.digitalPotentialR1Plus)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.plannedCombinedReach)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(item.combinedPotentialReach)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.reportedCurrency || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {getCurrentPageData().length === 0 && (
                    <tr>
                      <td colSpan={24} className="px-6 py-4 text-center text-sm text-gray-500">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
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
        )}
      </div>
    </div>
  );
}