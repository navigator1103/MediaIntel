import React, { useState, useEffect } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiInfo, FiCheckCircle, FiEdit2, FiFilter, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface DataPreviewGridProps {
  data: any[];
  validationIssues?: ValidationIssue[];
  onDataChange?: (updatedData: any[]) => void;
  onCellEdit?: (rowIndex: number, columnName: string, newValue: any) => void;
  highlightedCell?: {rowIndex: number, columnName: string} | null;
  validationStatus?: 'idle' | 'validating' | 'in-progress' | 'success' | 'error';
  validationSummary?: any;
  importStatus?: 'idle' | 'importing' | 'success' | 'error';
  importProgress?: {
    current: number;
    total: number;
    percentage: number;
    stage: string;
  };
  importErrors?: Array<{ message: string }>;
  onImport?: () => void;
  canImport?: boolean;
}

export interface ValidationIssue {
  rowIndex: number;
  columnName: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  currentValue?: any;
  suggestedValue?: any;
}

const DataPreviewGrid: React.FC<DataPreviewGridProps> = ({ 
  data, 
  validationIssues = [], 
  onDataChange,
  onCellEdit,
  highlightedCell = null,
  validationStatus,
  validationSummary,
  importStatus,
  importProgress,
  importErrors,
  onImport,
  canImport
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

  // Apply filters, search, and pagination
  useEffect(() => {
    let filtered = [...gridData];
    
    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(row => {
        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    // Apply issues filter
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
    
    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    // Calculate total pages
    const calculatedTotalPages = Math.ceil(filtered.length / rowsPerPage);
    setTotalPages(calculatedTotalPages || 1); // Ensure at least 1 page
    
    // Reset to first page if current page is out of bounds
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(1);
    }
    
    setFilteredData(filtered);
  }, [gridData, searchTerm, showOnlyIssues, selectedSeverityFilter, sortConfig, validationIssues, rowsPerPage]);

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

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

  // Get cell validation status
  const getCellValidation = (rowIndex: number, columnName: string) => {
    return validationIssues.find(
      issue => issue.rowIndex === rowIndex && issue.columnName === columnName
    );
  };

  // Get cell background color based on validation status
  const getCellBackground = (rowIndex: number, columnName: string) => {
    const issue = getCellValidation(rowIndex, columnName);
    if (!issue) return 'bg-gradient-to-r from-white to-gray-50';
    
    switch (issue.severity) {
      case 'critical':
        return 'bg-gradient-to-r from-red-100 via-red-50 to-[#fd7f6f]/20 border-l-8 border-l-[#fd7f6f] shadow-lg shadow-red-200/50';
      case 'warning':
        return 'bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-50 border-l-8 border-l-amber-500 shadow-lg shadow-amber-200/50';
      case 'suggestion':
        return 'bg-gradient-to-r from-blue-100 via-indigo-50 to-[#7eb0d5]/20 border-l-8 border-l-[#7eb0d5] shadow-lg shadow-blue-200/50';
      default:
        return 'bg-gradient-to-r from-white to-gray-50';
    }
  };

  // Get cell icon based on validation status
  const getCellIcon = (rowIndex: number, columnName: string) => {
    const issue = getCellValidation(rowIndex, columnName);
    if (!issue) return null;
    
    switch (issue.severity) {
      case 'critical':
        return <FiAlertCircle className="text-red-600 h-5 w-5 animate-pulse" />;
      case 'warning':
        return <FiAlertTriangle className="text-amber-600 h-5 w-5" />;
      case 'suggestion':
        return <FiInfo className="text-blue-600 h-5 w-5" />;
      default:
        return null;
    }
  };

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
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-0">
      {/* Toolbar */}
      <div className="px-8 py-6 bg-gradient-to-r from-[#115f9a] via-[#1984c5] to-[#7eb0d5] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your data..."
              className="pl-12 pr-6 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1984c5] focus:border-[#1984c5] bg-white text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-200 hover:shadow-md min-w-[280px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <label className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300 cursor-pointer shadow-lg">
              <input
                type="checkbox"
                checked={showOnlyIssues}
                onChange={() => setShowOnlyIssues(!showOnlyIssues)}
                className="mr-3 h-5 w-5 text-indigo-600 rounded-lg focus:ring-white/50 bg-white/80"
              />
              <span className="text-sm font-semibold text-white">Issues Only</span>
            </label>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold text-white/90">Filters:</span>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all duration-300 transform hover:scale-105 ${
                selectedSeverityFilter.includes('critical') 
                  ? 'bg-[#fd7f6f] text-white shadow-lg shadow-red-500/30' 
                  : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 shadow-lg'
              }`}
              onClick={() => toggleSeverityFilter('critical')}
            >
              <FiAlertCircle className="mr-2 h-4 w-4" />
              Critical ({issueCounts.critical})
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all duration-300 transform hover:scale-105 ${
                selectedSeverityFilter.includes('warning') 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                  : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 shadow-lg'
              }`}
              onClick={() => toggleSeverityFilter('warning')}
            >
              <FiAlertTriangle className="mr-2 h-4 w-4" />
              Warnings ({issueCounts.warning})
            </button>
            <button
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-all duration-300 transform hover:scale-105 ${
                selectedSeverityFilter.includes('suggestion') 
                  ? 'bg-[#7eb0d5] text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 shadow-lg'
              }`}
              onClick={() => toggleSeverityFilter('suggestion')}
            >
              <FiInfo className="mr-2 h-4 w-4" />
              Tips ({issueCounts.suggestion})
            </button>
          </div>
        </div>
      </div>
      
      {/* Data Grid */}
      <div className="overflow-x-auto max-w-full bg-gray-50" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="w-auto divide-y divide-gray-300" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-16 bg-gray-200">
                #
              </th>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-300 transition-all duration-300 hover:shadow-lg"
                  style={{ minWidth: '150px', maxWidth: '300px' }}
                  onClick={() => requestSort(column)}
                >
                  <div className="flex items-center">
                    <span>{column}</span>
                    {sortConfig?.key === column && (
                      <span className="ml-2 text-[#1984c5] font-bold text-lg">
                        {sortConfig.direction === 'ascending' ? '↗' : '↘'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getPaginatedData().map((row, actualRowIndex) => {
              // Calculate the actual row index in the full dataset
              const rowIndex = ((currentPage - 1) * rowsPerPage) + actualRowIndex;
              return (
                <tr key={rowIndex} className="hover:bg-gradient-to-r hover:from-[#7eb0d5]/10 hover:via-[#1984c5]/10 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border-l-4 border-l-transparent hover:border-l-[#1984c5]">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700 bg-gray-100">
                    {rowIndex + 1}
                  </td>
                  {columns.map((column) => {
                    const isHighlighted = highlightedCell && 
                      highlightedCell.rowIndex === rowIndex && 
                      highlightedCell.columnName === column;
                    
                    return (
                    <td
                      key={`${rowIndex}-${column}`}
                      ref={isHighlighted ? highlightedCellRef : null}
                      className={`px-6 py-2 text-sm cursor-pointer relative group ${getCellBackground(rowIndex, column)} ${isHighlighted ? 'ring-4 ring-cyan-400 ring-offset-2 animate-pulse shadow-lg' : ''} ${getCellValidation(rowIndex, column)?.severity === 'critical' ? 'text-red-800 font-bold' : 'text-gray-800'} hover:shadow-md transition-all duration-300`}
                      style={{ 
                        minWidth: '150px', 
                        maxWidth: '300px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => handleCellClick(rowIndex, column)}
                      title={getCellValidation(rowIndex, column) ? `${getCellValidation(rowIndex, column)?.severity.toUpperCase()}: ${getCellValidation(rowIndex, column)?.message}` : ''}
                    >
                      {editingCell && editingCell.rowIndex === rowIndex && editingCell.columnName === column ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={handleCellEdit}
                          onBlur={handleCellEditComplete}
                          onKeyDown={handleKeyDown}
                          className="w-full p-2 border-2 border-indigo-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-600 bg-gradient-to-r from-white to-indigo-50 shadow-lg font-semibold text-gray-800"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="flex-grow font-semibold">{row[column]}</span>
                          {getCellIcon(rowIndex, column) && (
                            <div className="ml-3 relative group">
                              <div className="p-2 rounded-full hover:bg-indigo-100 transition-all duration-300 transform hover:scale-110">
                                {getCellIcon(rowIndex, column)}
                              </div>
                              <div className="hidden group-hover:block absolute z-30 w-80 p-5 bg-white border-2 border-gray-300 rounded-2xl shadow-2xl -left-40 top-10">
                                <div className={`text-sm font-bold mb-3 ${
                                  getCellValidation(rowIndex, column)?.severity === 'critical' ? 'text-red-600' :
                                  getCellValidation(rowIndex, column)?.severity === 'warning' ? 'text-amber-600' :
                                  'text-blue-600'
                                }`}>
                                  {getCellValidation(rowIndex, column)?.severity === 'critical' ? '🚨 CRITICAL ERROR' :
                                   getCellValidation(rowIndex, column)?.severity === 'warning' ? '⚠️ WARNING' :
                                   '💡 SUGGESTION'}
                                </div>
                                <div className="text-sm mb-4 text-gray-700 leading-relaxed font-medium">
                                  {getCellValidation(rowIndex, column)?.message}
                                </div>
                                {getCellValidation(rowIndex, column)?.suggestedValue && (
                                  <div className="text-xs mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <span className="font-semibold text-green-700">Suggested fix:</span>
                                    <span className="text-green-600 ml-1">{getCellValidation(rowIndex, column)?.suggestedValue}</span>
                                  </div>
                                )}
                                <button
                                  className="text-sm bg-gradient-to-r from-[#1984c5] to-[#115f9a] text-white px-4 py-2 rounded-xl hover:from-[#7eb0d5] hover:to-[#1984c5] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const issue = getCellValidation(rowIndex, column);
                                    if (issue && issue.suggestedValue !== undefined) {
                                      applyFixToAll(column, row[column], issue.suggestedValue);
                                    }
                                  }}
                                >
                                  🔧 Fix All Similar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Cell hover tooltip */}
                      {getCellValidation(rowIndex, column) && (
                        <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                          <div className="font-semibold">
                            {getCellValidation(rowIndex, column)?.severity === 'critical' ? '🚨 Critical' :
                             getCellValidation(rowIndex, column)?.severity === 'warning' ? '⚠️ Warning' : '💡 Tip'}
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
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
      
      {/* Pagination Controls */}
      <div className="px-8 py-6 bg-gradient-to-r from-[#115f9a] via-[#1984c5] to-[#7eb0d5] flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium text-white mr-4">
            Rows per page:
          </span>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1984c5] focus:border-[#1984c5] transition-all duration-200"
            value={rowsPerPage}
            onChange={handleRowsPerPageChange}
          >
            <option value={10} className="text-gray-800">10</option>
            <option value={25} className="text-gray-800">25</option>
            <option value={50} className="text-gray-800">50</option>
            <option value={100} className="text-gray-800">100</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm font-medium text-white mr-6">
            {filteredData.length > 0 ? (
              <>
                Showing <span className="font-semibold text-white/90">{((currentPage - 1) * rowsPerPage) + 1}</span> to <span className="font-semibold text-white/90">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of <span className="font-semibold text-white/90">{filteredData.length}</span> entries
              </>
            ) : (
              'No entries to show'
            )}
          </span>
          
          <div className="flex items-center space-x-2">
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed bg-gray-200' : 'text-gray-600 hover:bg-gray-300 hover:text-gray-800 bg-white border border-gray-300 shadow-sm hover:shadow-md'}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Previous Page</span>
              <FiChevronLeft className="h-5 w-5" />
            </button>
            
            <span className="px-4 py-2 text-sm font-medium bg-white rounded-lg shadow-sm border border-gray-300">
              <span className="text-gray-700">Page</span> <span className="text-[#1984c5] font-semibold">{currentPage}</span> <span className="text-gray-700">of</span> <span className="text-[#1984c5] font-semibold">{totalPages}</span>
            </span>
            
            <button
              className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed bg-gray-200' : 'text-gray-600 hover:bg-gray-300 hover:text-gray-800 bg-white border border-gray-300 shadow-sm hover:shadow-md'}`}
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
