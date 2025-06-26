'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiAlertCircle, FiCheckCircle, FiAlertTriangle, FiInfo, FiDownload } from 'react-icons/fi';

interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: any;
}

interface SessionData {
  sessionId: string;
  fileName: string;
  totalRecords: number;
  records: any[];
  validationIssues?: ValidationIssue[];
  validationSummary?: {
    total: number;
    critical: number;
    warning: number;
    suggestion: number;
    uniqueRows: number;
  };
}

interface ReachPlanningGridProps {
  sessionId: string;
}

export default function ReachPlanningGrid({ sessionId }: ReachPlanningGridProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reach-planning/session?sessionId=${sessionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load session data');
      }
      
      const result = await response.json();
      setSessionData(result.session);
    } catch (error: any) {
      console.error('Error loading session data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <FiAlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'suggestion':
        return <FiInfo className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { className: 'bg-red-100 text-red-800', label: 'Critical' },
      warning: { className: 'bg-yellow-100 text-yellow-800', label: 'Warning' },
      suggestion: { className: 'bg-blue-100 text-blue-800', label: 'Suggestion' }
    };
    
    const { className, label } = config[severity as keyof typeof config] || config.suggestion;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {getSeverityIcon(severity)}
        <span className="ml-1">{label}</span>
      </span>
    );
  };

  const filteredIssues = sessionData?.validationIssues?.filter(issue => {
    const matchesSearch = !searchTerm || 
      issue.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.columnName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.currentValue?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  }) || [];

  const paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredIssues.length / rowsPerPage);

  const handleImport = async () => {
    if (!sessionId) return;
    
    try {
      setImporting(true);
      const response = await fetch('/api/admin/reach-planning/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          uploadedBy: 'admin' // This should come from user context
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
      
      const result = await response.json();
      setImportSuccess(true);
      
    } catch (error: any) {
      console.error('Import error:', error);
      setError(error.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadCSV = () => {
    if (!sessionData?.validationIssues) return;
    
    const csvHeaders = ['Row', 'Column', 'Severity', 'Message', 'Current Value'];
    const csvRows = sessionData.validationIssues.map(issue => [
      issue.rowIndex + 1,
      issue.columnName,
      issue.severity,
      issue.message,
      issue.currentValue || ''
    ]);
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-issues-${sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <FiAlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <FiInfo className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <div className="text-sm text-blue-800">No session data found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      {sessionData.validationSummary && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Validation Summary</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {sessionData.validationSummary.critical}
                </div>
                <div className="text-sm text-red-700">Critical Issues</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {sessionData.validationSummary.warning}
                </div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionData.validationSummary.suggestion}
                </div>
                <div className="text-sm text-blue-700">Suggestions</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {sessionData.validationSummary.uniqueRows}
                </div>
                <div className="text-sm text-gray-700">Affected Rows</div>
              </div>
            </div>
            
            {sessionData.validationSummary.critical === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div className="flex">
                    <FiCheckCircle className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <div className="text-sm text-green-800">
                        All validation checks passed! The data is ready for import.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={importing || importSuccess}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      importSuccess 
                        ? 'bg-gray-100 text-green-700 cursor-not-allowed'
                        : importing
                        ? 'bg-green-400 text-white cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Importing...
                      </>
                    ) : importSuccess ? (
                      <>
                        <FiCheckCircle className="h-4 w-4 mr-2" />
                        Import Complete
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="h-4 w-4 mr-2" />
                        Import to Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <div className="text-sm text-red-800">
                      {sessionData.validationSummary.critical} critical issues must be resolved before import.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Issues */}
      {sessionData.validationIssues && sessionData.validationIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Validation Issues</h3>
              <button
                onClick={downloadCSV}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiDownload className="h-4 w-4 mr-2" />
                Export Issues
              </button>
            </div>
          </div>
          <div className="p-6">
            {/* Filters */}
            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="w-48">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="warning">Warnings Only</option>
                  <option value="suggestion">Suggestions Only</option>
                </select>
              </div>
            </div>

            {/* Issues Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedIssues.map((issue, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{issue.rowIndex + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{issue.columnName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getSeverityBadge(issue.severity)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{issue.message}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {issue.currentValue || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                  {Math.min(currentPage * rowsPerPage, filteredIssues.length)} of{' '}
                  {filteredIssues.length} issues
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Preview with Validation Issues */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Data Preview with Validation Issues</h3>
          <p className="text-sm text-gray-500 mt-1">
            Cells with validation issues are highlighted. Hover over highlighted cells to see the issue details.
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: 'max-content' }}>
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200 min-w-16">
                    Row
                  </th>
                  {sessionData.records && sessionData.records[0] && Object.keys(sessionData.records[0]).map((header) => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-32">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessionData.records?.slice(0, 20).map((record, rowIndex) => {
                  const rowIssues = sessionData.validationIssues?.filter(issue => issue.rowIndex === rowIndex) || [];
                  return (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 min-w-16">
                        {rowIndex + 1}
                      </td>
                      {Object.keys(record).map((header) => {
                        const cellIssue = rowIssues.find(issue => issue.columnName === header);
                        const cellValue = record[header] || '-';
                        
                        return (
                          <td 
                            key={header} 
                            className={`px-4 py-3 text-sm whitespace-nowrap relative min-w-32 ${
                              cellIssue 
                                ? cellIssue.severity === 'critical' 
                                  ? 'bg-red-100 text-red-900 border-l-4 border-red-500' 
                                  : cellIssue.severity === 'warning'
                                  ? 'bg-yellow-100 text-yellow-900 border-l-4 border-yellow-500'
                                  : 'bg-blue-100 text-blue-900 border-l-4 border-blue-500'
                                : 'text-gray-900'
                            }`}
                            title={cellIssue ? `${cellIssue.severity.toUpperCase()}: ${cellIssue.message}` : cellValue.length > 20 ? cellValue : undefined}
                          >
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
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
            <p>
              Showing first {Math.min(20, sessionData.records?.length || 0)} of {sessionData.totalRecords} records
            </p>
            <p className="text-xs">
              💡 Scroll horizontally to see all {sessionData.records && sessionData.records[0] ? Object.keys(sessionData.records[0]).length : 0} columns
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}