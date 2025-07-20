'use client';

import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiAlertTriangle, FiInfo, FiPlus, FiRefreshCw } from 'react-icons/fi';

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

// Standard template columns
const TEMPLATE_COLUMNS = [
  'Last Update', 'Sub Region', 'Country', 'BU', 'Category', 'Range', 'Campaign',
  'TV Demo Gender', 'TV Demo Min. Age', 'TV Demo Max. Age', 'TV SEL', 
  'Final TV Target (don\'t fill)', 'TV Target Size', 'TV Copy Length',
  'Total TV Planned R1+ (%)', 'Total TV Planned R3+ (%)', 'TV Potential R1+',
  'CPP 2024', 'CPP 2025', 'CPP 2026', 'Reported Currency',
  'Is Digital target the same than TV?', 'Digital Demo Gender', 'Digital Demo Min. Age', 
  'Digital Demo Max. Age', 'Digital SEL', 'Final Digital Target (don\'t fill)',
  'Digital Target Size (Abs)', 'Total Digital Planned R1+', 'Total Digital Potential R1+',
  'Planned Combined Reach', 'Combined Potential Reach'
];

export default function ReachPlanningGrid({ sessionId }: ReachPlanningGridProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  // Force reload when component becomes visible
  useEffect(() => {
    // Add a small delay to ensure the validation has completed
    const timer = setTimeout(() => {
      loadSessionData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      console.log(`Loading session data for sessionId: ${sessionId}`);
      
      const response = await fetch(`/api/admin/reach-planning/session?sessionId=${sessionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load session data');
      }
      
      const result = await response.json();
      console.log('Session data loaded:', {
        totalRecords: result.session?.totalRecords,
        validationIssues: result.session?.validationIssues?.length || 0,
        validationSummary: result.session?.validationSummary
      });
      
      setSessionData(result.session);
      
      // Debug validation issues
      if (result.session?.validationSummary) {
        console.log('=== VALIDATION DEBUG ===');
        console.log('Summary total:', result.session.validationSummary.total);
        console.log('Issues array exists:', !!result.session.validationIssues);
        console.log('Issues array length:', result.session.validationIssues?.length || 0);
        console.log('Issues is array:', Array.isArray(result.session.validationIssues));
        if (result.session.validationIssues && result.session.validationIssues.length > 0) {
          console.log('First 3 issues:', result.session.validationIssues.slice(0, 3));
          console.log('All column names with issues:', 
            [...new Set(result.session.validationIssues.map((i: any) => i.columnName))]);
        }
        console.log('======================');
      }
      
      // If validation issues are empty but summary shows issues, retry loading
      if (result.session?.validationSummary?.total > 0 && 
          (!result.session?.validationIssues || result.session.validationIssues.length === 0) && 
          retryCount < 3) {
        console.log('Validation issues mismatch detected, retrying...');
        setRetryCount(prev => prev + 1);
        setTimeout(() => loadSessionData(), 1000);
      }
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

  const isTemplateColumn = (columnName: string): boolean => {
    // Normalize both strings by removing extra spaces, punctuation, and making lowercase
    const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    const normalizedColumn = normalize(columnName);
    
    return TEMPLATE_COLUMNS.some(templateCol => {
      const normalizedTemplate = normalize(templateCol);
      return normalizedTemplate === normalizedColumn;
    });
  };


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
      {/* Debug: Show validation status */}
      {sessionData && (
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          Debug: Status={sessionData.status}, Issues={sessionData.validationIssues?.length || 0}, Summary={sessionData.validationSummary?.total || 0}
        </div>
      )}
      
      {/* Show loading indicator if validation might be in progress */}
      {sessionData && sessionData.status === 'uploaded' && !sessionData.validationSummary && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin h-5 w-5 mr-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <div className="text-sm text-blue-800">
              Validation in progress... The validation grid will update automatically when complete.
            </div>
          </div>
        </div>
      )}
      
      {/* Validation Summary */}
      {sessionData.validationSummary && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Validation Summary</h3>
            <button
              onClick={() => loadSessionData()}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              title="Refresh validation data"
            >
              <FiRefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
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


      {/* Detailed Issues List */}
      {sessionData.validationIssues && sessionData.validationIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Detailed Validation Issues</h3>
            <p className="text-sm text-gray-500 mt-1">
              All validation issues found in your uploaded data. Critical issues must be fixed before import.
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessionData.validationIssues.map((issue: ValidationIssue, index: number) => (
                <div 
                  key={index} 
                  className={`flex items-start p-3 rounded-lg border ${
                    issue.severity === 'critical' 
                      ? 'bg-red-50 border-red-200' 
                      : issue.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    {getSeverityIcon(issue.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getSeverityBadge(issue.severity)}
                      <span className="text-sm font-medium text-gray-900">
                        Row {issue.rowIndex + 1}, Column "{issue.columnName}"
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{issue.message}</p>
                    {issue.currentValue && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current value: "{issue.currentValue}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Preview with Validation Issues */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Data Preview with Validation Issues</h3>
          <p className="text-sm text-gray-500 mt-1">
            Cells with validation issues are highlighted. Hover over highlighted cells to see the issue details.
            {/* Debug info */}
            {sessionData.validationIssues && (
              <span className="ml-2 text-xs text-gray-400">
                ({sessionData.validationIssues.length} issues loaded)
              </span>
            )}
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-lg relative">
            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: 'max-content' }}>
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-200 min-w-16 z-20">
                    Row
                  </th>
                  {sessionData.records && sessionData.records[0] && Object.keys(sessionData.records[0]).map((header) => {
                    const isCustomColumn = !isTemplateColumn(header);
                    return (
                      <th 
                        key={header} 
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap min-w-32 ${
                          isCustomColumn 
                            ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-300' 
                            : 'bg-gray-50 text-gray-500'
                        }`}
                        title={isCustomColumn ? 'Custom column - not in standard template' : undefined}
                      >
                        <div className="flex items-center gap-1">
                          {isCustomColumn && <FiPlus className="h-3 w-3" />}
                          {header}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessionData.records?.slice(0, 20).map((record, displayIndex) => {
                  // Use the actual original row index for validation issue matching
                  const originalRowIndex = displayIndex; // For now, assuming no offset
                  const rowIssues = sessionData.validationIssues?.filter((issue: any) => issue.rowIndex === originalRowIndex) || [];
                  
                  // Debug logging
                  if (displayIndex === 0) {
                    console.log(`Row ${originalRowIndex} validation check:`, {
                      totalIssues: sessionData.validationIssues?.length || 0,
                      rowIssues: rowIssues.length,
                      firstIssue: rowIssues[0]
                    });
                  }
                  
                  return (
                    <tr key={displayIndex} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 min-w-16 z-10">
                        {originalRowIndex + 1}
                      </td>
                      {Object.keys(record).map((header) => {
                        const cellIssue = rowIssues.find((issue: any) => issue.columnName === header);
                        const cellValue = record[header] || '-';
                        const isCustomColumn = !isTemplateColumn(header);
                        
                        // Debug logging for specific cells
                        if (displayIndex === 0 && cellIssue) {
                          console.log(`Cell ${header} has issue:`, cellIssue);
                        }
                        
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
                                : isCustomColumn
                                ? 'bg-purple-50 text-gray-900'
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
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <p>
                Showing first {Math.min(20, sessionData.records?.length || 0)} of {sessionData.totalRecords} records
              </p>
              <p className="text-xs">
                💡 Scroll horizontally to see all {sessionData.records && sessionData.records[0] ? Object.keys(sessionData.records[0]).length : 0} columns
              </p>
            </div>
            {sessionData.records && sessionData.records[0] && 
             Object.keys(sessionData.records[0]).some(header => !isTemplateColumn(header)) && (
              <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded-md">
                <FiPlus className="h-3 w-3" />
                <span>Purple highlighted columns are custom fields not in the standard template</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}