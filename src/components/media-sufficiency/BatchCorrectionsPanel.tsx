import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiCheck, FiX, FiArrowRight } from 'react-icons/fi';
import { ValidationIssue } from './DataPreviewGrid';

// Helper function to show invisible differences between values
const getValueDifference = (value1: any, value2: any): string => {
  if (value1 === value2) return '';
  if (typeof value1 !== 'string' || typeof value2 !== 'string') return '';
  
  // Check for whitespace differences
  if (value1.trim() === value2.trim()) {
    return ' (whitespace difference)';
  }
  
  // Check for case differences
  if (value1.toLowerCase() === value2.toLowerCase()) {
    return ' (case difference)';
  }
  
  // Check for invisible characters
  const value1Chars = Array.from(value1).map(c => c.charCodeAt(0));
  const value2Chars = Array.from(value2).map(c => c.charCodeAt(0));
  
  if (value1Chars.length !== value2Chars.length) {
    return ` (length: ${value1Chars.length} vs ${value2Chars.length})`;
  }
  
  // Find the first differing character
  for (let i = 0; i < value1Chars.length; i++) {
    if (value1Chars[i] !== value2Chars[i]) {
      return ` (char at ${i}: ${value1Chars[i]} vs ${value2Chars[i]})`;
    }
  }
  
  return ' (unknown difference)';
};

interface BatchCorrectionsPanelProps {
  validationIssues: ValidationIssue[];
  onApplyBatchCorrections: (corrections: BatchCorrection[]) => void;
}

export interface BatchCorrection {
  rowIndex: number;
  columnName: string;
  currentValue: any;
  newValue: any;
}

