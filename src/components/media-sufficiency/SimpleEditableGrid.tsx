'use client';

import React, { useState, useEffect } from 'react';
import { FiEdit, FiCheck, FiX, FiSave } from 'react-icons/fi';

interface SimpleEditableGridProps {
  data: any[];
  onSave?: (updatedData: any[]) => void;
  onDelete?: (deletedIds: number[]) => void;
}

const SimpleEditableGrid: React.FC<SimpleEditableGridProps> = ({ data, onSave, onDelete }) => {
  const [gridData, setGridData] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    setGridData(data);
  }, [data]);

  const handleEditClick = (rowId: number, field: string, value: any) => {
    setEditingCell({ rowId, field });
    setEditValue(value !== null && value !== undefined ? String(value) : '');
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    
    const { rowId, field } = editingCell;
    const updatedData = gridData.map(item => {
      if (item.id === rowId) {
        let parsedValue = editValue;
        
        // Convert to appropriate type based on field
        if (['totalBudget', 'q1Budget', 'q2Budget', 'q3Budget', 'q4Budget'].includes(field)) {
          parsedValue = parseFloat(editValue) || 0 as any; // Cast to any to avoid type error
        }
        
        return { ...item, [field]: parsedValue };
      }
      return item;
    });
    
    setGridData(updatedData);
    setEditingCell(null);
    setHasChanges(true);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };
  
  // Handle row selection
  const handleRowSelect = (rowId: number) => {
    setSelectedRows(prev => {
      if (prev.includes(rowId)) {
        return prev.filter(id => id !== rowId);
      } else {
        return [...prev, rowId];
      }
    });
  };
  
  // Handle select all rows
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(gridData.map(item => item.id));
    }
    setSelectAll(!selectAll);
  };
  
  // Handle delete selected rows
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      alert('No rows selected for deletion');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedRows.length} selected game plan(s)?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/media-sufficiency/game-plans/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedRows }),
      });
      
      if (response.ok) {
        // Remove deleted rows from state
        setGridData(prev => prev.filter(item => !selectedRows.includes(item.id)));
        
        // Notify parent component
        if (onDelete) {
          onDelete(selectedRows);
        }
        
        setSelectedRows([]);
        setSelectAll(false);
        alert('Selected game plans deleted successfully!');
      } else {
        alert('Failed to delete selected game plans. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting game plans:', error);
      alert('An error occurred while deleting game plans.');
    }
  };

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
        if (onSave) {
          onSave(gridData);
        }
      } else {
        alert('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('An error occurred while saving changes.');
    }
  };

  const formatCurrency = (value: number) => {
    if (value === undefined || value === null) return '';
    return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  const renderEditableCell = (row: any, field: string, value: any, type: 'text' | 'date' | 'currency' = 'text') => {
    const isEditing = editingCell && editingCell.rowId === row.id && editingCell.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center">
          <input
            type={type === 'date' ? 'date' : 'text'}
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

    let displayValue = value;
    if (type === 'date') {
      displayValue = formatDate(value);
    } else if (type === 'currency') {
      displayValue = formatCurrency(value);
    }

    return (
      <div className="flex items-center justify-between group">
        <span>{displayValue}</span>
        <button 
          onClick={() => handleEditClick(row.id, field, value)}
          className="invisible group-hover:visible text-blue-600 hover:text-blue-800 ml-2"
        >
          <FiEdit size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex justify-between items-center">
        {hasChanges && (
          <div className="p-2 bg-yellow-100 rounded flex-grow flex justify-between items-center mr-2">
            <span className="text-yellow-800">You have unsaved changes</span>
            <button
              onClick={handleSaveAllChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded flex items-center"
            >
              <FiSave className="mr-1" /> Save Changes
            </button>
          </div>
        )}
        
        {selectedRows.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center whitespace-nowrap"
          >
            Delete Selected ({selectedRows.length})
          </button>
        )}
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Sub Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Budget</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1 Budget</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2 Budget</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q3 Budget</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q4 Budget</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {gridData.length > 0 ? (
            gridData.map((row) => (
              <tr key={row.id} className={`hover:bg-gray-50 ${selectedRows.includes(row.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => handleRowSelect(row.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.campaign?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.mediaSubType?.mediaType?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.mediaSubType?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.country?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderEditableCell(row, 'startDate', row.startDate, 'date')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderEditableCell(row, 'endDate', row.endDate, 'date')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderEditableCell(row, 'totalBudget', row.totalBudget, 'currency')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderEditableCell(row, 'q1Budget', row.q1Budget, 'currency')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderEditableCell(row, 'q2Budget', row.q2Budget, 'currency')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderEditableCell(row, 'q3Budget', row.q3Budget, 'currency')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {renderEditableCell(row, 'q4Budget', row.q4Budget, 'currency')}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={13} className="px-6 py-4 text-center text-sm text-gray-500">
                No game plans found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SimpleEditableGrid;
