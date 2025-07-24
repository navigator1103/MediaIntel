'use client';

import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiAlertTriangle, FiInfo, FiRefreshCw } from 'react-icons/fi';

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
  country?: string;
  businessUnit?: string;
  status?: string;
}

interface ShareOfVoiceGridProps {
  sessionId: string;
}

// SOV template columns - supports both TV and Digital
const SOV_TEMPLATE_COLUMNS = [
  'Category',
  'Company', 
  'Total TV Investment',
  'Total TV TRPs',
  'Total Digital Spend',
  'Total Digital Impressions'
];

export default function ShareOfVoiceGrid({ sessionId }: ShareOfVoiceGridProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, columnName: string} | null>(null);
  const [editValue, setEditValue] = useState('');

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
      console.log(`Loading SOV session data for sessionId: ${sessionId}`);
      
      const response = await fetch(`/api/admin/share-of-voice/session?sessionId=${sessionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load session data');
      }
      
      const result = await response.json();
      console.log('SOV Session data loaded:', {
        totalRecords: result.session?.totalRecords,
        validationIssues: result.session?.validationIssues?.length || 0,
        validationSummary: result.session?.validationSummary,
        country: result.session?.country,
        businessUnit: result.session?.businessUnit
      });
      
      setSessionData(result.session);
      
    } catch (error: any) {
      console.error('Error loading SOV session data:', error);
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
    
    return SOV_TEMPLATE_COLUMNS.some(templateCol => {
      const normalizedTemplate = normalize(templateCol);
      return normalizedTemplate === normalizedColumn;
    });
  };

  const handleImport = async () => {
    if (!sessionId) return;
    
    try {
      setImporting(true);
      const response = await fetch('/api/admin/share-of-voice/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          sessionId,
          uploadedBy: 'admin' // This should come from user context
        })
      });
      
      if (!response.ok) {
        console.error('Import API Response Status:', response.status, response.statusText);
        const responseText = await response.text();
        console.error('Import API Raw Response:', responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: `Non-JSON response: ${responseText}` };
        }
        
        console.error('Import API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
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

  const handleCellClick = (rowIndex: number, columnName: string, currentValue: any) => {
    setEditingCell({ rowIndex, columnName });
    setEditValue(currentValue || '');
  };

  const handleCellSave = () => {
    if (!editingCell || !sessionData) return;
    
    // Update the record in local state
    const updatedRecords = [...sessionData.records];
    updatedRecords[editingCell.rowIndex][editingCell.columnName] = editValue;
    
    setSessionData({
      ...sessionData,
      records: updatedRecords
    });
    
    setEditingCell(null);
    setEditValue('');
    
    // TODO: Save to session file and re-validate
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
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
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Share of Voice Validation Summary</h3>
              <p className="text-sm text-gray-500 mt-1">
                {sessionData.businessUnit} • {sessionData.country}
              </p>
            </div>
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
                        All validation checks passed! The SOV data is ready for import.
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
              All validation issues found in your uploaded SOV data. Critical issues must be fixed before import.
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
          <h3 className="text-lg font-medium text-gray-900">SOV Data Preview with Validation Issues</h3>
          <p className="text-sm text-gray-500 mt-1">
            Cells with validation issues are highlighted. Hover over highlighted cells to see the issue details.
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
                        {header}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessionData.records?.slice(0, 20).map((record, displayIndex) => {
                  const originalRowIndex = displayIndex;
                  const rowIssues = sessionData.validationIssues?.filter((issue: any) => issue.rowIndex === originalRowIndex) || [];
                  
                  return (
                    <tr key={displayIndex} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 min-w-16 z-10">
                        {originalRowIndex + 1}
                      </td>
                      {Object.keys(record).map((header) => {
                        const cellIssue = rowIssues.find((issue: any) => issue.columnName === header);
                        const cellValue = record[header] || '-';
                        const isCustomColumn = !isTemplateColumn(header);
                        
                        const isEditing = editingCell?.rowIndex === originalRowIndex && editingCell?.columnName === header;
                        
                        return (
                          <td 
                            key={header} 
                            className={`px-4 py-3 text-sm whitespace-nowrap relative min-w-32 cursor-pointer hover:bg-gray-50 ${
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
                            onClick={() => !isEditing && handleCellClick(originalRowIndex, header, cellValue)}
                          >
                            {isEditing ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCellSave();
                                    if (e.key === 'Escape') handleCellCancel();
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                                <button
                                  onClick={handleCellSave}
                                  className="text-green-600 hover:text-green-800"
                                  title="Save"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleCellCancel}
                                  className="text-red-600 hover:text-red-800"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
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
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-500">
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
    </div>
  );
}