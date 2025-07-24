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
  const [importResults, setImportResults] = useState<any>(null);
  const [importStage, setImportStage] = useState<string>('Initializing...');
  const [showManualCheck, setShowManualCheck] = useState(false);

  // Debug: Log when error state changes
  React.useEffect(() => {
    if (error) {
      console.log('Error state updated:', error);
      console.log('Error contains newlines:', error.includes('\n'));
      console.log('Error lines:', error.split('\n'));
    }
  }, [error]);
  
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
    if (sessionId) {
      loadValidationData();
    }
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
            const newValidator = new MediaSufficiencyValidator(masterData, true); // Enable auto-creation mode
            setValidator(newValidator);
            console.log('Validator initialized with master data');
            
            // Run validation immediately after initializing
            const newIssues = await newValidator.validateAll(validationData.records);
            if (Array.isArray(newIssues)) {
              console.log(`Initial validation found ${newIssues.length} issues`);
              setValidationData(prev => ({
                ...prev,
                validationIssues: newIssues,
                validationSummary: newValidator.getValidationSummary(newIssues)
              }));
            }
          }
        } catch (error) {
          console.error('Error initializing validator:', error);
        }
      }
    };
    
    initializeValidator();
  }, [validationData?.records, validator]);

  const loadValidationData = async () => {
    try {
      setLoading(true);
      
      if (!sessionId) {
        throw new Error('Session ID is required but not provided');
      }
      
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
      // First, ensure any pending edits are saved
      if (editingCell) {
        await handleCellEditComplete();
      }
      
      // Ensure the latest data is saved to the session
      if (validationData?.records) {
        console.log('Saving latest validation data before import...');
        const updateSuccess = await updateSessionData(validationData.records);
        if (!updateSuccess) {
          console.log('Failed to save validation data before import');
          setImportStatus('error');
          setImportStage('Failed to save validation data before import');
          setImportProgress(100);
          return;
        }
        // Add a small delay to ensure file write is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Session data saved, proceeding with import');
      }
      
      setImportStatus('importing');
      setImportProgress(0);
      setImportStage('Starting import process...');
      
      // Enhanced progress simulation with stages
      let currentStage = 0;
      const stages = [
        'Validating data...',
        'Creating backup...',
        'Processing entities...',
        'Creating game plans...',
        'Finalizing import...'
      ];
      
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + 8;
          const stageIndex = Math.floor(newProgress / 20);
          if (stageIndex < stages.length && stageIndex !== currentStage) {
            currentStage = stageIndex;
            setImportStage(stages[stageIndex]);
          }
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 600);
      
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
        console.log('Import request failed:', errorData);
        setImportStatus('error');
        setError(errorData.error || 'Failed to import data');
        setImportStage(`Import failed`);
        setImportProgress(100);
        return;
      }
      
      const responseData = await response.json();
      console.log('Import response:', responseData);
      
      // Poll for import completion and results
      let pollAttempts = 0;
      const maxPollAttempts = 60; // 30 seconds with 500ms intervals
      
      const pollForResults = async (): Promise<void> => {
        try {
          const statusResponse = await fetch(`/api/admin/media-sufficiency/upload?sessionId=${sessionId}`);
          if (statusResponse.ok) {
            const sessionData = await statusResponse.json();
            console.log('Session polling data:', sessionData);
            
            if (sessionData.status === 'imported') {
              // Import completed successfully
              // Handle both importResults (new format) and importResults (legacy format)
              const results = sessionData.importResults || sessionData.results;
              setImportResults(results);
              setImportProgress(100);
              setImportStatus('success');
              setImportStage('Import completed!');
              return;
            } else if (sessionData.status === 'error') {
              // Import failed - handle different error formats
              let errorMessage = 'Import failed';
              
              console.log('Error session data structure:', JSON.stringify(sessionData, null, 2));
              
              // Simply extract all error messages and combine them
              if (Array.isArray(sessionData.importErrors) && sessionData.importErrors.length > 0) {
                const allErrors = sessionData.importErrors.map((err: any) => {
                  return err.error || err.message || JSON.stringify(err);
                });
                errorMessage = allErrors.join('\n');
              } else if (typeof sessionData.importErrors === 'string') {
                errorMessage = sessionData.importErrors;
              } else if (sessionData.error) {
                errorMessage = sessionData.error;
              }
              
              console.log('Import failed with error:', errorMessage);
              console.log('Full session data:', sessionData);
              console.log('Import errors array:', sessionData.importErrors);
              
              // Extract detailed errors if available
              let finalErrorMessage = errorMessage;
              if (Array.isArray(sessionData.importErrors) && sessionData.importErrors.length > 0) {
                const detailedErrors = sessionData.importErrors.map((err: any) => {
                  console.log('Processing error object:', err);
                  return err.error || err.message || JSON.stringify(err);
                });
                finalErrorMessage = detailedErrors.join('\n');
                console.log('Final detailed error message:', finalErrorMessage);
              }
              
              setError(finalErrorMessage);
              
              setImportStatus('error');
              setImportStage(`Import failed`);
              setImportProgress(100);
              return;
            } else if (pollAttempts < maxPollAttempts) {
              // Still processing, continue polling
              pollAttempts++;
              const progressEstimate = Math.min(95, 90 + pollAttempts);
              setImportProgress(progressEstimate);
              setImportStage(`Processing import... (${pollAttempts}/${maxPollAttempts})`);
              setTimeout(pollForResults, 500);
            } else {
              // Timeout - but show manual check option instead of failing
              console.log('Import timeout after', maxPollAttempts, 'attempts');
              setImportStage('Import may still be processing...');
              setShowManualCheck(true);
              setImportProgress(100);
              return; // Don't throw error, let user manually check
            }
          } else {
            const errorText = await statusResponse.text();
            console.log('Failed to get import status:', statusResponse.status, errorText);
            setImportStatus('error');
            setImportStage(`Failed to get import status: ${statusResponse.status}`);
            setImportProgress(100);
            return;
          }
        } catch (error) {
          console.log('Error polling for results:', error);
          setImportStatus('error');
          setImportStage(`Polling error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setImportProgress(100);
          return;
        }
      };
      
      // Start polling for results
      setTimeout(pollForResults, 1000);
      
    } catch (error) {
      console.log('Error importing data:', error);
      setImportStatus('error');
      setImportStage('Import failed');
      
      // Try to get more detailed error information from session data first
      try {
        const statusResponse = await fetch(`/api/admin/media-sufficiency/upload?sessionId=${sessionId}`);
        if (statusResponse.ok) {
          const sessionData = await statusResponse.json();
          console.log('Session data after error:', sessionData);
          
          // Extract detailed errors from session if available
          if (sessionData.status === 'error' && Array.isArray(sessionData.importErrors) && sessionData.importErrors.length > 0) {
            const detailedErrors = sessionData.importErrors.map((err: any) => err.error || err.message || JSON.stringify(err));
            setError(detailedErrors.join('\n'));
          } else {
            // Fallback to the caught error
            let errorMessage = 'Failed to import data';
            if (error instanceof Error) {
              errorMessage = error.message;
            } else if (typeof error === 'string') {
              errorMessage = error;
            }
            setError(errorMessage);
          }
          
          if (sessionData.importResults) {
            setImportResults(sessionData.importResults);
          }
        } else {
          // If we can't get session data, use the caught error
          let errorMessage = 'Failed to import data';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          setError(errorMessage);
        }
      } catch (statusError) {
        console.log('Failed to get status after error:', statusError);
        // If everything fails, use the original caught error
        let errorMessage = 'Failed to import data';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        setError(errorMessage);
      }
    }
  };

  // Manual check for import status
  const checkImportStatus = async () => {
    try {
      setShowManualCheck(false);
      setImportStage('Checking import status...');
      
      const statusResponse = await fetch(`/api/admin/media-sufficiency/upload?sessionId=${sessionId}`);
      if (statusResponse.ok) {
        const sessionData = await statusResponse.json();
        console.log('Manual status check:', sessionData);
        
        if (sessionData.status === 'imported') {
          const results = sessionData.importResults || sessionData.results;
          setImportResults(results);
          setImportStatus('success');
          setImportStage('Import completed!');
        } else if (sessionData.status === 'error') {
          let errorMessage = 'Import failed';
          if (Array.isArray(sessionData.importErrors) && sessionData.importErrors.length > 0) {
            errorMessage = sessionData.importErrors[0].error || errorMessage;
          }
          setImportStatus('error');
          setError(errorMessage);
          setImportStage('Import failed');
        } else {
          // Still processing
          setImportStage('Import is still processing...');
          setShowManualCheck(true);
        }
      } else {
        console.log('Failed to check status, response not ok:', response.status);
        setImportStatus('error');
        setError('Failed to check status');
      }
    } catch (error) {
      console.log('Error checking status:', error);
      setImportStatus('error');
      setError('Failed to check import status');
    }
  };

  // Function to update session data on the server - same as enhanced-validate
  const updateSessionData = async (updatedData: any[]) => {
    if (!sessionId) return false;
    
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
        return false;
      } else {
        console.log('Session data updated successfully');
        return true;
      }
    } catch (error) {
      console.error('Error updating session data:', error);
      return false;
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
              className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              style={{ backgroundColor: 'white', color: '#111827' }}
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

      {/* Critical Issues Summary - Show before import section */}
      {validationData?.validationSummary?.critical > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg mt-6">
          <div className="px-6 py-4 border-b border-red-200">
            <h3 className="text-lg font-medium text-red-900 flex items-center">
              <FiAlertCircle className="h-5 w-5 mr-2" />
              Critical Issues Must Be Fixed Before Import
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-red-800 font-medium">
                Found {validationData.validationSummary.critical} critical issues that prevent import:
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Display actual critical validation issues */}
              {validationData.validationIssues && (() => {
                const criticalIssues = validationData.validationIssues.filter((issue: any) => issue.severity === 'critical');
                
                if (criticalIssues.length > 0) {
                  // Group issues by field and message for better display
                  const groupedIssues: { [key: string]: any[] } = {};
                  criticalIssues.forEach((issue: any) => {
                    const key = `${issue.columnName}: ${issue.message}`;
                    if (!groupedIssues[key]) {
                      groupedIssues[key] = [];
                    }
                    groupedIssues[key].push(issue);
                  });
                  
                  return [(
                    <div key="critical_issues" className="bg-white border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">🔴 Critical Validation Issues</h4>
                      <div className="space-y-2">
                        {Object.entries(groupedIssues).map(([key, issues], idx) => {
                          const [field, message] = key.split(': ', 2);
                          const rowCount = issues.length;
                          const sampleRows = issues.slice(0, 5).map((issue: any) => issue.rowIndex + 1);
                          
                          return (
                            <div key={idx} className="text-sm text-red-800">
                              <div className="font-medium">{field}:</div>
                              <div className="ml-4 text-red-700">
                                {message}
                                <div className="text-xs text-red-600 mt-1">
                                  Affects {rowCount} row{rowCount > 1 ? 's' : ''}: 
                                  {rowCount <= 5 ? 
                                    ` ${sampleRows.join(', ')}` : 
                                    ` ${sampleRows.join(', ')} and ${rowCount - 5} more`
                                  }
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )];
                }
                
                return [];
              })()}
              
              {/* Check for structural issues - missing columns */}
              {(() => {
                const structuralIssues = [];
                
                // Check what columns are actually present vs required
                if (validationData.records && validationData.records.length > 0) {
                  const firstRecord = validationData.records[0];
                  const presentColumns = Object.keys(firstRecord);
                  console.log('Present columns:', presentColumns);
                  
                  // Only columns that MUST be present in CSV (not auto-populated)
                  const requiredColumns = [
                    // Core identification fields (required in CSV)
                    'Category', 'Range', 'Campaign', 'Playbook ID', 'Campaign Archetype', 'Burst',
                    
                    // Media fields (required in CSV)
                    'Media', 'Media Subtype',
                    
                    // Date fields (required in CSV)
                    'Initial Date', 'End Date',
                    
                    // Budget fields (required in CSV)
                    'Total Weeks', 'Total Budget', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                    
                    // Performance fields (required in CSV)
                    'Total WOA', 'Total WOFF', 'Total R1+ (%)', 'Total R3+ (%)'
                  ];
                  
                  // Check for required columns with flexible naming
                  const missingRequired: string[] = [];
                  
                  for (const col of requiredColumns) {
                    let found = false;
                    
                    // Check with flexible naming for backward compatibility
                    if (col === 'Media Subtype') {
                      found = presentColumns.includes('Media Subtype') || presentColumns.includes('Media Sub Type');
                    } else if (col === 'Initial Date') {
                      found = presentColumns.includes('Initial Date') || presentColumns.includes('Start Date');
                    } else if (col === 'Total Budget') {
                      found = presentColumns.includes('Total Budget') || presentColumns.includes('Budget');
                    } else if (col === 'Media') {
                      found = presentColumns.includes('Media') || presentColumns.includes('Media Type');
                    } else if (col === 'TRP') {
                      found = presentColumns.includes('TRP') || presentColumns.includes('Total TRPs') || presentColumns.includes('TRPs');
                    } else if (col === 'Reach R1+') {
                      found = presentColumns.includes('Reach R1+') || presentColumns.includes('Total R1+') || presentColumns.includes('R1+');
                    } else if (col === 'Reach R3+') {
                      found = presentColumns.includes('Reach R3+') || presentColumns.includes('Total R3+') || presentColumns.includes('R3+');
                    } else {
                      found = presentColumns.includes(col);
                    }
                    
                    if (!found) {
                      missingRequired.push(col);
                    }
                  }
                  
                  console.log('Missing required columns:', missingRequired);
                  
                  if (missingRequired.length > 0) {
                    // Separate truly critical columns from governance-manageable ones
                    const trulyMissing = [];
                    const governanceManageable = [];
                    
                    for (const col of missingRequired) {
                      // These columns can be auto-populated or auto-created by governance
                      if (['Campaign', 'Range', 'Category'].includes(col)) {
                        governanceManageable.push(col);
                      } else {
                        trulyMissing.push(col);
                      }
                    }
                    
                    // Only show critical error for truly missing essential columns
                    if (trulyMissing.length > 0) {
                      structuralIssues.push({
                        type: 'missing_columns',
                        severity: 'critical',
                        message: `Missing essential columns: ${trulyMissing.join(', ')}`
                      });
                    }
                    
                    // Show warning for governance-manageable columns
                    if (governanceManageable.length > 0) {
                      structuralIssues.push({
                        type: 'governance_manageable',
                        severity: 'warning',
                        message: `⚠️ These columns can be auto-created: ${governanceManageable.join(', ')}`
                      });
                    }
                  }
                  
                  // Show helpful message about supported formats
                  const hasMonthlyBudgets = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].some(month => presentColumns.includes(month));
                  
                  if (hasMonthlyBudgets && missingRequired.length === 0) {
                    structuralIssues.push({
                      type: 'info',
                      message: `✅ New monthly budget format detected (Jan-Dec). This is supported!`
                    });
                  }
                }
                
                if (structuralIssues.length > 0) {
                  const criticalIssues = structuralIssues.filter(issue => issue.severity === 'critical');
                  const warningIssues = structuralIssues.filter(issue => issue.severity === 'warning');
                  const infoIssues = structuralIssues.filter(issue => issue.type === 'info');
                  
                  const elements = [];
                  
                  // Critical issues (red)
                  if (criticalIssues.length > 0) {
                    elements.push(
                      <div key="critical_issues" className="bg-white border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-900 mb-2">🔴 Critical Structural Issues</h4>
                        <ul className="space-y-1">
                          {criticalIssues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-red-800 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span>{issue.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  
                  // Warning issues (orange/yellow)
                  if (warningIssues.length > 0) {
                    elements.push(
                      <div key="warning_issues" className="bg-white border border-orange-200 rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-orange-900 mb-2">⚠️ Governance Notifications</h4>
                        <ul className="space-y-1">
                          {warningIssues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-orange-800 flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              <span>{issue.message}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-orange-700 mt-2">
                          ℹ️ Import can proceed - missing entities will be auto-created during import.
                        </p>
                      </div>
                    );
                  }
                  
                  // Info issues (blue/green)
                  if (infoIssues.length > 0) {
                    elements.push(
                      <div key="info_issues" className="bg-white border border-green-200 rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-green-900 mb-2">ℹ️ Information</h4>
                        <ul className="space-y-1">
                          {infoIssues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-green-800 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              <span>{issue.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  
                  return elements;
                }
                
                return [];
              })()}
            </div>
            
            <div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-3">
              <h4 className="font-medium text-red-900 mb-2">How to Fix:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Download your file, add missing columns/data, and re-upload</li>
                <li>• Use the validation grid above to edit individual cells</li>
                <li>• Export the corrected data and import to a new session</li>
                <li>• Refer to the template file for correct column names and format</li>
              </ul>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiLoader className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                  <p className="text-blue-800 font-medium">Importing Data</p>
                </div>
                <div className="text-sm text-blue-600 font-medium">{importProgress}%</div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{importStage}</span>
                <span className="text-gray-500">
                  {validationData?.totalRecords ? `${validationData.totalRecords} records` : ''}
                </span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  ⏳ Please wait while we process your data. This may take a few moments for large files.
                </p>
              </div>
              
              {/* Manual check option for timeouts */}
              {showManualCheck && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-800 font-medium">Import taking longer than expected</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        The import may still be processing. You can check the status manually.
                      </p>
                    </div>
                    <button
                      onClick={checkImportStatus}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
                    >
                      Check Status
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Success */}
          {importStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <FiCheckCircle className="h-6 w-6 text-green-400 mr-3 mt-1" />
                <div className="flex-1">
                  <p className="text-green-800 font-medium text-lg mb-3">Import Completed Successfully!</p>
                  
                  {importResults && (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-2xl font-bold text-green-600">{importResults.successful || 0}</div>
                          <div className="text-sm text-green-700">Records Imported</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-2xl font-bold text-blue-600">{importResults.results?.gamePlansCount || 0}</div>
                          <div className="text-sm text-blue-700">Game Plans Created</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-2xl font-bold text-purple-600">{importResults.results?.campaignsCount || 0}</div>
                          <div className="text-sm text-purple-700">Campaigns Created</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="text-2xl font-bold text-orange-600">{importResults.results?.rangesCount || 0}</div>
                          <div className="text-sm text-orange-700">Ranges Created</div>
                        </div>
                      </div>
                      
                      {/* Detailed Results */}
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">Import Details</h4>
                        <div className="text-sm text-green-700 space-y-1">
                          <p>• Total Records Processed: {importResults.processed || 0}</p>
                          <p>• Successfully Imported: {importResults.successful || 0}</p>
                          <p>• Failed Records: {importResults.failed || 0}</p>
                          {importResults.successfulRows && importResults.successfulRows.length > 0 && (
                            <p>• Successful Rows: {importResults.successfulRows.slice(0, 10).join(', ')}{importResults.successfulRows.length > 10 ? '...' : ''}</p>
                          )}
                          {importResults.failedRows && importResults.failedRows.length > 0 && (
                            <p className="text-red-700">• Failed Rows: {importResults.failedRows.slice(0, 10).join(', ')}{importResults.failedRows.length > 10 ? '...' : ''}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Error Summary if any */}
                      {importResults.errorsByType && Object.keys(importResults.errorsByType).length > 0 && (
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <h4 className="font-medium text-red-800 mb-2">Error Summary</h4>
                          <div className="text-sm text-red-700 space-y-1">
                            {Object.entries(importResults.errorsByType).map(([type, count]) => (
                              <p key={type}>• {type}: {count as number}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => window.location.href = '/admin/media-sufficiency/game-plans'}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      View Game Plans
                    </button>
                    <button
                      onClick={() => window.location.href = '/admin/game-plans/upload'}
                      className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-md hover:bg-green-50 transition-colors"
                    >
                      New Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import Error */}
          {importStatus === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <FiAlertCircle className="h-6 w-6 text-red-400 mr-3 mt-1" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium text-lg mb-2">Import Failed</p>
                    
                    {/* Display formatted error messages */}
                    {error && (
                      <div className="space-y-3 mb-4">
                        {/* Parse and group errors by type */}
                        {(() => {
                          // Split by both semicolon and period followed by space + capital letter
                          const splitPattern = /[;.](?=\s*[A-Z])/;
                          const errorLines = error.split(splitPattern).map(line => line.trim()).filter(line => line);
                          const rowErrors: string[] = [];
                          const columnErrors: string[] = [];
                          const otherErrors: string[] = [];
                          
                          errorLines.forEach(line => {
                            if (line.match(/^Row \d+:/)) {
                              rowErrors.push(line);
                            } else if (line.includes('columns found:') || line.includes('Expected columns') || line.includes('Missing required columns')) {
                              columnErrors.push(line);
                            } else if (line.trim()) {
                              otherErrors.push(line);
                            }
                          });
                          
                          return (
                            <>
                              {/* Row-specific errors */}
                              {rowErrors.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                                  <p className="text-red-800 font-medium text-sm mb-2">Row-Specific Errors ({rowErrors.length})</p>
                                  <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {rowErrors.map((error, idx) => (
                                      <p key={idx} className="text-red-700 text-xs">• {error}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Column errors */}
                              {columnErrors.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                                  <p className="text-orange-800 font-medium text-sm mb-2">Column Issues</p>
                                  <div className="space-y-2">
                                    {columnErrors.map((error, idx) => {
                                      if (error.includes('Invalid columns found:')) {
                                        // Parse the invalid columns with their suggestions
                                        const colonIndex = error.indexOf(':');
                                        const columnsText = colonIndex !== -1 ? error.substring(colonIndex + 1) : error;
                                        
                                        // Split by commas but not within parentheses
                                        const columnParts = columnsText.match(/[^,]+\([^)]+\)|[^,]+/g) || [];
                                        
                                        return (
                                          <div key={idx}>
                                            <p className="text-orange-700 text-xs font-medium mb-1">Invalid columns detected:</p>
                                            <ul className="list-disc list-inside text-orange-600 text-xs space-y-1 ml-2">
                                              {columnParts.map((part, i) => {
                                                const cleanPart = part.trim();
                                                const match = cleanPart.match(/^'([^']+)'\s*\(([^)]+)\)$/);
                                                if (match) {
                                                  return (
                                                    <li key={i}>
                                                      <span className="font-medium">{match[1]}</span>
                                                      <span className="text-orange-500"> - {match[2]}</span>
                                                    </li>
                                                  );
                                                } else {
                                                  // Handle simple column names without suggestions
                                                  const simpleMatch = cleanPart.match(/^'([^']+)'$/);
                                                  if (simpleMatch) {
                                                    return <li key={i}><span className="font-medium">{simpleMatch[1]}</span></li>;
                                                  }
                                                  return <li key={i}>{cleanPart}</li>;
                                                }
                                              })}
                                            </ul>
                                          </div>
                                        );
                                      } else if (error.includes('Expected columns')) {
                                        // Parse expected columns
                                        const colonIndex = error.indexOf(':');
                                        const columnsText = colonIndex !== -1 ? error.substring(colonIndex + 1) : error.replace('Expected columns are', '');
                                        
                                        // Split required and optional columns
                                        const requiredMatch = columnsText.match(/([^(]+)\(required\)/);
                                        const optionalMatch = columnsText.match(/and\s+([^(]+)\(optional\)/);
                                        
                                        return (
                                          <div key={idx} className="text-orange-600 text-xs mt-2">
                                            <p className="font-medium mb-1">Expected columns:</p>
                                            {requiredMatch && (
                                              <div className="mb-1">
                                                <span className="font-medium text-red-600">Required: </span>
                                                <span className="text-orange-500">{requiredMatch[1].trim()}</span>
                                              </div>
                                            )}
                                            {optionalMatch && (
                                              <div>
                                                <span className="font-medium text-gray-600">Optional: </span>
                                                <span className="text-orange-500">{optionalMatch[1].trim()}</span>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      } else if (error.includes('Missing required columns')) {
                                        const colonIndex = error.indexOf(':');
                                        const missingCols = colonIndex !== -1 ? error.substring(colonIndex + 1).trim() : error;
                                        return (
                                          <div key={idx}>
                                            <p className="text-red-700 text-xs font-medium">Missing required columns:</p>
                                            <p className="text-red-600 text-xs ml-2">{missingCols}</p>
                                          </div>
                                        );
                                      }
                                      return (
                                        <p key={idx} className="text-orange-700 text-xs">• {error}</p>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Other errors */}
                              {otherErrors.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border-l-4 border-gray-500">
                                  <p className="text-gray-800 font-medium text-sm mb-2">Other Issues</p>
                                  <div className="space-y-1">
                                    {otherErrors.map((error, idx) => (
                                      <p key={idx} className="text-gray-700 text-xs">• {error}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Quick fixes section */}
                              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                <p className="text-blue-800 font-medium text-sm mb-2">💡 Quick Fixes</p>
                                <div className="space-y-3 text-xs">
                                  {error.includes("Missing required field 'Burst'") && (
                                    <div className="bg-white rounded p-2 border border-blue-200">
                                      <p className="text-blue-700 font-medium mb-1">1. Add Missing 'Burst' Column:</p>
                                      <p className="text-blue-600">Create a column named 'Burst' with positive integer values (1, 2, 3, etc.)</p>
                                      <p className="text-blue-500 text-xs mt-1">Example: 1 for first burst, 2 for second burst, etc.</p>
                                    </div>
                                  )}
                                  
                                  {error.includes("Total R1+ is mandatory") && (
                                    <div className="bg-white rounded p-2 border border-blue-200">
                                      <p className="text-blue-700 font-medium mb-1">2. Add 'Total R1+' Values for Digital Campaigns:</p>
                                      <p className="text-blue-600">Add a column named 'Total R1+' with percentage values (0-100)</p>
                                      <p className="text-blue-500 text-xs mt-1">Required for: PM & FF, Influencers Amplification, Other Digital</p>
                                    </div>
                                  )}
                                  
                                  {(error.includes("'Media'") || error.includes("'Budget'")) && (
                                    <div className="bg-white rounded p-2 border border-blue-200">
                                      <p className="text-blue-700 font-medium mb-1">3. Fix Column Names:</p>
                                      <table className="mt-1 text-blue-600">
                                        <tbody>
                                          <tr>
                                            <td className="pr-3">Current</td>
                                            <td className="font-medium">→ Correct</td>
                                          </tr>
                                          <tr>
                                            <td className="pr-3">'Media'</td>
                                            <td className="font-medium">→ 'Media Type'</td>
                                          </tr>
                                          <tr>
                                            <td className="pr-3">'Budget'</td>
                                            <td className="font-medium">→ 'Total Budget'</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                  
                                  {(error.includes("Target Reach") || error.includes("Current Reach")) && (
                                    <div className="bg-white rounded p-2 border border-blue-200">
                                      <p className="text-blue-700 font-medium mb-1">4. Remove Unnecessary Columns:</p>
                                      <p className="text-blue-600">Delete these columns (they belong in Media Sufficiency, not Game Plans):</p>
                                      <ul className="list-disc list-inside text-blue-500 ml-2 mt-1">
                                        <li>'Target Reach'</li>
                                        <li>'Current Reach'</li>
                                      </ul>
                                    </div>
                                  )}
                                  
                                  <div className="mt-3 pt-3 border-t border-blue-300">
                                    <p className="text-blue-700 font-medium">Need the template?</p>
                                    <a 
                                      href="/templates/game-plans-template.csv" 
                                      download
                                      className="inline-flex items-center mt-1 text-blue-600 hover:text-blue-700 underline"
                                    >
                                      Download Game Plans Template CSV
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                    
                    {/* Show partial import results if any */}
                    {importResults && (importResults.successful > 0 || importResults.failed > 0) && (
                      <div className="bg-white rounded-lg p-4 border border-red-200 mb-4">
                        <h4 className="font-medium text-red-800 mb-2">Partial Import Results</h4>
                        <div className="text-sm text-red-700 space-y-1">
                          <p>• Total Records Processed: {importResults.processed || 0}</p>
                          <p>• Successfully Imported: {importResults.successful || 0}</p>
                          <p>• Failed Records: {importResults.failed || 0}</p>
                          {importResults.failedRows && importResults.failedRows.length > 0 && (
                            <p>• Failed Rows: {importResults.failedRows.slice(0, 10).join(', ')}{importResults.failedRows.length > 10 ? '...' : ''}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm font-medium mb-2">How to Fix Common Issues:</p>
                      <ul className="text-yellow-700 text-sm space-y-1">
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span><strong>Missing Total R1+:</strong> Add values in the "Total R1+" column for all digital media types (Display, Other Digital, etc.)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span><strong>Column Name Issues:</strong> Use exact column names from the template (e.g., "Total R1+" not "Reach 1+")</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span><strong>Sub-region Mismatch:</strong> Ensure sub-regions match the selected country</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">•</span>
                          <span><strong>Date Format:</strong> Use YYYY-MM-DD format (e.g., 2025-01-15)</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-yellow-300">
                        <a 
                          href="/templates/game-plans-template.csv" 
                          download 
                          className="text-yellow-800 underline text-sm font-medium hover:text-yellow-900"
                        >
                          Download the correct template →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleImport}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  <div className="flex items-center justify-center">
                    <FiDatabase className="h-5 w-5 mr-2" />
                    Try Again
                  </div>
                </button>
                <button
                  onClick={() => {
                    setImportStatus('idle');
                    setImportResults(null);
                    setError(null);
                  }}
                  className="px-6 py-3 bg-white text-blue-600 border border-blue-300 rounded-md font-medium hover:bg-blue-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}