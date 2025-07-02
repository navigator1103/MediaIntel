'use client';

import React, { useState, useEffect } from 'react';
import { FiEdit, FiSave } from 'react-icons/fi';

interface GamePlansCalendarProps {
  data: any[];
  onSave?: (updatedData: any[]) => void;
}

interface CampaignGroup {
  campaignName: string;
  mediaType: string;
  country: string;
  bursts: {
    [key: string]: {
      id: number;
      burst: number;
      startDate: string;
      endDate: string;
      totalBudget: number;
      q1Budget: number;
      q2Budget: number;
      q3Budget: number;
      q4Budget: number;
    };
  };
}

const GamePlansCalendar: React.FC<GamePlansCalendarProps> = ({ data, onSave }) => {
  const [groupedData, setGroupedData] = useState<CampaignGroup[]>([]);
  const [selectedBurst, setSelectedBurst] = useState<any>(null);
  const [editingBurst, setEditingBurst] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const weeks = ['W1', 'W2', 'W3', 'W4'];

  // Simple test to ensure component loads
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Calendar View</h3>
        <p className="text-gray-500 mt-2">No game plans data available</p>
      </div>
    );
  }

  // Group data by campaign
  useEffect(() => {
    const grouped = data.reduce((acc: { [key: string]: CampaignGroup }, item) => {
      const key = `${item.campaign?.name || 'Unknown'}-${item.mediaSubType?.mediaType?.name || 'Unknown'}-${item.country?.name || 'Unknown'}`;
      
      if (!acc[key]) {
        acc[key] = {
          campaignName: item.campaign?.name || 'Unknown',
          mediaType: item.mediaSubType?.mediaType?.name || 'Unknown',
          country: item.country?.name || 'Unknown',
          bursts: {}
        };
      }
      
      acc[key].bursts[item.id] = {
        id: item.id,
        burst: item.burst,
        startDate: item.startDate,
        endDate: item.endDate,
        totalBudget: item.totalBudget,
        q1Budget: item.q1Budget,
        q2Budget: item.q2Budget,
        q3Budget: item.q3Budget,
        q4Budget: item.q4Budget
      };
      
      return acc;
    }, {});

    setGroupedData(Object.values(grouped));
  }, [data]);

  // Get the week of month from a date
  const getWeekOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const dayOfWeek = firstDay.getDay();
    return Math.ceil((dayOfMonth + dayOfWeek) / 7);
  };

  // Get month index from date
  const getMonthIndex = (date: Date): number => {
    return date.getMonth();
  };

  // Check if burst overlaps with a specific month/week
  const burstOverlapsWeek = (burst: any, monthIndex: number, weekIndex: number): boolean => {
    if (!burst.startDate || !burst.endDate) return false;
    
    const startDate = new Date(burst.startDate);
    const endDate = new Date(burst.endDate);
    
    // Get the date range for this specific week
    const year = startDate.getFullYear();
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
    
    // Calculate week start and end dates
    const weekStart = new Date(year, monthIndex, (weekIndex * 7) - firstDayOfMonth.getDay() + 1);
    const weekEnd = new Date(year, monthIndex, (weekIndex + 1) * 7 - firstDayOfMonth.getDay());
    
    // Adjust for month boundaries
    if (weekStart < firstDayOfMonth) weekStart.setTime(firstDayOfMonth.getTime());
    if (weekEnd > lastDayOfMonth) weekEnd.setTime(lastDayOfMonth.getTime());
    
    return startDate <= weekEnd && endDate >= weekStart;
  };

  // Get burst color based on burst number
  const getBurstColor = (burstNumber: number): string => {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ];
    return colors[burstNumber % colors.length];
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value === undefined || value === null) return '';
    return `€${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Handle burst click
  const handleBurstClick = (burst: any) => {
    setSelectedBurst(burst);
  };

  // Handle inline editing
  const handleEditClick = (burstId: number, field: string, value: any) => {
    setEditingBurst({ id: burstId, field });
    setEditValue(value !== null && value !== undefined ? String(value) : '');
  };

  const handleSaveEdit = () => {
    if (!editingBurst || !selectedBurst) return;
    
    const { field } = editingBurst;
    let parsedValue = editValue;
    
    // Convert to appropriate type based on field
    if (['totalBudget', 'q1Budget', 'q2Budget', 'q3Budget', 'q4Budget'].includes(field)) {
      parsedValue = parseFloat(editValue) || 0 as any;
    } else if (field === 'burst') {
      parsedValue = parseInt(editValue) || 0 as any;
    }
    
    // Update the selected burst
    const updatedBurst = { ...selectedBurst, [field]: parsedValue };
    setSelectedBurst(updatedBurst);
    
    // Update the original data and notify parent
    const updatedData = data.map(item => {
      if (item.id === editingBurst.id) {
        return { ...item, [field]: parsedValue };
      }
      return item;
    });
    
    if (onSave) {
      onSave(updatedData);
    }
    
    setEditingBurst(null);
  };

  const handleCancelEdit = () => {
    setEditingBurst(null);
  };

  const renderEditableField = (burst: any, field: string, value: any, type: 'text' | 'date' | 'currency' = 'text') => {
    const isEditing = editingBurst && editingBurst.id === burst.id && editingBurst.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center">
          <input
            type={type === 'date' ? 'date' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full p-1 border rounded text-xs"
            autoFocus
          />
          <button onClick={handleSaveEdit} className="ml-1 text-green-600 hover:text-green-800">
            <FiSave size={12} />
          </button>
          <button onClick={handleCancelEdit} className="ml-1 text-red-600 hover:text-red-800">
            ×
          </button>
        </div>
      );
    }

    let displayValue = value;
    if (type === 'currency') {
      displayValue = formatCurrency(value);
    } else if (type === 'date' && value) {
      displayValue = new Date(value).toLocaleDateString();
    }

    return (
      <div className="flex items-center justify-between group">
        <span className="text-xs">{displayValue}</span>
        <button 
          onClick={() => handleEditClick(burst.id, field, value)}
          className="invisible group-hover:visible text-blue-600 hover:text-blue-800 ml-1"
        >
          <FiEdit size={10} />
        </button>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex">
        {/* Left side - Campaign info */}
        <div className="flex-none bg-gray-50 border-r">
          <div className="sticky top-0 bg-gray-100 border-b">
            <div className="grid grid-cols-3 gap-px">
              <div className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 w-48">Campaign</div>
              <div className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 w-32">Media Type</div>
              <div className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 w-24">Country</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {groupedData.map((campaign, index) => (
              <div key={index} className="grid grid-cols-3 gap-px min-h-[60px] items-center">
                <div className="px-3 py-2 text-sm font-medium text-gray-900 w-48 truncate" title={campaign.campaignName}>
                  {campaign.campaignName}
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 w-32 truncate" title={campaign.mediaType}>
                  {campaign.mediaType}
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 w-24 truncate" title={campaign.country}>
                  {campaign.country}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Calendar grid */}
        <div className="flex-1 overflow-x-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gray-100 border-b">
            <div className="grid grid-cols-12 gap-px">
              {months.map((month, monthIndex) => (
                <div key={month} className="text-center">
                  <div className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border-b">
                    {month}
                  </div>
                  <div className="grid grid-cols-4 gap-px">
                    {weeks.map((week) => (
                      <div key={week} className="px-1 py-1 text-xs text-gray-600 bg-gray-50 min-w-[50px]">
                        {week}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar body */}
          <div className="divide-y divide-gray-200">
            {groupedData.map((campaign, campaignIndex) => (
              <div key={campaignIndex} className="grid grid-cols-12 gap-px min-h-[60px]">
                {months.map((month, monthIndex) => (
                  <div key={month} className="grid grid-cols-4 gap-px">
                    {weeks.map((week, weekIndex) => {
                      // Find bursts that overlap with this week
                      const overlappingBursts = Object.values(campaign.bursts).filter(burst =>
                        burstOverlapsWeek(burst, monthIndex, weekIndex)
                      );

                      return (
                        <div key={week} className="min-w-[50px] min-h-[60px] bg-white border border-gray-100 p-1">
                          {overlappingBursts.map((burst, burstIndex) => (
                            <div
                              key={burst.id}
                              className="mb-1 p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: getBurstColor(burst.burst) + '40', borderLeft: `3px solid ${getBurstColor(burst.burst)}` }}
                              onClick={() => handleBurstClick(burst)}
                              title={`Burst ${burst.burst}: ${formatCurrency(burst.totalBudget)}`}
                            >
                              <div className="text-xs font-medium text-gray-700">B{burst.burst}</div>
                              <div className="text-xs text-gray-600">{formatCurrency(burst.totalBudget)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Burst details modal */}
      {selectedBurst && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Burst {selectedBurst.burst} Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Burst Number</label>
                {renderEditableField(selectedBurst, 'burst', selectedBurst.burst, 'text')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                {renderEditableField(selectedBurst, 'startDate', selectedBurst.startDate, 'date')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                {renderEditableField(selectedBurst, 'endDate', selectedBurst.endDate, 'date')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Budget</label>
                {renderEditableField(selectedBurst, 'totalBudget', selectedBurst.totalBudget, 'currency')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Q1 Budget</label>
                  {renderEditableField(selectedBurst, 'q1Budget', selectedBurst.q1Budget, 'currency')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Q2 Budget</label>
                  {renderEditableField(selectedBurst, 'q2Budget', selectedBurst.q2Budget, 'currency')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Q3 Budget</label>
                  {renderEditableField(selectedBurst, 'q3Budget', selectedBurst.q3Budget, 'currency')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Q4 Budget</label>
                  {renderEditableField(selectedBurst, 'q4Budget', selectedBurst.q4Budget, 'currency')}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedBurst(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePlansCalendar;