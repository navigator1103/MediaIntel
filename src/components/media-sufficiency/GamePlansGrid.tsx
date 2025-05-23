'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiEdit, FiCheck, FiX, FiSave } from 'react-icons/fi';

interface GamePlansGridProps {
  data: any[];
  onDataChange?: (updatedData: any[]) => void;
}

const GamePlansGrid: React.FC<GamePlansGridProps> = ({ data, onDataChange }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [gridData, setGridData] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize grid data when data prop changes
  useEffect(() => {
    setGridData(data);
  }, [data]);
  
  // Define the columns to display
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'campaign.name', label: 'Campaign' },
    { key: 'mediaSubType.mediaType.name', label: 'Media Type' },
    { key: 'mediaSubType.name', label: 'Media Sub Type' },
    { key: 'country.name', label: 'Country' },
    { key: 'category.name', label: 'Category' },
    { key: 'pmType.name', label: 'PM Type' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'totalBudget', label: 'Total Budget' },
    { key: 'q1Budget', label: 'Q1 Budget' },
    { key: 'q2Budget', label: 'Q2 Budget' },
    { key: 'q3Budget', label: 'Q3 Budget' },
    { key: 'q4Budget', label: 'Q4 Budget' },
  ];
  
  // Function to get nested property value
  const getNestedValue = (obj: any, path: string) => {
    const keys = path.split('.');
    return keys.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, obj);
  };
  
  // Function to format date strings
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Function to format currency values
  const formatCurrency = (value: number) => {
    if (value === undefined || value === null) return '';
    return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Function to handle sorting
  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Function to handle starting cell edit
  const handleCellEdit = (rowId: number, columnKey: string, value: any) => {
    setEditingCell({ rowId, columnKey });
    setEditValue(value !== null && value !== undefined ? String(value) : '');
  };
  
  // Function to handle saving cell edit
  const handleSaveEdit = async () => {
    if (!editingCell) return;
    
    const { rowId, columnKey } = editingCell;
    const updatedData = gridData.map(item => {
      if (item.id === rowId) {
        // For nested properties like 'campaign.name', we need to handle differently
        if (columnKey.includes('.')) {
          // For now, we don't support editing nested properties
          return item;
        } else {
          // For direct properties, update the value
          let parsedValue = editValue;
          
          // Convert to appropriate type based on column
          if (['totalBudget', 'q1Budget', 'q2Budget', 'q3Budget', 'q4Budget'].includes(columnKey)) {
            parsedValue = parseFloat(editValue) as any; // Cast to any to avoid type error
          } else if (['startDate', 'endDate'].includes(columnKey)) {
            // Ensure date format is consistent
            try {
              const date = new Date(editValue);
              parsedValue = date.toISOString().split('T')[0];
            } catch (e) {
              parsedValue = editValue;
            }
          }
          
          return { ...item, [columnKey]: parsedValue };
        }
      }
      return item;
    });
    
    setGridData(updatedData);
    setEditingCell(null);
    setHasChanges(true);
    
    // Notify parent component of data change
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };
  
  // Function to cancel editing
  const handleCancelEdit = () => {
    setEditingCell(null);
  };
  
  // Function to save all changes to the server
  const handleSaveAllChanges = async () => {
    try {
      const response = await fetch('/api/admin/media-sufficiency/game-plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gamePlans: gridData }),
      });
      
      if (response.ok) {
        setHasChanges(false);
        alert('Changes saved successfully!');
      } else {
        alert('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('An error occurred while saving changes.');
    }
  };
  
  // Function to sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return gridData;
    
    return [...gridData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);
      
      if (aValue === null) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue === null) return sortConfig.direction === 'ascending' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'ascending'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  }, [data, sortConfig]);
  
  // Render the sort indicator
  const renderSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    
    return sortConfig.direction === 'ascending' ? (
      <FiChevronUp className="ml-1 inline" />
    ) : (
      <FiChevronDown className="ml-1 inline" />
    );
  };
  
  // Render cell content with editing capability
  const renderCell = (item: any, column: { key: string; label: string }) => {
    const isEditing = editingCell && editingCell.rowId === item.id && editingCell.columnKey === column.key;
    const value = getNestedValue(item, column.key);
    
    // Check if this cell is editable (we don't allow editing of nested properties or ID)
    const isEditable = !column.key.includes('.') && column.key !== 'id';
    
    if (isEditing) {
      return (
        <div className="flex items-center">
          <input
            type={['startDate', 'endDate'].includes(column.key) ? 'date' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-1 border rounded"
            autoFocus
          />
          <button onClick={handleSaveEdit} className="ml-1 text-green-600 hover:text-green-800">
            <FiCheck />
          </button>
          <button onClick={handleCancelEdit} className="ml-1 text-red-600 hover:text-red-800">
            <FiX />
          </button>
        </div>
      );
    }
    
    // Format the cell value based on the column type
    let displayValue: React.ReactNode = value;
    
    if (column.key === 'startDate' || column.key === 'endDate') {
      displayValue = formatDate(value);
    } else if (['totalBudget', 'q1Budget', 'q2Budget', 'q3Budget', 'q4Budget'].includes(column.key)) {
      displayValue = formatCurrency(value);
    }
    
    return (
      <div className="flex items-center justify-between group">
        <span>{displayValue}</span>
        {isEditable && (
          <button 
            onClick={() => handleCellEdit(item.id, column.key, value)}
            className="invisible group-hover:visible text-blue-600 hover:text-blue-800 ml-2"
          >
            <FiEdit size={14} />
          </button>
        )}
      </div>
    );
  };
  
  return (
    <div className="overflow-x-auto">
      {hasChanges && (
        <div className="mb-4 p-2 bg-yellow-100 rounded flex justify-between items-center">
          <span className="text-yellow-800">You have unsaved changes</span>
          <button
            onClick={handleSaveAllChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded flex items-center"
          >
            <FiSave className="mr-1" /> Save Changes
          </button>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort(column.key)}
              >
                {column.label}
                {renderSortIndicator(column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.length > 0 ? (
            sortedData.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {renderCell(plan, column)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                No game plans found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GamePlansGrid;
