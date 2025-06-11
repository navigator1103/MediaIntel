import React, { useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiFilter, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

// Define the ValidationIssue interface locally
interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: unknown;
}

interface DataPreviewGridProps {
  data: any[];
  validationIssues?: ValidationIssue[];
  onDataChange?: (data: any[]) => void;
  onCellEdit?: (rowIndex: number, columnName: string, newValue: any) => void;
  highlightedCell?: { rowIndex: number; columnName: string } | null;
}

const DataPreviewGrid: React.FC<DataPreviewGridProps> = ({ 
  data = [], 
  validationIssues = [], 
  onDataChange,
  onCellEdit,
  highlightedCell 
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

  // Apply filters, search, and pagination with performance optimizations
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
    
    // Use setTimeout to prevent UI freezing
    const timeoutId = setTimeout(() => {
      try {
        // First, apply the "Show only issues" filter if enabled
        let filtered = [...gridData];
        
        if (showOnlyIssues) {
          console.log('Filtering to show only rows with issues');
          // Get all row indexes that have issues with the selected severities
          const rowIndexesWithSelectedIssues = new Set<number>();
          
          // If we have selected severity filters, only include rows with those severities
          if (selectedSeverityFilter.length > 0) {
            validationIssues.forEach(issue => {
              if (selectedSeverityFilter.includes(issue.severity)) {
                rowIndexesWithSelectedIssues.add(issue.rowIndex);
              }
            });
          } else {
            // If no severity filters selected, include all rows with any issues
            validationIssues.forEach(issue => {
              rowIndexesWithSelectedIssues.add(issue.rowIndex);
            });
          }
          
          console.log(`Found ${rowIndexesWithSelectedIssues.size} rows with matching issues`);
          
          // Filter to only include rows with issues
          filtered = filtered.filter((_, index) => rowIndexesWithSelectedIssues.has(index));
          console.log(`After issue filtering: ${filtered.length} rows remain`);
        }
        
        // Then apply search term filter
        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(row => {
            for (const key in row) {
              const value = row[key];
              if (value && String(value).toLowerCase().includes(lowerSearchTerm)) {
                return true;
              }
            }
            return false;
          });
        }
          
        // Apply sorting if needed
        if (sortConfig !== null) {
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
      } catch (error) {
        console.error('Error filtering data:', error);
        setIsLoading(false);
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [gridData, searchTerm, selectedSeverityFilter, sortConfig, currentPage, rowsPerPage, validationIssues, showOnlyIssues, rowToIssuesMap]);
    
  // We've moved the sorting logic into the main filtering effect for better performance
  
  // Pagination is now handled in the main filtering effect for better performance

  // Get paginated data with memoization for better performance
  const getPaginatedData = React.useCallback(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, rowsPerPage]);

  // Handle cell editing
  const handleCellClick = (rowIndex: number, columnName: string) => {
    setEditingCell({ rowIndex, columnName });
    setEditValue(gridData[rowIndex][columnName] || '');
  };

  const handleCellEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellEditComplete = () => {
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
    
    // If no severities are selected after toggling, select all severities
    // This ensures we always have at least one severity selected
    if (selectedSeverityFilter.length === 0) {
      setSelectedSeverityFilter(['critical', 'warning', 'suggestion']);
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
            <button
              className={`px-2 py-1 rounded-md text-xs flex items-center ${
                showOnlyIssues ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => setShowOnlyIssues(!showOnlyIssues)}
            >
              <FiFilter className="mr-1" />
              {showOnlyIssues ? 'All Rows' : 'Only Issues'}
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
            {columns.map((column) => (
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
            height={Math.min(600 - 48, getPaginatedData().length * 40 + 20)} // Subtract header height
            itemCount={getPaginatedData().length}
            itemSize={40}
            width="100%"
            overscanCount={5}
            outerRef={listOuterRef}
            className="overflow-auto"
          >
            {({ index, style }: { index: number; style: React.CSSProperties }) => {
              const rowIndex = ((currentPage - 1) * rowsPerPage) + index;
              const row = getPaginatedData()[index];
              
              if (!row) return null;
              
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
                    {rowIndex + 1}
                  </div>
                  
                  {columns.map((column) => (
                    <div
                      key={`${rowIndex}-${column}`}
                      ref={highlightedCell && highlightedCell.rowIndex === rowIndex && highlightedCell.columnName === column ? highlightedCellRef : null}
                      className={`px-4 py-2 text-sm ${getCellBackground(rowIndex, column)} ${highlightedCell && highlightedCell.rowIndex === rowIndex && highlightedCell.columnName === column ? 'ring-2 ring-indigo-500 animate-pulse' : ''} ${getCellValidation(rowIndex, column)?.severity === 'critical' ? 'text-red-700 font-medium' : ''}`}
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
                      onClick={() => handleCellClick(rowIndex, column)}
                    >
                      {editingCell && editingCell.rowIndex === rowIndex && editingCell.columnName === column ? (
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
                          {getCellIcon(rowIndex, column) && (
                            <div className="ml-2 relative group flex-shrink-0">
                              {getCellIcon(rowIndex, column)}
                              <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-white border rounded-md shadow-lg -left-32 top-6">
                                <div className="text-xs font-medium mb-1">
                                  {getCellValidation(rowIndex, column)?.severity?.toUpperCase() || ''}
                                </div>
                                <div className="text-xs mb-2">
                                  {getCellValidation(rowIndex, column)?.message || ''}
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