const BatchCorrectionsPanel: React.FC<BatchCorrectionsPanelProps> = ({
  validationIssues,
  onApplyBatchCorrections
}) => {
  const [suggestedCorrections, setSuggestedCorrections] = useState<BatchCorrection[]>([]);
  const [selectedCorrections, setSelectedCorrections] = useState<Set<string>>(new Set());
  const [groupedCorrections, setGroupedCorrections] = useState<{[key: string]: BatchCorrection[]}>({});
  
  // Generate suggested corrections from validation issues
  useEffect(() => {
    // Only process issues that have suggestions
    // Instead of filtering by suggestedValue, include all validation issues
    const corrections: BatchCorrection[] = validationIssues
      .map(issue => ({
        rowIndex: issue.rowIndex,
        columnName: issue.columnName,
        currentValue: issue.currentValue || '', // Use current value from the issue
        newValue: '' // Empty string as we no longer have suggestions
      }));
    
    setSuggestedCorrections(corrections);
    
    // Group corrections by column name for easier batch processing
    const grouped: {[key: string]: BatchCorrection[]} = {};
    corrections.forEach(correction => {
      if (!grouped[correction.columnName]) {
        grouped[correction.columnName] = [];
      }
      grouped[correction.columnName].push(correction);
    });
    
    setGroupedCorrections(grouped);
  }, [validationIssues]);
  
  // Toggle selection of a correction
  const toggleCorrection = (key: string) => {
    const newSelected = new Set(selectedCorrections);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCorrections(newSelected);
  };
  
  // Toggle selection of all corrections in a group
  const toggleGroupCorrections = (columnName: string, corrections: BatchCorrection[]) => {
    const newSelected = new Set(selectedCorrections);
    const allSelected = corrections.every(c => {
      // Generate unique key for each correction
      const key = `${c.rowIndex}-${c.columnName}-${corrections.indexOf(c)}`;
      return newSelected.has(key);
    });
    
    corrections.forEach((correction, index) => {
      // Generate unique key for each correction
      const key = `${correction.rowIndex}-${correction.columnName}-${index}`;
      if (allSelected) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
    });
    
    setSelectedCorrections(newSelected);
  };
  
  // Apply selected corrections
  const applySelectedCorrections = () => {
    const correctionsToApply = suggestedCorrections.filter((correction, index) => {
      // Generate unique key for each correction
      const key = `${correction.rowIndex}-${correction.columnName}-${index}`;
      return selectedCorrections.has(key);
    });
    
    if (correctionsToApply.length > 0) {
      onApplyBatchCorrections(correctionsToApply);
      
      // Clear selections after applying
      setSelectedCorrections(new Set());
    }
  };
  
  // Select all corrections
  const selectAllCorrections = () => {
    const allKeys = new Set<string>();
    suggestedCorrections.forEach((correction, index) => {
      // Generate unique key for each correction
      allKeys.add(`${correction.rowIndex}-${correction.columnName}-${index}`);
    });
    setSelectedCorrections(allKeys);
  };
  
  // Clear all selections
  const clearAllSelections = () => {
    setSelectedCorrections(new Set());
  };
  
  // Get severity icon for a column group based on the most severe issue
  const getGroupSeverityIcon = (corrections: BatchCorrection[]) => {
    const severities = validationIssues
      .filter(issue => 
        corrections.some(c => c.rowIndex === issue.rowIndex && c.columnName === issue.columnName)
      )
      .map(issue => issue.severity);
    
    if (severities.includes('critical')) {
      return <FiAlertCircle className="text-red-500" />;
    } else if (severities.includes('warning')) {
      return <FiAlertTriangle className="text-yellow-500" />;
    } else {
      return <FiInfo className="text-blue-500" />;
    }
  };
  
  // Count corrections by severity
  const getCorrectionCounts = () => {
    const counts = {
      total: suggestedCorrections.length,
      critical: 0,
      warning: 0,
      suggestion: 0
    };
    
    // Count all validation issues instead of just those with suggestions
    validationIssues.forEach(issue => {
      counts[issue.severity]++;
    });
    
    return counts;
  };
  
  const correctionCounts = getCorrectionCounts();
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-indigo-50 p-4 border-b border-indigo-100">
        <h3 className="text-lg font-medium text-indigo-800 flex items-center">
          <FiCheckCircle className="mr-2" />
          Validation Issues ({correctionCounts.total})
        </h3>
        <p className="text-sm text-indigo-600 mt-1">
          Select the corrections you want to apply and click "Apply Selected Corrections"
        </p>
        
        <div className="flex items-center mt-3 text-sm">
          <span className="flex items-center mr-4">
            <FiAlertCircle className="text-red-500 mr-1" />
            Critical: {correctionCounts.critical}
          </span>
          <span className="flex items-center mr-4">
            <FiAlertTriangle className="text-yellow-500 mr-1" />
            Warnings: {correctionCounts.warning}
          </span>
          <span className="flex items-center">
            <FiInfo className="text-blue-500 mr-1" />
            Suggestions: {correctionCounts.suggestion}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div>
            <button
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 mr-2 text-sm"
              onClick={selectAllCorrections}
            >
              Select All
            </button>
            <button
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              onClick={clearAllSelections}
            >
              Clear Selection
            </button>
          </div>
          
          <button
            className={`px-4 py-1 rounded-md text-white text-sm ${
              selectedCorrections.size > 0 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={applySelectedCorrections}
            disabled={selectedCorrections.size === 0}
          >
            Apply {selectedCorrections.size} Selected Corrections
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCorrections).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedCorrections).map(([columnName, corrections]) => (
                <div key={columnName} className="border rounded-md overflow-hidden">
                  <div 
                    className="flex items-center justify-between bg-gray-50 p-3 cursor-pointer"
                    onClick={() => toggleGroupCorrections(columnName, corrections)}
                  >
                    <div className="flex items-center">
                      {getGroupSeverityIcon(corrections)}
                      <span className="ml-2 font-medium">{columnName}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({corrections.length} {corrections.length === 1 ? 'correction' : 'corrections'})
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 rounded"
                        checked={corrections.every((c, index) => 
                          selectedCorrections.has(`${c.rowIndex}-${c.columnName}-${index}`)
                        )}
                        onChange={() => toggleGroupCorrections(columnName, corrections)}
                      />
                    </div>
                  </div>
                  
                  <div className="divide-y">
                    {corrections.map((correction, index) => {
                      // Generate unique key for each correction using index
                      const key = `${correction.rowIndex}-${correction.columnName}-${index}`;
                      const issue = validationIssues.find(
                        i => i.rowIndex === correction.rowIndex && i.columnName === correction.columnName
                      );
                      
                      return (
                        <div 
                          key={key}
                          className={`p-3 flex items-start hover:bg-gray-50 ${
                            selectedCorrections.has(key) ? 'bg-indigo-50' : ''
                          }`}
                          onClick={() => toggleCorrection(key)}
                        >
                          <div className="flex-shrink-0 pt-0.5">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 rounded"
                              checked={selectedCorrections.has(key)}
                              onChange={() => toggleCorrection(key)}
                            />
                          </div>
                          
                          <div className="ml-3 flex-grow">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Row {correction.rowIndex + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                issue?.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                issue?.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {issue?.severity}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1">{issue?.message}</p>
                            
                            <div className="mt-2 flex items-center text-sm">
                              <div className="bg-red-50 px-2 py-1 rounded text-red-700 line-through mr-2">
                                {issue?.currentValue === '' ? '(empty)' : 
                                 issue?.currentValue === null ? '(null)' :
                                 issue?.currentValue === undefined ? '(undefined)' :
                                 typeof issue?.currentValue === 'number' && Number.isNaN(issue?.currentValue) ? '(NaN)' :
                                 `"${String(issue?.currentValue || '')}"` }
                              </div>
                              <FiArrowRight className="text-gray-400 mx-1" />
                              <div className="bg-green-50 px-2 py-1 rounded text-green-700">
                                {correction.newValue === '' ? '(empty)' : 
                                 correction.newValue === null ? '(null)' :
                                 correction.newValue === undefined ? '(undefined)' :
                                 typeof correction.newValue === 'number' && Number.isNaN(correction.newValue) ? '(NaN)' :
                                 `"${String(correction.newValue || '')}"` }
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No suggested corrections available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchCorrectionsPanel;
