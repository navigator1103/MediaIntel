'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiAlertCircle, FiCheckCircle, FiAlertTriangle, FiInfo, FiDatabase, FiLoader, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { MediaSufficiencyValidator } from '@/lib/validation/mediaSufficiencyValidator';

interface GamePlansValidationProps {
  sessionId: string;
}

export default function GamePlansValidation({ sessionId }: GamePlansValidationProps) {
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importProgress, setImportProgress] = useState(0);
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'suggestion'>('all');
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnName: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [validator, setValidator] = useState<MediaSufficiencyValidator | null>(null);

  useEffect(() => {
    loadValidationData();
  }, [sessionId]);

  // Initialize validator when validation data loads
  useEffect(() => {
    const initializeValidator = async () => {
      if (validationData?.records && !validator) {
        try {
          // Fetch master data for the validator
          const response = await fetch('/api/admin/media-sufficiency/master-data');
          if (response.ok) {
            const masterData = await response.json();
            const newValidator = new MediaSufficiencyValidator(masterData);
            setValidator(newValidator);
            console.log('Validator initialized with master data');
          }
        } catch (error) {
          console.error('Error initializing validator:', error);
        }
      }
    };
    
    initializeValidator();
  }, [validationData, validator]);

  const loadValidationData = async () => {
    try {
      setLoading(true);
      console.log('Loading validation data for session:', sessionId);
      
      const response = await fetch(`/api/admin/media-sufficiency/upload?sessionId=${sessionId}&includeRecords=true`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load validation data');
      }
      
      const data = await response.json();
      console.log('Loaded validation data:', {
        recordCount: data.records?.length,
        issueCount: data.validationIssues?.length,
        validationSummary: data.validationSummary
      });
      
      setValidationData(data);
    } catch (error) {
      console.error('Error loading validation data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load validation data');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      setImportStatus('importing');
      setImportProgress(0);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);
      
      const response = await fetch('/api/admin/media-sufficiency/import-sqlite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import data');
      }
      
      setImportProgress(100);
      setImportStatus('success');
      
      // Redirect after successful import
      setTimeout(() => {
        window.location.href = '/admin/game-plans/upload';
      }, 2000);
      
    } catch (error) {
      console.error('Error importing data:', error);
      setImportStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to import data');
    }
  };

  // Function to update session data on the server - same as enhanced-validate
  const updateSessionData = async (updatedData: any[]) => {
    if (!sessionId) return;
    
    try {
      console.log('Updating session data on server with latest edits...');
      const response = await fetch('/api/admin/media-sufficiency/update-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          records: updatedData
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update session data:', errorText);
      } else {
        console.log('Session data updated successfully');
      }
    } catch (error) {
      console.error('Error updating session data:', error);
    }
  };

  // Cell editing handlers
  const handleCellClick = (originalRowIndex: number, columnName: string) => {
    if (validationData?.records[originalRowIndex]) {
      setEditingCell({ rowIndex: originalRowIndex, columnName });
      setEditValue(validationData.records[originalRowIndex][columnName] || '');
    }
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // Handle cell edit - exactly like enhanced-validate
  const handleCellEdit = async (rowIndex: number, columnName: string, newValue: any) => {
    if (!validationData?.records) return;
    
    // Update the data
    const updatedData = [...validationData.records];
    updatedData[rowIndex][columnName] = newValue;
    
    // Update local state immediately
    setValidationData({
      ...validationData,
      records: updatedData
    });
    
    // Update session data on the server
    await updateSessionData(updatedData);
    
    // Re-run validation locally if validator is available
    if (validator) {
      try {
        // Properly await the Promise
        const newIssues = await validator.validateAll(updatedData);
        
        // Ensure issues is an array
        if (Array.isArray(newIssues)) {
          setValidationData(prev => ({
            ...prev,
            validationIssues: newIssues,
            validationSummary: validator.getValidationSummary(newIssues)
          }));
        } else {
          console.error('validateAll did not return an array:', newIssues);
        }
      } catch (error) {
        console.error('Error during validation after cell edit:', error);
      }
    }
  };

  const handleCellEditComplete = async () => {
    if (editingCell && validationData?.records) {
      const { rowIndex, columnName } = editingCell;
      
      // Call the cell edit handler
      await handleCellEdit(rowIndex, columnName, editValue);
      
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellEditComplete();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Check if import is allowed (no critical issues)
  const canImport = validationData?.validationSummary?.critical === 0;

  // Filter and paginate data
  const filteredData = useMemo(() => {
    if (!validationData?.records) return [];
    
    let filteredIndices: number[] = [];
    
    // Build array of indices that match filters
    for (let i = 0; i < validationData.records.length; i++) {
      const record = validationData.records[i];
      let includeRecord = true;
      
      // Filter by search term
      if (searchTerm) {
        const matchesSearch = Object.values(record).some(value => 
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (!matchesSearch) includeRecord = false;
      }
      
      // Filter by issues
      if (showOnlyIssues && validationData.validationIssues) {
        const hasIssues = validationData.validationIssues.some((issue: any) => issue.rowIndex === i);
        if (!hasIssues) includeRecord = false;
      }
      
      // Filter by severity
      if (filterSeverity !== 'all' && validationData.validationIssues) {
        const hasSeverityIssue = validationData.validationIssues.some((issue: any) => 
          issue.rowIndex === i && issue.severity === filterSeverity
        );
        if (!hasSeverityIssue) includeRecord = false;
      }
      
      if (includeRecord) {
        filteredIndices.push(i);
      }
    }
    
    return filteredIndices.map(index => ({
      record: validationData.records[index],
      originalIndex: index
    }));
  }, [validationData, searchTerm, showOnlyIssues, filterSeverity]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSeverity, showOnlyIssues]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading validation results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <FiAlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Validation Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {validationData?.totalRecords || 0}
              </div>
              <div className="text-sm text-green-700">Total Records</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {validationData?.validationSummary?.critical || 0}
              </div>
              <div className="text-sm text-red-700">Critical Issues</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {validationData?.validationSummary?.warning || 0}
              </div>
              <div className="text-sm text-yellow-700">Warnings</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {validationData?.validationSummary?.suggestion || 0}
              </div>
              <div className="text-sm text-blue-700">Suggestions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search in all fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Severity Filter */}
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings Only</option>
              <option value="suggestion">Suggestions Only</option>
            </select>
            
            {/* Show Only Issues Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyIssues}
                onChange={(e) => setShowOnlyIssues(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show only rows with issues</span>
            </label>
            
            {/* Results Count */}
            <div className="text-sm text-gray-600 flex items-center">
              Showing {paginatedData.length} of {filteredData.length} records
            </div>
          </div>
        </div>
      </div>

      {/* Data Preview */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Data Preview & Validation</h3>
        </div>
        <div className="p-6">
          {validationData?.records && validationData.records.length > 0 ? (
            <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: 'max-content' }}>
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200 min-w-16 z-20">
                      Row
                    </th>
                    {validationData.records[0] && Object.keys(validationData.records[0]).map((header) => (
                      <th 
                        key={header} 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-32"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item: any, displayIndex: number) => {
                    // Use the original index from our filtered data structure
                    const originalRowIndex = item.originalIndex;
                    const record = item.record;
                    const rowIssues = validationData.validationIssues?.filter((issue: any) => issue.rowIndex === originalRowIndex) || [];
                    return (
                      <tr key={originalRowIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 min-w-16 z-10">
                          {originalRowIndex + 1}
                        </td>
                        {Object.keys(record).map((header) => {
                          const cellIssue = rowIssues.find((issue: any) => issue.columnName === header);
                          const cellValue = record[header] || '-';
                          
                          return (
                            <td 
                              key={header} 
                              className={`px-4 py-3 text-sm whitespace-nowrap relative min-w-32 cursor-pointer hover:bg-gray-100 transition-colors ${
                                cellIssue 
                                  ? cellIssue.severity === 'critical' 
                                    ? 'bg-red-100 text-red-900 border-l-4 border-red-500' 
                                    : cellIssue.severity === 'warning'
                                    ? 'bg-yellow-100 text-yellow-900 border-l-4 border-yellow-500'
                                    : 'bg-blue-100 text-blue-900 border-l-4 border-blue-500'
                                  : 'text-gray-900'
                              }`}
                              title={cellIssue ? `${cellIssue.severity.toUpperCase()}: ${cellIssue.message}` : 'Click to edit'}
                              onClick={() => handleCellClick(originalRowIndex, header)}
                            >
                              {editingCell && editingCell.rowIndex === originalRowIndex && editingCell.columnName === header ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={handleCellChange}
                                  onBlur={handleCellEditComplete}
                                  onKeyDown={handleKeyDown}
                                  className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  autoFocus
                                />
                              ) : (
                                <span className="flex items-center">
                                  <span className="truncate max-w-48">{cellValue}</span>
                                  {cellIssue && (
                                    <span className="ml-2 flex-shrink-0">
                                      {cellIssue.severity === 'critical' && <FiAlertCircle className="h-3 w-3 text-red-500" />}
                                      {cellIssue.severity === 'warning' && <FiAlertTriangle className="h-3 w-3 text-yellow-500" />}
                                      {cellIssue.severity === 'suggestion' && <FiInfo className="h-3 w-3 text-blue-500" />}
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <FiInfo className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <div className="text-sm text-blue-800">
                    Session loaded: {validationData?.fileName || 'Unknown file'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    No records available for preview
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {validationData?.records && validationData.records.length > 0 && (
            <>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <p>
                    Showing {startIndex + 1} - {Math.min(endIndex, filteredData.length)} of {filteredData.length} filtered records
                    {filteredData.length !== validationData.records.length && (
                      <span className="text-gray-400"> (from {validationData.records.length} total)</span>
                    )}
                  </p>
                  <p className="text-xs mt-1">
                    💡 Scroll horizontally to see all {Object.keys(validationData.records[0]).length} columns
                  </p>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    <FiChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        pageNum = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + idx;
                      } else {
                        pageNum = currentPage - 2 + idx;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-gray-200 mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Import to Database</h3>
        </div>
        <div className="p-6">
          {/* Import Status */}
          {importStatus === 'idle' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${canImport ? 'bg-green-50' : 'bg-yellow-50'}`}>
                {canImport ? (
                  <div className="flex items-center">
                    <FiCheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <p className="text-green-800">Data is ready to import. No critical issues found.</p>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-800">
                      Cannot import: {validationData?.validationSummary?.critical || 0} critical issues must be fixed first.
                    </p>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleImport}
                disabled={!canImport}
                className={`w-full px-6 py-3 rounded-md font-medium transition-colors ${
                  canImport
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center">
                  <FiDatabase className="h-5 w-5 mr-2" />
                  Import to Game Plans
                </div>
              </button>
            </div>
          )}

          {/* Import Progress */}
          {importStatus === 'importing' && (
            <div className="space-y-4">
              <div className="flex items-center">
                <FiLoader className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                <p className="text-blue-800 font-medium">Importing data...</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{importProgress}% complete</p>
            </div>
          )}

          {/* Import Success */}
          {importStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FiCheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <div>
                  <p className="text-green-800 font-medium">Import successful!</p>
                  <p className="text-green-700 text-sm mt-1">Redirecting to Game Plans...</p>
                </div>
              </div>
            </div>
          )}

          {/* Import Error */}
          {importStatus === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FiAlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <div>
                    <p className="text-red-800 font-medium">Import failed</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleImport}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center justify-center">
                  <FiDatabase className="h-5 w-5 mr-2" />
                  Try Again
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}