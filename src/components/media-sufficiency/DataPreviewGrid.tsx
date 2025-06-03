import React, { useState, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle, FiEdit2, FiFilter, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface DataPreviewGridProps {
  data: any[];
  validationIssues?: ValidationIssue[];
  onDataChange?: (updatedData: any[]) => void;
  onCellEdit?: (rowIndex: number, columnName: string, newValue: any) => void;
  highlightedCell?: {rowIndex: number, columnName: string} | null;
}

export interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: any;
}

const DataPreviewGrid: React.FC<DataPreviewGridProps> = ({ 
  data, 
  validationIssues = [], 
  onDataChange,
  onCellEdit,
  highlightedCell = null
}) => {
  const [gridData, setGridData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnName: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string[]>(['critical', 'warning', 'suggestion']);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  
  // Reference for the highlighted cell
  const highlightedCellRef = React.useRef<HTMLTableCellElement | null>(null);
  
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

  // Apply filters, search, and pagination with performance optimizations
  useEffect(() => {
    // Debounced filtering function to prevent UI freezing
    const applyFilters = () => {
      // Start with a limited subset of data for initial rendering
      // This prevents the browser from freezing when dealing with very large datasets
      const maxInitialRows = 1000; // Limit initial processing to 1000 rows
      const initialData = gridData.slice(0, maxInitialRows);
      let filtered = [...initialData];
      
      // Apply search term with optimized search
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(row => {
          // Only convert values to string when needed
          for (const key in row) {
            const value = row[key];
            if (value && String(value).toLowerCase().includes(lowerSearchTerm)) {
              return true;
            }
          }
          return false;
        });
      }
      
      // Apply issues filter with optimized Set lookup
      if (showOnlyIssues) {
        // Create a Set of row indexes with issues for faster lookup
        const rowsWithIssuesSet = new Set(
          validationIssues
            .filter(issue => selectedSeverityFilter.includes(issue.severity))
            .map(issue => issue.rowIndex)
        );
        
        // Keep only rows that have issues
        filtered = filtered.filter((_, index) => rowsWithIssuesSet.has(index));
      }
      
      // If we're showing less than the max rows and there's more data,
      // process the rest of the data in chunks asynchronously
      if (gridData.length > maxInitialRows) {
        // Set the initial filtered data immediately
        setFilteredData(filtered);
        
        // Process the remaining data in chunks
        setTimeout(() => {
          const remainingData = gridData.slice(maxInitialRows);
          const chunkSize = 500;
          
          // Process data in chunks to avoid UI freezing
          const processChunk = (startIndex: number) => {
            const endIndex = Math.min(startIndex + chunkSize, remainingData.length);
            const chunk = remainingData.slice(startIndex, endIndex);
            
            // Apply the same filters to this chunk
            let filteredChunk = [...chunk];
            
            if (searchTerm) {
              const lowerSearchTerm = searchTerm.toLowerCase();
              filteredChunk = filteredChunk.filter(row => {
                for (const key in row) {
                  const value = row[key];
                  if (value && String(value).toLowerCase().includes(lowerSearchTerm)) {
                    return true;
                  }
                }
                return false;
              });
            }
            
            if (showOnlyIssues) {
              const rowsWithIssuesSet = new Set(
                validationIssues
                  .filter(issue => selectedSeverityFilter.includes(issue.severity))
                  .map(issue => issue.rowIndex)
              );
              
              filteredChunk = filteredChunk.filter((_, index) => {
                // Adjust index to account for the offset in the original array
                return rowsWithIssuesSet.has(index + maxInitialRows + startIndex);
              });
            }
            
            // Combine with existing filtered data
            setFilteredData(prevFiltered => [...prevFiltered, ...filteredChunk]);
            
            // Process next chunk if there's more data
            if (endIndex < remainingData.length) {
              setTimeout(() => processChunk(endIndex), 0);
            }
          };
          
          // Start processing chunks
          processChunk(0);
        }, 0);
      } else {
        // If we have a small dataset, just set the filtered data directly
        setFilteredData(filtered);
      }
    };
    
    // Use setTimeout to defer filtering until after the current render cycle
    const timerId = setTimeout(applyFilters, 0);
    
    // Cleanup function
    return () => clearTimeout(timerId);
  }, [gridData, searchTerm, showOnlyIssues, selectedSeverityFilter, validationIssues]);
    
  // Separate effect for sorting to avoid re-sorting on every filter change
  useEffect(() => {
    if (sortConfig !== null && filteredData.length > 0) {
      // Create a copy to avoid mutating the original array
      const dataToSort = [...filteredData];
      
      // Use a more efficient sorting algorithm
      const sortedData = dataToSort.sort((a, b) => {
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
      
      setFilteredData(sortedData);
    }
  }, [sortConfig, filteredData.length]);
  
  // Separate effect for pagination calculations
  useEffect(() => {
    // Calculate total pages
    const calculatedTotalPages = Math.ceil(filteredData.length / rowsPerPage);
    setTotalPages(calculatedTotalPages || 1); // Ensure at least 1 page
    
    // Reset to first page if current page is out of bounds
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredData.length, rowsPerPage, currentPage]);

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
      const updatedData = [...gridData];
      updatedData[rowIndex] = { ...updatedData[rowIndex], [columnName]: editValue };
      
      setGridData(updatedData);
      
      // Call the callback if provided
      if (onCellEdit) {
        onCellEdit(rowIndex, columnName, editValue);
      }
      
      if (onDataChange) {
        onDataChange(updatedData);
      }
      
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

  // Apply fix to all similar issues
  const applyFixToAll = (columnName: string, currentValue: any, newValue: any) => {
    const updatedData = gridData.map(row => {
      if (row[columnName] === currentValue) {
        return { ...row, [columnName]: newValue };
      }
      return row;
    });
    
    setGridData(updatedData);
    
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

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
    const counts = {
      critical: 0,
      warning: 0,
      suggestion: 0
    };
    
    validationIssues.forEach(issue => {
      counts[issue.severity]++;
    });
    
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
                onChange={() => setShowOnlyIssues(!showOnlyIssues)}
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
      
      {/* Data Grid with Virtualization */}
      <div className="overflow-x-auto max-w-full" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="sticky top-0 bg-gray-50 z-10">
          <div className="flex border-b border-gray-200">
            <div className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
              Row
            </div>
            {columns.map((column) => (
              <div
                key={column}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                style={{ minWidth: '150px', maxWidth: '300px', flex: '1 0 auto' }}
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
        
        {/* Virtualized List for Table Body */}
        <div style={{ height: 'calc(100vh - 300px)', width: '100%' }}>
          <List
            height={Math.min(600, getPaginatedData().length * 40 + 20)} // Adjust height based on number of rows, max 600px
            itemCount={getPaginatedData().length}
            itemSize={40} // Height of each row
            width="100%"
            overscanCount={5} // Number of items to render outside of the visible area
            className="divide-y divide-gray-200"
          >
            {({ index, style }) => {
              const actualRowIndex = index;
              const rowIndex = ((currentPage - 1) * rowsPerPage) + actualRowIndex;
              const row = getPaginatedData()[actualRowIndex];
              
              if (!row) return null; // Safety check
              
              return (
                <div 
                  style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                  }}
                  className="hover:bg-gray-50"
                >
                  <div className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 w-12 flex-shrink-0">
                    {rowIndex + 1}
                  </div>
                  
                  {columns.map((column) => {
                    const isHighlighted = highlightedCell && 
                      highlightedCell.rowIndex === rowIndex && 
                      highlightedCell.columnName === column;
                    
                    return (
                      <div
                        key={`${rowIndex}-${column}`}
                        ref={isHighlighted ? highlightedCellRef : null}
                        className={`px-4 py-2 text-sm flex-1 ${getCellBackground(rowIndex, column)} ${isHighlighted ? 'ring-2 ring-indigo-500 animate-pulse' : ''} ${getCellValidation(rowIndex, column)?.severity === 'critical' ? 'text-red-700 font-medium' : ''}`}
                        style={{ 
                          minWidth: '150px', 
                          maxWidth: '300px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          transition: 'all 0.3s ease',
                          flex: '1 0 auto'
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
                          className="w-full p-1 border rounded"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="flex-grow">{row[column]}</span>
                          {getCellIcon(rowIndex, column) && (
                            <div className="ml-2 relative group">
                              {getCellIcon(rowIndex, column)}
                              <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-white border rounded-md shadow-lg -left-32 top-6">
                                <div className="text-xs font-medium mb-1">
                                  {getCellValidation(rowIndex, column)?.severity?.toUpperCase() || ''}
                                </div>
                                <div className="text-xs mb-2">
                                  {getCellValidation(rowIndex, column)?.message || ''}
                                </div>
                                {/* Apply to all similar issues button removed - suggestion functionality has been eliminated */}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              );
            }}
          </List>
        </div>
      </div>
      
      {/* Pagination Controls with Performance Optimizations */}
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
