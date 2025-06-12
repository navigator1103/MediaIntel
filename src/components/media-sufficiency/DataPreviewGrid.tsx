import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiFilter, FiSearch, FiChevronLeft, FiChevronRight, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import debounce from 'lodash/debounce';

// Define the ValidationIssue interface locally
export interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: unknown;
}

// Define the ValidationSummary interface
export interface ValidationSummary {
  critical: number;
  warning: number;
  suggestion: number;
  total: number;
}

// Define the ImportProgress interface
export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  stage: string;
}

interface DataPreviewGridProps {
  data: any[];
  validationIssues?: ValidationIssue[];
  onDataChange?: (data: any[]) => void;
  onCellEdit?: (rowIndex: number, columnName: string, newValue: any) => void;
  highlightedCell?: { rowIndex: number; columnName: string } | null;
  validationStatus?: 'idle' | 'validating' | 'in-progress' | 'success' | 'error';
  validationProgress?: number;
  validationSummary?: ValidationSummary | null;
  importStatus?: 'idle' | 'importing' | 'success' | 'error';
  importProgress?: ImportProgress;
  importErrors?: Array<{ message: string }>;
  onImport?: () => Promise<void> | void;
  canImport?: boolean;
}

const DataPreviewGrid: React.FC<DataPreviewGridProps> = ({ 
  data = [], 
  validationIssues = [], 
  onDataChange,
  onCellEdit,
  highlightedCell,
  validationStatus = 'idle',
  validationProgress = 0,
  validationSummary = null,
  importStatus = 'idle',
  importProgress = { current: 0, total: 0, percentage: 0, stage: 'Not started' },
  importErrors = [],
  onImport,
  canImport = false
}) => {
  // Initialize state
  const [gridData, setGridData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnName: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string[]>(['critical', 'warning', 'suggestion']);
  const [showOnlyIssues, setShowOnlyIssues] = useState<boolean>(false);

  // Reference for the highlighted cell
  const highlightedCellRef = React.useRef<HTMLDivElement | null>(null);
  
  // References for scroll synchronization
  const headerRef = useRef<HTMLDivElement>(null);
  const listOuterRef = useRef<HTMLDivElement>(null);
  
  // Handle scroll synchronization
  useEffect(() => {
    const listOuter = listOuterRef.current;
    const header = headerRef.current;
    
    if (!listOuter || !header) return;
    
    // Flag to prevent infinite scroll loop
    let isScrolling = false;
    
    const handleListScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      header.scrollLeft = listOuter.scrollLeft;
      isScrolling = false;
    };
    
    const handleHeaderScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      listOuter.scrollLeft = header.scrollLeft;
      isScrolling = false;
    };
    
    listOuter.addEventListener('scroll', handleListScroll);
    header.addEventListener('scroll', handleHeaderScroll);
    
    return () => {
      listOuter.removeEventListener('scroll', handleListScroll);
      header.removeEventListener('scroll', handleHeaderScroll);
    };
  }, []);

  // Effect to handle highlighted cell scrolling and pagination
  useEffect(() => {
    if (highlightedCell) {
      // Calculate which page the highlighted cell is on
      const targetPage = Math.floor(highlightedCell.rowIndex / rowsPerPage) + 1;
      
      // Set the page to show the highlighted cell
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
      
      // Scroll to the highlighted cell after a short delay to ensure rendering
      setTimeout(() => {
        if (highlightedCellRef.current) {
          highlightedCellRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }
      }, 100);
    }
  }, [highlightedCell, currentPage, rowsPerPage]);
  
  // Initialize grid data and columns
  useEffect(() => {
    if (data && data.length > 0) {
      setGridData(data);
      setColumns(Object.keys(data[0]));
    }
  }, [data]);

  // Create a map of row indexes to their validation issues for faster lookup
  const rowToIssuesMap = React.useMemo(() => {
    const map = new Map<number, ValidationIssue[]>();
    validationIssues.forEach(issue => {
      if (!map.has(issue.rowIndex)) {
        map.set(issue.rowIndex, []);
      }
      map.get(issue.rowIndex)?.push(issue);
    });
    return map;
  }, [validationIssues]);

  // Apply filters, search, and pagination with performance optimizations using chunked processing
  useEffect(() => {
    // Log filtering parameters for debugging
    console.log('Filtering data with:', { 
      showOnlyIssues, 
      selectedSeverityFilter, 
      rowsWithIssues: Array.from(rowToIssuesMap.keys()).length,
      totalRows: gridData.length
    });
    
    // Set loading state when filtering starts
    setIsLoading(true);
    
    // Define chunk size for processing large datasets
    const CHUNK_SIZE = 1000;
    let filtered: any[] = [];
    let currentChunk = 0;
    
    // Create a copy of the grid data with original indices preserved
    const dataWithIndices = gridData.map((row, index) => ({ ...row, _originalIndex: index }));
    
    // Process data in chunks to prevent UI freezing
    const processNextChunk = () => {
      // Calculate chunk boundaries
      const startIndex = currentChunk * CHUNK_SIZE;
      const endIndex = Math.min(startIndex + CHUNK_SIZE, dataWithIndices.length);
      
      // Get current chunk of data
      const chunk = dataWithIndices.slice(startIndex, endIndex);
      
      // Process this chunk
      let filteredChunk = chunk;
      
      // Apply issue filtering if needed
      if (showOnlyIssues) {
        filteredChunk = filteredChunk.filter((row) => {
          const originalIndex = row._originalIndex;
          const rowIssues = rowToIssuesMap.get(originalIndex);
          
          if (!rowIssues || rowIssues.length === 0) {
            return false; // No issues for this row
          }
          
          // If severity filters are selected, check if any issue matches
          if (selectedSeverityFilter.length > 0) {
            return rowIssues.some(issue => selectedSeverityFilter.includes(issue.severity));
          }
          
          // If no severity filters selected, include all rows with any issues
          return true;
        });
      }
      
      // Apply search term filter
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredChunk = filteredChunk.filter(row => {
          for (const key in row) {
            if (key === '_originalIndex') continue; // Skip our internal field
            const value = row[key];
            if (value && String(value).toLowerCase().includes(lowerSearchTerm)) {
              return true;
            }
          }
          return false;
        });
      }
      
      // Add filtered chunk to results
      filtered = [...filtered, ...filteredChunk];
      
      // Check if we need to process more chunks
      currentChunk++;
      if (currentChunk * CHUNK_SIZE < dataWithIndices.length) {
        // Schedule next chunk with requestAnimationFrame for better UI responsiveness
        requestAnimationFrame(() => {
          // Update progress indicator if needed for very large datasets
          if (dataWithIndices.length > CHUNK_SIZE * 5) {
            const progress = Math.round((currentChunk * CHUNK_SIZE / dataWithIndices.length) * 100);
            console.log(`Processing data: ${progress}% complete`);
          }
          processNextChunk();
        });
      } else {
        // All chunks processed, now apply sorting
        if (sortConfig !== null) {
          console.log('Applying sorting...');
          filtered.sort((a: any, b: any) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            
            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
            
            // Compare values
            if (aValue < bValue) {
              return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
              return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
          });
        }
        
        // All data processed, update state and finish
        console.log(`Filtering complete: ${filtered.length} rows after filtering`);
        setFilteredData(filtered);
        
        // Calculate total pages
        const total = Math.ceil(filtered.length / rowsPerPage);
        setTotalPages(total || 1); // Ensure at least 1 page
        
        // Adjust current page if needed
        if (currentPage > total && total > 0) {
          setCurrentPage(1);
        }
        
        // Turn off loading state
        setIsLoading(false);
      }
    };
    
    // Start processing the first chunk
    processNextChunk();
    
    // Cleanup function
    return () => {
      // Nothing specific to clean up since we're using requestAnimationFrame
    };
  }, [gridData, searchTerm, selectedSeverityFilter, sortConfig, currentPage, rowsPerPage, validationIssues, showOnlyIssues, rowToIssuesMap]);
    
  // We've moved the sorting logic into the main filtering effect for better performance
  
  // Pagination is now handled in the main filtering effect for better performance

  // Get paginated data with memoization for better performance
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, rowsPerPage]);
  
  // Use this function to access the memoized data
  const getPaginatedData = React.useCallback(() => {
    return paginatedData;
  }, [paginatedData]);

  // Handle cell editing
  const handleCellClick = (rowIndex: number, columnName: string) => {
    setEditingCell({ rowIndex, columnName });
    setEditValue(gridData[rowIndex][columnName] || '');
  };

  const handleCellEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // Create a debounced version of the cell edit complete handler
  const debouncedCellEditComplete = useCallback(
    debounce(() => {
      if (editingCell) {
        const { rowIndex, columnName } = editingCell;
        
        // Only update if the value has actually changed
        if (gridData[rowIndex][columnName] !== editValue) {
          console.log(`Updating cell [${rowIndex}][${columnName}] from '${gridData[rowIndex][columnName]}' to '${editValue}'`);
          
          // Create a deep copy of the data to ensure React detects the change
          const updatedData = JSON.parse(JSON.stringify(gridData));
          updatedData[rowIndex] = { ...updatedData[rowIndex], [columnName]: editValue };
          
          // Update local state first
          setGridData(updatedData);
          
          // Call the callback if provided
          if (onCellEdit) {
            console.log('Calling onCellEdit callback');
            onCellEdit(rowIndex, columnName, editValue);
          }
          
          if (onDataChange) {
            console.log('Calling onDataChange callback');
            onDataChange(updatedData);
          }
        } else {
          console.log('Cell value unchanged, skipping update');
        }
        
        // Clear editing state regardless of whether value changed
        setEditingCell(null);
      }
    }, 500),
    [editingCell, editValue, gridData, onCellEdit, onDataChange]
  );

  const handleCellEditComplete = () => {
    debouncedCellEditComplete();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleCellEditComplete();
    } else if (e.key === 'Escape') {
      e.preventDefault(); // Prevent browser default
      setEditingCell(null);
    }
  };

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Create a memoized validation issue lookup map for faster access
  const validationIssueMap = React.useMemo(() => {
    const map = new Map();
    validationIssues.forEach(issue => {
      const key = `${issue.rowIndex}-${issue.columnName}`;
      map.set(key, issue);
    });
    return map;
  }, [validationIssues]);

  // Get cell validation status with optimized lookup
  const getCellValidation = React.useCallback((rowIndex: number, columnName: string) => {
    const key = `${rowIndex}-${columnName}`;
    return validationIssueMap.get(key);
  }, [validationIssueMap]);

  // Get cell background color based on validation status
  const getCellBackground = React.useCallback((rowIndex: number, columnName: string) => {
    const issue = getCellValidation(rowIndex, columnName);
    if (!issue) return 'bg-white';
    
    switch (issue.severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 border';
      case 'warning':
        return 'bg-yellow-50';
      case 'suggestion':
        return 'bg-blue-50';
      default:
        return 'bg-white';
    }
  }, [getCellValidation]);

  // Get cell icon based on validation status
  const getCellIcon = React.useCallback((rowIndex: number, columnName: string) => {
    const issue = getCellValidation(rowIndex, columnName);
    if (!issue) return null;
    
    switch (issue.severity) {
      case 'critical':
        return <FiAlertCircle className="text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="text-yellow-500" />;
      case 'suggestion':
        return <FiInfo className="text-blue-500" />;
      default:
        return null;
    }
  }, [getCellValidation]);

  // Toggle severity filter
  const toggleSeverityFilter = (severity: string) => {
    if (selectedSeverityFilter.includes(severity)) {
      setSelectedSeverityFilter(selectedSeverityFilter.filter(s => s !== severity));
    } else {
      setSelectedSeverityFilter([...selectedSeverityFilter, severity]);
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  // Count issues by severity
  const getIssueCounts = () => {
    const counts = validationIssues.reduce((counts, issue) => {
      const severity = issue.severity as 'critical' | 'warning' | 'suggestion';
      counts[severity]++;
      return counts;
    }, { critical: 0, warning: 0, suggestion: 0 });
    
    return counts;
  };

  const issueCounts = getIssueCounts();

  // Clean up debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedCellEditComplete.cancel();
    };
  }, [debouncedCellEditComplete]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOnlyIssues}
                onChange={() => {
                  // When toggling show only issues, reset to page 1
                  setCurrentPage(1);
                  setShowOnlyIssues(!showOnlyIssues);
                }}
                className="mr-2 h-4 w-4 text-indigo-600 rounded"
              />
              <span>Show only issues</span>
            </label>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Filter:</span>
            <button
              className={`px-2 py-1 rounded-md text-xs flex items-center ${
                selectedSeverityFilter.includes('critical') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => toggleSeverityFilter('critical')}
            >
              <FiAlertCircle className="mr-1" />
              Critical ({issueCounts.critical})
            </button>
            <button
              className={`px-2 py-1 rounded-md text-xs flex items-center ${
                selectedSeverityFilter.includes('warning') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => toggleSeverityFilter('warning')}
            >
              <FiAlertTriangle className="mr-1" />
              Warnings ({issueCounts.warning})
            </button>
            <button
              className={`px-2 py-1 rounded-md text-xs flex items-center ${
                selectedSeverityFilter.includes('suggestion') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => toggleSeverityFilter('suggestion')}
            >
              <FiInfo className="mr-1" />
              Suggestions ({issueCounts.suggestion})
            </button>
          </div>
        </div>
      </div>
      
      {/* Data Grid with synchronized horizontal scrolling */}
      <div className="border border-gray-200 rounded-md" style={{ height: 'calc(100vh - 300px)', position: 'relative' }}>
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
            <div className="flex flex-col items-center p-4 rounded-lg">
              <AiOutlineLoading3Quarters className="animate-spin text-blue-500 text-3xl mb-2" />
              <p className="text-gray-700 font-medium">Processing data...</p>
            </div>
          </div>
        )}
        {/* Fixed Header */}
        <div 
          ref={headerRef}
          className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 overflow-x-auto overflow-y-hidden"
          style={{ 
            width: '100%',
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex" style={{ width: 'fit-content', minWidth: '100%' }}>
            <div className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 flex-shrink-0 bg-gray-50">
              Row
            </div>
            {columns.filter(col => col !== '_originalIndex').map((column) => (
              <div
                key={column}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-gray-50"
                style={{ 
                  minWidth: '150px', 
                  maxWidth: '300px',
                  width: '150px',
                  flex: '1 0 150px'
                }}
                onClick={() => requestSort(column)}
              >
                <div className="flex items-center">
                  <span>{column}</span>
                  {sortConfig?.key === column && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        <div style={{ height: 'calc(100% - 48px)' }}> {/* Subtract header height */}
          <List
            height={Math.min(600 - 48, paginatedData.length * 40 + 20)} // Subtract header height
            itemCount={paginatedData.length}
            itemSize={40}
            width="100%"
            overscanCount={10} // Increase overscan for smoother scrolling
            outerRef={listOuterRef}
            className="overflow-auto"
            initialScrollOffset={0} // Reset scroll position when data changes
          >
            {({ index, style }: { index: number; style: React.CSSProperties }) => {
              const row = getPaginatedData()[index];
              if (!row) return null;
              
              // Get the original row index for validation lookups
              const originalRowIndex = row._originalIndex;
              
              return (
                <div 
                  style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                    width: 'fit-content',
                    minWidth: '100%'
                  }}
                  className="hover:bg-gray-50"
                >
                  <div className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 w-12 flex-shrink-0">
                    {originalRowIndex + 1}
                  </div>
                  
                  {columns.filter(col => col !== '_originalIndex').map((column) => (
                    <div
                      key={`${originalRowIndex}-${column}`}
                      ref={highlightedCell && highlightedCell.rowIndex === originalRowIndex && highlightedCell.columnName === column ? highlightedCellRef : null}
                      className={`px-4 py-2 text-sm ${getCellBackground(originalRowIndex, column)} ${highlightedCell && highlightedCell.rowIndex === originalRowIndex && highlightedCell.columnName === column ? 'ring-2 ring-indigo-500 animate-pulse' : ''} ${getCellValidation(originalRowIndex, column)?.severity === 'critical' ? 'text-red-700 font-medium' : ''}`}
                      style={{ 
                        minWidth: '150px', 
                        maxWidth: '300px', 
                        width: '150px',
                        flex: '1 0 150px',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => handleCellClick(originalRowIndex, column)}
                    >
                      {editingCell && editingCell.rowIndex === originalRowIndex && editingCell.columnName === column ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={handleCellEdit}
                          onBlur={handleCellEditComplete}
                          onKeyDown={handleKeyDown}
                          className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                          // Prevent click events from bubbling up to parent
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="flex-grow truncate">{row[column]}</span>
                          {getCellIcon(originalRowIndex, column) && (
                            <div className="ml-2 relative group flex-shrink-0">
                              {getCellIcon(originalRowIndex, column)}
                              <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-white border rounded-md shadow-lg -left-32 top-6">
                                <div className="text-xs font-medium mb-1">
                                  {getCellValidation(originalRowIndex, column)?.severity?.toUpperCase() || ''}
                                </div>
                                <div className="text-xs mb-2">
                                  {getCellValidation(originalRowIndex, column)?.message || ''}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            }}
          </List>
        </div>
      </div>
      
      {/* Validation and Import Status */}
      {(validationStatus !== 'idle' || importStatus !== 'idle') && (
        <div className="px-4 py-3 border-t border-gray-200">
          {/* Validation Status */}
          {(validationStatus === 'validating' || validationStatus === 'in-progress') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <AiOutlineLoading3Quarters className="text-blue-500 mr-2 animate-spin" />
                <span className="text-blue-700">Validating data...</span>
              </div>
              {validationStatus === 'in-progress' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${validationProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 text-right">
                    {validationProgress}% complete
                  </div>
                </div>
              )}
            </div>
          )}

          {validationStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" />
                <span className="text-red-700">Validation error occurred</span>
              </div>
            </div>
          )}

          {validationStatus === 'success' && validationSummary && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="font-medium mb-2">Validation Summary</h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <FiAlertCircle className="text-red-500 mr-1" />
                  <span className="text-red-700">{validationSummary.critical} Critical</span>
                </div>
                <div className="flex items-center">
                  <FiAlertTriangle className="text-yellow-500 mr-1" />
                  <span className="text-yellow-700">{validationSummary.warning} Warnings</span>
                </div>
                <div className="flex items-center">
                  <FiInfo className="text-blue-500 mr-1" />
                  <span className="text-blue-700">{validationSummary.suggestion} Suggestions</span>
                </div>
              </div>
            </div>
          )}

          {/* Import Status */}
          {importStatus === 'importing' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium mb-2">Import Progress</h4>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${importProgress.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{importProgress.stage}</span>
                <span>{importProgress.current} of {importProgress.total} ({importProgress.percentage}%)</span>
              </div>
            </div>
          )}

          {importStatus === 'error' && importErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="font-medium text-red-700 mb-2">Import Errors</h4>
              <ul className="list-disc pl-5 text-red-700">
                {importErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {importStatus === 'success' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <FiCheckCircle className="text-green-500 mr-2" />
                <span className="text-green-700">Data imported successfully!</span>
              </div>
            </div>
          )}

          {/* Import Button */}
          {validationStatus === 'success' && importStatus === 'idle' && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={onImport}
                disabled={!canImport}
                className={`px-4 py-2 rounded-md ${canImport
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                {canImport ? 'Import Data' : 'Fix Critical Issues to Import'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm text-gray-700 mr-2">
            Rows per page:
          </span>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-700 mr-4">
            {filteredData.length > 0 ? (
              <>
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} entries
              </>
            ) : (
              'No entries to show'
            )}
          </span>
          
          <div className="flex items-center space-x-2">
            <button
              className={`p-1 rounded-full ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous Page</span>
              <FiChevronLeft className="h-5 w-5" />
            </button>
            
            {/* Page number selector with quick jumps */}
            <div className="flex items-center space-x-1">
              {totalPages <= 7 ? (
                // Show all page numbers if there are 7 or fewer
                [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`px-2 py-1 text-sm rounded ${currentPage === i + 1 ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))
              ) : (
                // Show abbreviated page numbers for many pages
                <>
                  {/* First page */}
                  <button
                    className={`px-2 py-1 text-sm rounded ${currentPage === 1 ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}
                    onClick={() => handlePageChange(1)}
                  >
                    1
                  </button>
                  
                  {/* Ellipsis or page numbers */}
                  {currentPage > 3 && <span className="px-1">...</span>}
                  
                  {/* Pages around current page */}
                  {[...Array(5)].map((_, i) => {
                    const pageNum = Math.max(2, currentPage - 2) + i;
                    if (pageNum > 1 && pageNum < totalPages) {
                      return (
                        <button
                          key={pageNum}
                          className={`px-2 py-1 text-sm rounded ${currentPage === pageNum ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Ellipsis or page numbers */}
                  {currentPage < totalPages - 2 && <span className="px-1">...</span>}
                  
                  {/* Last page */}
                  <button
                    className={`px-2 py-1 text-sm rounded ${currentPage === totalPages ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              className={`p-1 rounded-full ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Next Page</span>
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPreviewGrid;