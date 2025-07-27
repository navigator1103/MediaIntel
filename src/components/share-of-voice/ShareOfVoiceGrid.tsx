'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiSave, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiPlus, FiTrash2 } from 'react-icons/fi';

interface SOVData {
  id?: number;
  category: string;
  company: string;
  totalTvInvestment?: number;
  totalTvTrps?: number;
  totalDigitalSpend?: number;
  totalDigitalImpressions?: number;
}

interface ShareOfVoiceGridProps {
  countryId: number;
  businessUnitId: number;
  mediaType: 'tv' | 'digital';
  onSave?: (success: boolean) => void;
}

// Get default companies based on business unit
const getDefaultCompanies = (businessUnitName: string) => {
  const mainBrand = businessUnitName === 'Derma' ? 'Eucerin' : 'Nivea';
  
  return [
    mainBrand,
    'Competitor 1', 
    'Competitor 2',
    'Competitor 3', 
    'Competitor 4',
    'Competitor 5'
  ];
};

export default function ShareOfVoiceGrid({
  countryId,
  businessUnitId,
  mediaType,
  onSave
}: ShareOfVoiceGridProps) {
  const [sovData, setSOVData] = useState<SOVData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [businessUnitName, setBusinessUnitName] = useState<string>('');
  const [hasExistingData, setHasExistingData] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{category: string, company: string, field: string} | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: { type: 'critical' | 'error' | 'warning', message: string } }>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Load categories and check for existing data when component mounts or dependencies change
  useEffect(() => {
    if (countryId && businessUnitId) {
      loadCategories();
      checkExistingData();
    }
  }, [countryId, businessUnitId, mediaType]);

  // Auto-load existing data when grid is initialized and data is available
  useEffect(() => {
    if (hasExistingData && categories.length > 0 && sovData.length > 0 && !dataLoaded) {
      console.log('Auto-loading existing data after grid initialization');
      loadExistingData();
    }
  }, [hasExistingData, categories.length, sovData.length, dataLoaded]);

  // Load categories based on business unit
  const loadCategories = async () => {
    try {
      const response = await fetch(`/api/admin/share-of-voice/categories?businessUnitId=${businessUnitId}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setBusinessUnitName(data.businessUnitName || '');
        
        // Always initialize grid data with correct business unit
        initializeGridData(data.categories || [], data.businessUnitName || '');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Initialize grid with categories × companies combinations
  const initializeGridData = (categoryList: string[], businessUnit?: string) => {
    const initialData: SOVData[] = [];
    const buName = businessUnit || businessUnitName;
    const defaultCompanies = getDefaultCompanies(buName);
    
    categoryList.forEach(category => {
      defaultCompanies.forEach(company => {
        initialData.push({
          category,
          company,
          totalTvInvestment: 0,
          totalTvTrps: 0,
          totalDigitalSpend: 0,
          totalDigitalImpressions: 0
        });
      });
    });
    
    setSOVData(initialData);
  };

  // Check if existing data exists for this combination
  const checkExistingData = async () => {
    try {
      const response = await fetch(
        `/api/admin/share-of-voice/data?countryId=${countryId}&businessUnitId=${businessUnitId}`
      );
      
      if (response.ok) {
        const existingData = await response.json();
        setHasExistingData(existingData.length > 0);
      }
    } catch (error) {
      console.error('Error checking existing SOV data:', error);
      setHasExistingData(false);
    }
  };

  // Load existing SOV data
  const loadExistingData = async () => {
    if (!hasExistingData) return;

    try {
      const response = await fetch(
        `/api/admin/share-of-voice/data?countryId=${countryId}&businessUnitId=${businessUnitId}`
      );
      
      if (response.ok) {
        const existingData = await response.json();
        
        if (existingData.length > 0) {
          console.log('=== LOAD EXISTING DATA DEBUG ===');
          console.log('Existing data from API:', existingData.length, 'records');
          console.log('Existing data companies:', existingData.map(d => `${d.category}-${d.company}`));
          console.log('Current grid data before merge:', sovData.length, 'rows');
          console.log('Current grid companies:', sovData.map(d => `${d.category}-${d.company}`));
          
          // Rebuild the grid data entirely based on loaded data with correct positioning
          setSOVData(prevData => {
            // Group loaded data by category
            const loadedByCategory = new Map<string, any[]>();
            existingData.forEach((existing: any) => {
              if (!loadedByCategory.has(existing.category)) {
                loadedByCategory.set(existing.category, []);
              }
              loadedByCategory.get(existing.category)!.push({
                id: existing.id,
                category: existing.category,
                company: existing.company,
                position: existing.position || 0, // Use database position
                totalTvInvestment: existing.totalTvInvestment || 0,
                totalTvTrps: existing.totalTvTrps || 0,
                totalDigitalSpend: existing.totalDigitalSpend || 0,
                totalDigitalImpressions: existing.totalDigitalImpressions || 0
              });
            });

            // Sort each category by position
            loadedByCategory.forEach((rows, category) => {
              rows.sort((a, b) => a.position - b.position);
            });

            // Build the final data array in correct order
            const finalData: any[] = [];
            
            // Process each category in alphabetical order
            const sortedCategories = Array.from(loadedByCategory.keys()).sort();
            sortedCategories.forEach(category => {
              const categoryRows = loadedByCategory.get(category)!;
              finalData.push(...categoryRows);
            });

            console.log('=== LOAD POSITION DEBUG ===');
            console.log('Loaded data by category with positions:');
            loadedByCategory.forEach((rows, category) => {
              console.log(`${category}:`);
              rows.forEach(row => {
                console.log(`  Position ${row.position}: ${row.company}`);
              });
            });

            console.log('Final data with position-based ordering:', finalData.length, 'rows');
            console.log('Categories in final data:', [...new Set(finalData.map(r => r.category))]);
            console.log('Companies per category:', 
              Object.fromEntries(
                [...new Set(finalData.map(r => r.category))].map(cat => [
                  cat, 
                  finalData.filter(r => r.category === cat).map(r => r.company)
                ])
              )
            );
            
            return finalData;
          });
          
          setDataLoaded(true);
        }
      }
    } catch (error) {
      console.error('Error loading existing SOV data:', error);
    }
  };

  // Update a specific cell value
  const updateCellValue = (
    category: string, 
    company: string, 
    field: keyof SOVData, 
    value: number | string,
    rowIndex?: number
  ) => {
    // Clear error display when user starts editing after failed save
    // (warnings remain visible as they're allowed)
    if (showValidationErrors) {
      setShowValidationErrors(false);
    }
    
    setSOVData(prevData => {
      return prevData.map((row, index) => {
        // For company field updates, use row index to avoid key conflicts
        if (field === 'company' && rowIndex !== undefined) {
          const targetRow = prevData.find((r, i) => 
            r.category === category && i === rowIndex
          );
          if (row === targetRow) {
            return { ...row, [field]: value };
          }
        } else if (row.category === category && row.company === company) {
          return { ...row, [field]: value };
        }
        return row;
      });
    });
  };

  // Add new competitor row for a category
  const addCompetitorRow = (category: string) => {
    const existingCompetitors = sovData
      .filter(row => row.category === category)
      .map(row => row.company);
    
    // Find the next competitor number
    const competitorNumbers = existingCompetitors
      .filter(name => name.startsWith('Competitor '))
      .map(name => parseInt(name.replace('Competitor ', '')))
      .filter(num => !isNaN(num));
    
    const nextNumber = competitorNumbers.length > 0 ? Math.max(...competitorNumbers) + 1 : existingCompetitors.length;
    const newCompetitorName = `Competitor ${nextNumber}`;
    
    const newRow: SOVData = {
      category,
      company: newCompetitorName,
      totalTvInvestment: 0,
      totalTvTrps: 0,
      totalDigitalSpend: 0,
      totalDigitalImpressions: 0
    };
    
    setSOVData(prevData => [...prevData, newRow]);
  };

  // Remove a competitor row
  const removeCompetitorRow = (category: string, company: string) => {
    // Don't allow deletion if it's the last row for a category
    const categoryRows = sovData.filter(row => row.category === category);
    if (categoryRows.length <= 1) {
      alert('Cannot delete the last competitor for a category');
      return;
    }
    
    setSOVData(prevData => 
      prevData.filter(row => !(row.category === category && row.company === company))
    );
  };

  // Get all data cells in order for navigation
  const getAllDataCells = () => {
    const cells: {category: string, company: string, field: string}[] = [];
    const visibleColumns = getVisibleColumns();
    
    sovData.forEach(row => {
      // Add company field first
      cells.push({category: row.category, company: row.company, field: 'company'});
      // Add data fields
      visibleColumns.forEach(col => {
        cells.push({category: row.category, company: row.company, field: col.key});
      });
    });
    
    return cells;
  };

  // Navigate to a specific cell
  const navigateToCell = (direction: 'up' | 'down' | 'left' | 'right' | 'enter') => {
    if (!focusedCell) return;
    
    const allCells = getAllDataCells();
    const currentIndex = allCells.findIndex(cell => 
      cell.category === focusedCell.category && 
      cell.company === focusedCell.company && 
      cell.field === focusedCell.field
    );
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    const fieldsPerRow = getVisibleColumns().length + 1; // +1 for company field
    
    switch (direction) {
      case 'up':
        nextIndex = currentIndex - fieldsPerRow;
        break;
      case 'down':
      case 'enter':
        nextIndex = currentIndex + fieldsPerRow;
        break;
      case 'left':
        nextIndex = currentIndex - 1;
        break;
      case 'right':
        nextIndex = currentIndex + 1;
        break;
    }
    
    if (nextIndex >= 0 && nextIndex < allCells.length) {
      const nextCell = allCells[nextIndex];
      setFocusedCell(nextCell);
      // Focus the actual input element
      setTimeout(() => {
        const input = document.querySelector(`[data-cell="${nextCell.category}-${nextCell.company}-${nextCell.field}"]`) as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    }
  };

  // Handle multi-cell paste
  const handleMultiPaste = (
    startCategory: string,
    startCompany: string,
    startField: string,
    pastedText: string
  ) => {
    const lines = pastedText.split(/\r?\n/);
    const allCells = getAllDataCells();
    const startIndex = allCells.findIndex(cell => 
      cell.category === startCategory && 
      cell.company === startCompany && 
      cell.field === startField
    );
    
    if (startIndex === -1) return;
    
    const fieldsPerRow = getVisibleColumns().length + 1; // +1 for company field
    
    lines.forEach((line, rowOffset) => {
      if (line.trim() === '') return;
      
      const values = line.split(/\t/);
      values.forEach((value, colOffset) => {
        const targetIndex = startIndex + (rowOffset * fieldsPerRow) + colOffset;
        if (targetIndex < allCells.length) {
          const targetCell = allCells[targetIndex];
          if (targetCell.field === 'company') {
            updateCellValue(targetCell.category, targetCell.company, 'company', value.trim());
          } else {
            const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(numValue)) {
              updateCellValue(targetCell.category, targetCell.company, targetCell.field as keyof SOVData, numValue);
            }
          }
        }
      });
    });
  };

  // Comprehensive validation function
  const validateSOVData = useCallback((): { isValid: boolean, criticalErrors: number, errors: number, warnings: number } => {
    const errors: { [key: string]: { type: 'critical' | 'error' | 'warning', message: string } } = {};
    let criticalCount = 0;
    let errorCount = 0;
    let warningCount = 0;

    const mainBrand = businessUnitName === 'Derma' ? 'Eucerin' : 'Nivea';
    
    // Group data by category for validation
    const dataByCategory = sovData.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = [];
      acc[row.category].push(row);
      return acc;
    }, {} as { [category: string]: SOVData[] });

    Object.entries(dataByCategory).forEach(([category, rows]) => {
      const mainBrandRow = rows.find(r => r.company === mainBrand);
      const competitorRows = rows.filter(r => r.company !== mainBrand);

      // Check if main brand has data
      const mainBrandHasData = mainBrandRow && (
        mediaType === 'tv' 
          ? (mainBrandRow.totalTvInvestment > 0 || mainBrandRow.totalTvTrps > 0)
          : (mainBrandRow.totalDigitalSpend > 0 || mainBrandRow.totalDigitalImpressions > 0)
      );

      // Check each competitor row
      competitorRows.forEach(row => {
        const hasData = mediaType === 'tv' 
          ? (row.totalTvInvestment > 0 || row.totalTvTrps > 0)
          : (row.totalDigitalSpend > 0 || row.totalDigitalImpressions > 0);

        const hasCustomName = row.company && !row.company.startsWith('Competitor ');

        // CRITICAL: Competitor has data but main brand doesn't
        if (hasData && !mainBrandHasData) {
          const errorKey = `${category}-${row.company}-critical`;
          errors[errorKey] = {
            type: 'critical',
            message: `${mainBrand} must have data when competitors have data`
          };
          criticalCount++;
        }

        // ERROR: Custom competitor name but no data
        if (hasCustomName && !hasData) {
          if (mediaType === 'tv') {
            const investmentKey = `${category}-${row.company}-totalTvInvestment`;
            const trpKey = `${category}-${row.company}-totalTvTrps`;
            errors[investmentKey] = {
              type: 'error',
              message: 'Enter investment data for this competitor'
            };
            errors[trpKey] = {
              type: 'error', 
              message: 'Enter TRP data for this competitor'
            };
            errorCount += 2;
          } else {
            const spendKey = `${category}-${row.company}-totalDigitalSpend`;
            const impressionKey = `${category}-${row.company}-totalDigitalImpressions`;
            errors[spendKey] = {
              type: 'error',
              message: 'Enter spend data for this competitor'
            };
            errors[impressionKey] = {
              type: 'error',
              message: 'Enter impression data for this competitor'
            };
            errorCount += 2;
          }
        }

        // ERROR: Incomplete data (one field filled but not the other)
        if (mediaType === 'digital') {
          const hasSpend = (row.totalDigitalSpend || 0) > 0;
          const hasImpressions = (row.totalDigitalImpressions || 0) > 0;
          
          if (hasSpend && !hasImpressions) {
            const impressionKey = `${category}-${row.company}-totalDigitalImpressions`;
            errors[impressionKey] = {
              type: 'error',
              message: 'Enter impressions when spend is provided'
            };
            errorCount++;
          }
          
          if (hasImpressions && !hasSpend) {
            const spendKey = `${category}-${row.company}-totalDigitalSpend`;
            errors[spendKey] = {
              type: 'error',
              message: 'Enter spend when impressions are provided'
            };
            errorCount++;
          }
        } else {
          const hasInvestment = (row.totalTvInvestment || 0) > 0;
          const hasTrps = (row.totalTvTrps || 0) > 0;
          
          if (hasInvestment && !hasTrps) {
            const trpKey = `${category}-${row.company}-totalTvTrps`;
            errors[trpKey] = {
              type: 'error',
              message: 'Enter TRPs when investment is provided'
            };
            errorCount++;
          }
          
          if (hasTrps && !hasInvestment) {
            const investmentKey = `${category}-${row.company}-totalTvInvestment`;
            errors[investmentKey] = {
              type: 'error',
              message: 'Enter investment when TRPs are provided'
            };
            errorCount++;
          }
        }

        // WARNING: Investment > TRP or Spend > Impressions (unusual ratios)
        if (mediaType === 'tv' && row.totalTvInvestment > 0 && row.totalTvTrps > 0) {
          if (row.totalTvInvestment > row.totalTvTrps * 1000) { // Rough threshold
            const investmentWarningKey = `${category}-${row.company}-totalTvInvestment`;
            const trpWarningKey = `${category}-${row.company}-totalTvTrps`;
            errors[investmentWarningKey] = {
              type: 'warning',
              message: 'Investment seems high compared to TRPs (consider reviewing)'
            };
            errors[trpWarningKey] = {
              type: 'warning',
              message: 'Investment seems high compared to TRPs (consider reviewing)'
            };
            warningCount += 2;
          }
        }

        if (mediaType === 'digital' && row.totalDigitalSpend > 0 && row.totalDigitalImpressions > 0) {
          // Simple check: if spend is higher than impressions, that's definitely unusual
          if (row.totalDigitalSpend > row.totalDigitalImpressions) {
            const spendWarningKey = `${category}-${row.company}-totalDigitalSpend`;
            const impressionsWarningKey = `${category}-${row.company}-totalDigitalImpressions`;
            errors[spendWarningKey] = {
              type: 'warning',
              message: `Spend (${row.totalDigitalSpend}) is higher than impressions (${row.totalDigitalImpressions}) - please review`
            };
            errors[impressionsWarningKey] = {
              type: 'warning',
              message: `Spend (${row.totalDigitalSpend}) is higher than impressions (${row.totalDigitalImpressions}) - please review`
            };
            warningCount += 2;
          } else {
            // Calculate CPM for more detailed warnings
            const costPerMille = (row.totalDigitalSpend / row.totalDigitalImpressions) * 1000;
            if (costPerMille > 50) { // High CPM warning
              const spendWarningKey = `${category}-${row.company}-totalDigitalSpend`;
              const impressionsWarningKey = `${category}-${row.company}-totalDigitalImpressions`;
              errors[spendWarningKey] = {
                type: 'warning',
                message: `High CPM: ${costPerMille.toFixed(2)} (consider reviewing spend vs impressions)`
              };
              errors[impressionsWarningKey] = {
                type: 'warning',
                message: `High CPM: ${costPerMille.toFixed(2)} (consider reviewing spend vs impressions)`
              };
              warningCount += 2;
            }
          }
        }
      });

      // Additional validations for main brand
      if (mainBrandRow) {
        // WARNING: Main brand has zero data in category with competitor data
        const hasCompetitorData = competitorRows.some(row => 
          mediaType === 'tv' 
            ? (row.totalTvInvestment > 0 || row.totalTvTrps > 0)
            : (row.totalDigitalSpend > 0 || row.totalDigitalImpressions > 0)
        );

        if (hasCompetitorData && !mainBrandHasData) {
          const warningKey = `${category}-${mainBrand}-missing-data`;
          errors[warningKey] = {
            type: 'warning',
            message: `Consider adding ${mainBrand} data for complete analysis`
          };
          warningCount++;
        }

        // ERROR: Negative values
        if (mediaType === 'tv') {
          if (mainBrandRow.totalTvInvestment < 0) {
            errors[`${category}-${mainBrand}-totalTvInvestment`] = {
              type: 'error',
              message: 'Investment cannot be negative'
            };
            errorCount++;
          }
          if (mainBrandRow.totalTvTrps < 0) {
            errors[`${category}-${mainBrand}-totalTvTrps`] = {
              type: 'error',
              message: 'TRPs cannot be negative'
            };
            errorCount++;
          }
        } else {
          if (mainBrandRow.totalDigitalSpend < 0) {
            errors[`${category}-${mainBrand}-totalDigitalSpend`] = {
              type: 'error',
              message: 'Spend cannot be negative'
            };
            errorCount++;
          }
          if (mainBrandRow.totalDigitalImpressions < 0) {
            errors[`${category}-${mainBrand}-totalDigitalImpressions`] = {
              type: 'error',
              message: 'Impressions cannot be negative'
            };
            errorCount++;
          }
        }
      }
    });

    console.log('=== VALIDATION ERRORS DEBUG ===');
    console.log('Generated errors:', errors);
    console.log('Error keys:', Object.keys(errors));
    console.log('Counts:', { criticalCount, errorCount, warningCount });
    
    setValidationErrors(errors);
    return {
      isValid: criticalCount === 0 && errorCount === 0,
      criticalErrors: criticalCount,
      errors: errorCount,
      warnings: warningCount
    };
  }, [sovData, mediaType, businessUnitName]);

  // Always validate for warnings (immediate feedback), only show errors after save attempt
  useEffect(() => {
    if (sovData.length > 0 && businessUnitName) {
      validateSOVData();
    }
  }, [sovData, mediaType, businessUnitName, validateSOVData]);

  // Save SOV data
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    // Show validation errors when user tries to save
    setShowValidationErrors(true);
    
    // Run validation before saving
    const validation = validateSOVData();
    
    console.log('=== VALIDATION DEBUG ===');
    console.log('Validation result:', validation);
    console.log('Current validation errors:', validationErrors);
    console.log('Data being validated:', sovData.slice(0, 3));
    console.log('Media type:', mediaType);
    console.log('Business unit:', businessUnitName);
    
    // Only block save for critical errors and regular errors, allow warnings
    if (!validation.isValid) {
      setSaving(false);
      // Validation errors are now visible in the UI
      return;
    }

    // Save all rows in the grid - this ensures the complete structure is preserved
    const dataToSave = sovData.filter(row => {
      // Only filter out completely empty rows (no company name)
      return row.company && row.company.trim() !== '';
    });
    
    console.log('=== SAVE DEBUG INFO ===');
    console.log('Total rows in grid:', sovData.length);
    console.log('Rows being saved:', dataToSave.length);
    console.log('Companies being saved:', dataToSave.map(r => r.company));
    console.log('Data preview:', dataToSave.slice(0, 3));

    try {
      const response = await fetch('/api/admin/share-of-voice/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId,
          businessUnitId,
          mediaType,
          data: dataToSave
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Server error ${response.status}: ${errorText}` };
        }
        throw new Error(errorData.error || `Failed to save SOV data (${response.status})`);
      }

      setSaveSuccess(true);
      setShowValidationErrors(false); // Clear validation errors on successful save
      onSave?.(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error: any) {
      console.error('=== SAVE ERROR DETAILS ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Data being saved:', dataToSave);
      console.error('Request payload:', {
        countryId,
        businessUnitId,
        mediaType,
        dataLength: dataToSave.length
      });
      console.error('=== END SAVE ERROR ===');
      onSave?.(false);
    } finally {
      setSaving(false);
    }
  };

  // Get visible columns based on media type
  const getVisibleColumns = () => {
    if (mediaType === 'tv') {
      return [
        { key: 'totalTvInvestment', label: 'TV Investment', type: 'currency' },
        { key: 'totalTvTrps', label: 'TV TRPs', type: 'number' }
      ];
    } else {
      return [
        { key: 'totalDigitalSpend', label: 'Digital Spend', type: 'currency' },
        { key: 'totalDigitalImpressions', label: 'Digital Impressions', type: 'number' }
      ];
    }
  };

  // Group data by category
  const getGroupedData = () => {
    const grouped: { [category: string]: SOVData[] } = {};
    
    sovData.forEach(row => {
      if (!grouped[row.category]) {
        grouped[row.category] = [];
      }
      grouped[row.category].push(row);
    });
    
    return grouped;
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">Loading categories...</p>
      </div>
    );
  }

  const visibleColumns = getVisibleColumns();
  const groupedData = getGroupedData();

  console.log('=== GRID RENDER DEBUG ===');
  console.log('Total sovData rows:', sovData.length);
  console.log('Categories:', Object.keys(groupedData));
  
  // Show detailed breakdown per category
  Object.entries(groupedData).forEach(([category, rows]) => {
    console.log(`${category} (${(rows as any[]).length} companies):`);
    (rows as any[]).forEach((row: any, index: number) => {
      console.log(`  ${index}: ${row.company} (${row.totalDigitalSpend || 0}/${row.totalDigitalImpressions || 0})`);
    });
  });
  
  console.log('Full sovData companies:', sovData.map((r, i) => `${i}: ${r.category}: ${r.company}`));

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h4 className="font-medium text-gray-900">
            {businessUnitName === 'Derma' ? 'Eucerin' : businessUnitName} Categories
            {dataLoaded && <span className="text-sm text-green-600 ml-2">(Existing data loaded)</span>}
            {hasExistingData && !dataLoaded && <span className="text-sm text-blue-600 ml-2">(Data available - click Load Existing)</span>}
          </h4>
          
          {/* Validation Status - always show warnings, only show errors after save attempt */}
          {sovData.length > 0 && (() => {
            // Count validation errors without calling validateSOVData() to avoid infinite renders
            const criticalCount = showValidationErrors ? Object.values(validationErrors).filter(e => e.type === 'critical').length : 0;
            const errorCount = showValidationErrors ? Object.values(validationErrors).filter(e => e.type === 'error').length : 0;
            const warningCount = Object.values(validationErrors).filter(e => e.type === 'warning').length; // Always show warnings
            
            // Only show status if there are visible issues
            if (criticalCount === 0 && errorCount === 0 && warningCount === 0) {
              return null;
            }
            
            if (criticalCount > 0) {
              return (
                <div className="flex items-center text-red-600">
                  <FiAlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{criticalCount} Critical</span>
                </div>
              );
            } else if (errorCount > 0) {
              return (
                <div className="flex items-center text-orange-600">
                  <FiAlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{errorCount} Errors</span>
                </div>
              );
            } else if (warningCount > 0) {
              return (
                <div className="flex items-center text-yellow-600">
                  <FiAlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{warningCount} Warnings</span>
                </div>
              );
            } else {
              return (
                <div className="flex items-center text-green-600">
                  <FiCheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Valid</span>
                </div>
              );
            }
          })()}
        </div>
        <div className="flex space-x-2">
          {saveSuccess && (
            <div className="flex items-center text-green-600">
              <FiCheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          <button
            onClick={loadExistingData}
            disabled={!hasExistingData}
            className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${
              hasExistingData
                ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100'
                : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
            }`}
          >
            <FiRefreshCw className="h-4 w-4 mr-2" />
            Load Existing
          </button>
          {(() => {
            // Only count errors when validation is being shown
            const criticalCount = showValidationErrors ? Object.values(validationErrors).filter(e => e.type === 'critical').length : 0;
            const errorCount = showValidationErrors ? Object.values(validationErrors).filter(e => e.type === 'error').length : 0;
            const warningCount = showValidationErrors ? Object.values(validationErrors).filter(e => e.type === 'warning').length : 0;
            const hasBlockingErrors = criticalCount > 0 || errorCount > 0;
            
            return (
              <button
                onClick={handleSave}
                disabled={saving || categories.length === 0 || hasBlockingErrors}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  hasBlockingErrors 
                    ? 'bg-red-100 text-red-700 border border-red-300 cursor-not-allowed'
                    : warningCount > 0
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-300 hover:bg-yellow-100'
                    : saving
                    ? 'bg-blue-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={
                  hasBlockingErrors 
                    ? `Cannot save: ${criticalCount + errorCount} errors must be fixed first`
                    : warningCount > 0
                    ? `${warningCount} warnings - click to save anyway`
                    : 'Save data'
                }
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : hasBlockingErrors ? (
                  <>
                    <FiAlertCircle className="h-4 w-4 mr-2" />
                    Cannot Save ({criticalCount + errorCount} errors)
                  </>
                ) : warningCount > 0 ? (
                  <>
                    <FiAlertTriangle className="h-4 w-4 mr-2" />
                    Save ({warningCount} warnings)
                  </>
                ) : (
                  <>
                    <FiSave className="h-4 w-4 mr-2" />
                    Save Data
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Grid */}
      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-lg">
        <div className="overflow-auto" style={{ maxHeight: '600px' }}>
          {/* Header Row */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300 grid grid-cols-12 gap-0 shadow-sm z-10">
            <div className="col-span-2 px-4 py-3 text-sm font-bold text-slate-800 border-r border-slate-200 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <span className="tracking-wide">Category</span>
            </div>
            <div className="col-span-2 px-4 py-3 text-sm font-bold text-slate-800 border-r border-slate-200 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <span className="tracking-wide">Company</span>
            </div>
            {visibleColumns.map((column) => (
              <div key={column.key} className="col-span-3 px-4 py-3 text-sm font-bold text-slate-800 border-r border-slate-200 text-center flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
                <span className="tracking-wide">{column.label}</span>
              </div>
            ))}
            <div className="col-span-2 px-4 py-3 text-sm font-bold text-slate-800 border-r border-slate-200 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <span className="tracking-wide">Actions</span>
            </div>
          </div>
          
          {/* Data Rows */}
          {Object.entries(groupedData).map(([category, rows]) => (
            <div key={category}>
              {rows.map((row, rowIndex) => {
                const isEvenRow = rowIndex % 2 === 0;
                const categoryRows = sovData.filter(r => r.category === row.category);
                const canDelete = categoryRows.length > 1;
                const mainBrand = businessUnitName === 'Derma' ? 'Eucerin' : 'Nivea';
                const isMainBrand = row.company === mainBrand;
                
                // Find the actual index in sovData by finding the rowIndex-th item in this category
                const categoryStartIndex = sovData.findIndex(r => r.category === row.category);
                const globalRowIndex = categoryStartIndex + rowIndex;
                
                return (
                  <div 
                    key={`${row.category}-${globalRowIndex}`}
                    className={`grid grid-cols-12 gap-0 border-b border-slate-200 transition-colors duration-150 hover:bg-slate-50 ${
                      isMainBrand 
                        ? 'bg-slate-100 border-l-4 border-l-blue-400' // Darker light grey with blue accent for main brand
                        : isEvenRow ? 'bg-white' : 'bg-slate-25'
                    }`}
                  >
                    {/* Category */}
                    <div className="col-span-2 px-3 py-2 text-sm font-medium text-slate-900 border-r border-slate-200 flex items-center">
                      {row.category}
                    </div>
                    
                    {/* Company - Editable */}
                    <div className="col-span-2 border-r border-slate-200 p-0">
                      <input
                        type="text"
                        value={row.company}
                        data-cell={`${row.category}-${row.company}-company`}
                        onChange={(e) => updateCellValue(row.category, row.company, 'company', e.target.value, globalRowIndex)}
                        onFocus={() => setFocusedCell({category: row.category, company: row.company, field: 'company'})}
                        onKeyDown={(e) => {
                          switch(e.key) {
                            case 'ArrowUp':
                              e.preventDefault();
                              navigateToCell('up');
                              break;
                            case 'ArrowDown':
                            case 'Enter':
                              e.preventDefault();
                              navigateToCell('down');
                              break;
                            case 'ArrowLeft':
                              if (e.currentTarget.selectionStart === 0) {
                                e.preventDefault();
                                navigateToCell('left');
                              }
                              break;
                            case 'ArrowRight':
                              if (e.currentTarget.selectionStart === e.currentTarget.value.length) {
                                e.preventDefault();
                                navigateToCell('right');
                              }
                              break;
                          }
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData?.getData('text') || '';
                          if (pastedText.includes('\t') || pastedText.includes('\n')) {
                            e.preventDefault();
                            handleMultiPaste(row.category, row.company, 'company', pastedText);
                          }
                        }}
                        className={`w-full h-10 px-3 text-sm border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent ${
                          isMainBrand ? 'font-semibold text-slate-800' : 'font-normal'
                        }`}
                        placeholder="Company name"
                      />
                    </div>
                    
                    {/* Data Cells */}
                    {visibleColumns.map((column) => {
                      const value = row[column.key as keyof SOVData] as number || 0;
                      const displayValue = value === 0 ? '' : value;
                      
                      // Check for validation errors on this specific cell
                      const cellErrorKey = `${row.category}-${row.company}-${column.key}`;
                      const cellError = validationErrors[cellErrorKey];
                      const criticalErrorKey = `${row.category}-${row.company}-critical`;
                      const criticalError = validationErrors[criticalErrorKey];
                      
                      // Debug logging for first few cells
                      if (Object.keys(validationErrors).length > 0 && rowIndex === 0) {
                        console.log(`Validation check for ${cellErrorKey}:`, {
                          cellError,
                          criticalError,
                          allErrors: Object.keys(validationErrors)
                        });
                      }
                      
                      // Determine styling based on error type
                      // Warnings: Always show immediately (user can save with warnings)
                      // Errors/Critical: Only show after save attempt (blocks save)
                      const hasValidationIcon = (cellError?.type === 'warning') || (showValidationErrors && (cellError || criticalError));
                      const paddingRight = hasValidationIcon ? 'pr-8' : 'pr-3'; // Make room for icon
                      
                      let inputClasses = `w-full h-10 pl-3 ${paddingRight} text-sm text-center border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
                      
                      // Always show warnings immediately
                      if (cellError?.type === 'warning') {
                        inputClasses = `w-full h-10 pl-3 ${paddingRight} text-sm text-center border-l-4 border-yellow-500 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-yellow-100 text-yellow-900 placeholder-yellow-600`;
                      }
                      
                      // Only show errors/critical after save attempt
                      if (showValidationErrors) {
                        if (criticalError) {
                          inputClasses = `w-full h-10 pl-3 ${paddingRight} text-sm text-center border-l-4 border-red-500 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-red-100 text-red-900 placeholder-red-500`;
                        } else if (cellError?.type === 'error') {
                          inputClasses = `w-full h-10 pl-3 ${paddingRight} text-sm text-center border-l-4 border-red-500 focus:ring-2 focus:ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-red-100 text-red-900 placeholder-red-500`;
                        }
                      }
                      
                      return (
                        <div key={column.key} className="col-span-3 border-r border-slate-200 p-0 relative group">
                          {/* Tooltip: Always show warnings, only show errors/critical after save attempt */}
                          {((cellError?.type === 'warning') || (showValidationErrors && (cellError || criticalError))) && (
                            <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              {criticalError?.message || cellError?.message}
                            </div>
                          )}
                          
                          {/* Input wrapper to position icon */}
                          <div className="relative flex items-center">
                            <input
                            type="number"
                            step={column.type === 'currency' ? '0.01' : '1'}
                            min="0"
                            value={displayValue}
                            data-cell={`${row.category}-${row.company}-${column.key}`}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                updateCellValue(row.category, row.company, column.key as keyof SOVData, 0);
                              } else {
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue)) {
                                  updateCellValue(row.category, row.company, column.key as keyof SOVData, numValue);
                                }
                              }
                            }}
                            onFocus={() => setFocusedCell({category: row.category, company: row.company, field: column.key})}
                            onKeyDown={(e) => {
                              switch(e.key) {
                                case 'ArrowUp':
                                  e.preventDefault();
                                  navigateToCell('up');
                                  break;
                                case 'ArrowDown':
                                case 'Enter':
                                  e.preventDefault();
                                  navigateToCell('down');
                                  break;
                                case 'ArrowLeft':
                                  if (e.currentTarget.selectionStart === 0) {
                                    e.preventDefault();
                                    navigateToCell('left');
                                  }
                                  break;
                                case 'ArrowRight':
                                  if (e.currentTarget.selectionStart === e.currentTarget.value.length) {
                                    e.preventDefault();
                                    navigateToCell('right');
                                  }
                                  break;
                              }
                            }}
                            onPaste={(e) => {
                              const pastedText = e.clipboardData?.getData('text') || '';
                              if (pastedText.includes('\t') || pastedText.includes('\n')) {
                                e.preventDefault();
                                handleMultiPaste(row.category, row.company, column.key, pastedText);
                              }
                            }}
                            className={inputClasses}
                            placeholder={column.type === 'currency' ? '0.00' : '0'}
                          />
                          
                          {/* Small icon inside cell like game plans grid */}
                          {((cellError?.type === 'warning') || (showValidationErrors && (cellError || criticalError))) && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                              {showValidationErrors && criticalError && <FiAlertCircle className="h-3 w-3 text-red-500" />}
                              {showValidationErrors && cellError?.type === 'error' && <FiAlertCircle className="h-3 w-3 text-red-500" />}
                              {cellError?.type === 'warning' && <FiAlertTriangle className="h-3 w-3 text-yellow-600" />}
                            </div>
                          )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Actions */}
                    <div className="col-span-2 border-r border-slate-200 p-1 flex items-center justify-center space-x-1">
                      <button
                        onClick={() => addCompetitorRow(row.category)}
                        disabled={isMainBrand}
                        className={`p-1 rounded ${
                          isMainBrand 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                        title={isMainBrand ? "Cannot add competitor for main brand" : "Add competitor"}
                      >
                        <FiPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeCompetitorRow(row.category, row.company)}
                        disabled={!canDelete || isMainBrand}
                        className={`p-1 rounded ${
                          (canDelete && !isMainBrand)
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          isMainBrand 
                            ? "Cannot delete main brand" 
                            : !canDelete 
                              ? "Cannot delete last competitor" 
                              : "Delete competitor"
                        }
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Data Entry</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Edit company names directly in the grid</li>
              <li>• Enter {mediaType === 'tv' ? 'investment and TRP' : 'spend and impression'} values in the data columns</li>
              <li>• Use the Actions column to add (➕) or delete (🗑️) competitors for each category</li>
              <li>• Cannot delete the last competitor in a category (at least one must remain)</li>
              <li>• Use copy-paste to import data from Excel spreadsheets</li>
              <li>• Only non-zero data will be saved to the database</li>
              <li>• Data will replace existing {mediaType.toUpperCase()} SOV data for this country/business unit</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Validation Rules</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <span className="bg-red-100 text-red-800 px-1 rounded">Critical</span>: Competitor data without {businessUnitName === 'Derma' ? 'Eucerin' : 'Nivea'} data</li>
              <li>• <span className="bg-orange-100 text-orange-800 px-1 rounded">Error</span>: Custom company name without data values</li>
              <li>• <span className="bg-orange-100 text-orange-800 px-1 rounded">Error</span>: Incomplete data pairs - both fields required</li>
              <li>• <span className="bg-orange-100 text-orange-800 px-1 rounded">Error</span>: Negative values not allowed</li>
              <li>• <span className="bg-yellow-100 text-yellow-800 px-1 rounded">Warning</span>: High {mediaType === 'tv' ? 'investment vs TRP ratio' : 'CPM values'}</li>
              <li>• <span className="bg-yellow-100 text-yellow-800 px-1 rounded">Warning</span>: Missing {businessUnitName === 'Derma' ? 'Eucerin' : 'Nivea'} data when competitors exist</li>
              <li>• Red/orange errors disable save button; yellow warnings allow saving</li>
              <li>• Hover over colored cells to see detailed error messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}