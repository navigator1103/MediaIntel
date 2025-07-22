'use client';

import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiCopy } from 'react-icons/fi';

interface TargetAudience {
  id: string;
  gender: string;
  minAge: number;
  maxAge: number;
  sel: string;
  finalTarget: string;
  saturationPoint: number;
}

interface CurveData {
  budget: number;
  frequency: number; // Single frequency per budget level
  reaches: { [audienceId: string]: number };
}

interface SaturationData {
  saturationPoint: number; // reach percentage
  saturationBudget: number; // Budget level
}

interface DigitalCurvesTableProps {
  countryId: number;
  businessUnitId: number;
  audiences: TargetAudience[];
  onSave?: (success: boolean) => void;
}

const STANDARD_BUDGETS = [
  50000, 75000, 100000, 150000, 200000, 250000, 300000, 400000, 500000, 600000,
  750000, 900000, 1000000, 1250000, 1500000, 1750000, 2000000, 2500000, 3000000, 4000000
];

export default function DigitalCurvesTable({
  countryId,
  businessUnitId,
  audiences,
  onSave
}: DigitalCurvesTableProps) {
  const [curves, setCurves] = useState<CurveData[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [saturationData, setSaturationData] = useState<{ [audienceId: string]: SaturationData }>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Initialize curves when audiences change
  useEffect(() => {
    const initialCurves: CurveData[] = STANDARD_BUDGETS.map(budget => ({
      budget,
      frequency: 0, // Single frequency per budget level
      reaches: audiences.reduce((acc, audience) => ({
        ...acc,
        [audience.id]: 0
      }), {})
    }));
    setCurves(initialCurves);
    
    // Auto-load existing curves data when real (non-default) audiences are loaded
    if (audiences.length > 1 || (audiences.length === 1 && (audiences[0].finalTarget !== 'F 18-45' || audiences[0].saturationPoint > 0))) {
      // Only auto-load if this isn't just the default initial audience
      setTimeout(() => loadExistingData(), 100); // Small delay to ensure state is stable
    }
  }, [audiences]);

  // Load existing curves data when Refresh button is clicked
  const loadExistingData = async () => {
    if (!countryId || !businessUnitId || audiences.length === 0) {
      return;
    }

    try {
      // Load curves data
      const curvesResponse = await fetch(`/api/admin/digital-diminishing-returns/curves?countryId=${countryId}&businessUnitId=${businessUnitId}`);
      
      if (curvesResponse.ok) {
        const savedCurves = await curvesResponse.json();
        
        if (savedCurves.length > 0) {
          // Update curves with saved data
          setCurves(prev => {
            const newCurves = prev.map(curve => {
              const savedCurve = savedCurves.find((saved: any) => saved.budget === curve.budget);
              if (savedCurve) {
                const newReaches: { [audienceId: string]: number } = { ...curve.reaches };
                
                // Map saved reach values to current audience IDs
                audiences.forEach((audience, index) => {
                  const reachField = `audience${index + 1}Reach` as keyof typeof savedCurve;
                  const savedReach = savedCurve[reachField];
                  
                  if (savedReach != null && savedReach > 0) {
                    newReaches[audience.id] = savedReach;
                  }
                });
                
                return {
                  ...curve,
                  frequency: savedCurve.frequency || 0, // Single frequency per budget level
                  reaches: newReaches
                };
              }
              return curve;
            });
            return newCurves;
          });
          setDataLoaded(true);
        }
      }

      // Load saturation data from audiences
      const audienceResponse = await fetch(`/api/admin/digital-diminishing-returns/audiences?countryId=${countryId}&businessUnitId=${businessUnitId}`);
      if (audienceResponse.ok) {
        const savedAudiences = await audienceResponse.json();
        const newSaturationData: { [audienceId: string]: SaturationData } = {};
        
        audiences.forEach(audience => {
          const savedAudience = savedAudiences.find((saved: any) => 
            saved.finalTarget === audience.finalTarget
          );
          if (savedAudience && savedAudience.saturationPoint > 0) {
            newSaturationData[audience.id] = {
              saturationPoint: savedAudience.saturationPoint,
              saturationBudget: savedAudience.saturationBudget || 0
            };
          }
        });
        
        setSaturationData(prev => ({ ...prev, ...newSaturationData }));
      }
      
    } catch (error) {
      console.error('Failed to load existing data:', error);
    }
  };

  // Calculate saturation data when curves change
  useEffect(() => {
    if (curves.length === 0) return;

    const newSaturationData: { [audienceId: string]: SaturationData } = {};
    audiences.forEach(audience => {
      const satData = calculateSaturation(audience.id);
      if (satData.saturationPoint > 0 || satData.saturationBudget > 0) {
        newSaturationData[audience.id] = satData;
      }
    });
    
    setSaturationData(prev => ({ ...prev, ...newSaturationData }));
  }, [curves, audiences]);

  // Calculate saturation point and Budget for an audience
  const calculateSaturation = (audienceId: string): SaturationData => {
    // Get all curves with valid reach data, sorted by Budget
    const validCurves = curves
      .map(curve => ({
        budget: curve.budget,
        reach: curve.reaches[audienceId] || 0
      }))
      .filter(item => item.reach > 0) // Only include positive reach values
      .sort((a, b) => a.budget - b.budget); // Ensure Budget ascending order
    
    if (validCurves.length < 2) {
      return { saturationPoint: 0, saturationBudget: 0 };
    }
    
    // Calculate differences between consecutive reach values
    for (let i = 0; i < validCurves.length - 1; i++) {
      const current = validCurves[i + 1];
      const previous = validCurves[i];
      const diff = current.reach - previous.reach;
      
      // Check if difference is <= 0.701% and > 0
      if (diff <= 0.701 && diff > 0) {
        return {
          saturationPoint: current.reach,
          saturationBudget: current.budget
        };
      }
    }
    
    // If no saturation point found, return empty values
    return { saturationPoint: 0, saturationBudget: 0 };
  };

  const updateReach = (budgetIndex: number, audienceId: string, value: number) => {
    setCurves(prev => prev.map((curve, index) => {
      if (index === budgetIndex) {
        return {
          ...curve,
          reaches: {
            ...curve.reaches,
            [audienceId]: value
          }
        };
      }
      return curve;
    }));

    // Clear validation errors for this cell
    const errorKey = `reach-${budgetIndex}-${audienceId}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const updateFrequency = (budgetIndex: number, value: number) => {
    setCurves(prev => prev.map((curve, index) => {
      if (index === budgetIndex) {
        return {
          ...curve,
          frequency: value
        };
      }
      return curve;
    }));

    // Clear validation errors for this cell
    const errorKey = `freq-${budgetIndex}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const copyColumnValues = (fromAudienceId: string, toAudienceId: string) => {
    setCurves(prev => prev.map(curve => ({
      ...curve,
      reaches: {
        ...curve.reaches,
        [toAudienceId]: curve.reaches[fromAudienceId] || 0
      }
    })));
  };

  const handleMultiPaste = (startBudgetIndex: number, audienceId: string | null, pastedText: string, dataType: 'reach' | 'frequency') => {
    // Split pasted text by various delimiters and clean up
    let values = pastedText
      .split(/[\n\r\t,]/) // Split by newline, carriage return, tab, or comma
      .map(v => v.trim().replace(/[^\d.-]/g, '')) // Remove non-numeric characters except digits, dots, and minus
      .filter(v => v !== '' && v !== '.' && v !== '-') // Filter out empty or invalid strings
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    // If no valid values found, try splitting by spaces as well
    if (values.length === 0) {
      values = pastedText
        .split(/[\s\n\r\t,]+/) // Split by any whitespace, newline, tab, or comma
        .map(v => v.trim().replace(/[^\d.-]/g, ''))
        .filter(v => v !== '' && v !== '.' && v !== '-')
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));
    }

    if (values.length === 0) {
      return;
    }

    // Update consecutive cells starting from the current position
    setCurves(prev => {
      const newCurves = [...prev];
      
      values.forEach((value, index) => {
        const targetIndex = startBudgetIndex + index;
        if (targetIndex < newCurves.length && value >= 0) {
          const maxValue = dataType === 'reach' ? 100 : 10; // Reach: 0-100%, Frequency: reasonable limit
          if (value <= maxValue) {
            if (dataType === 'reach' && audienceId) {
              newCurves[targetIndex] = {
                ...newCurves[targetIndex],
                reaches: {
                  ...newCurves[targetIndex].reaches,
                  [audienceId]: value
                }
              };
            } else if (dataType === 'frequency') {
              newCurves[targetIndex] = {
                ...newCurves[targetIndex],
                frequency: value
              };
            }
          }
        }
      });
      
      return newCurves;
    });
  };

  const validateCurves = (): boolean => {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    curves.forEach((curve, budgetIndex) => {
      const frequency = curve.frequency || 0;
      const freqErrorKey = `freq-${budgetIndex}`;
      
      // Check frequency values
      if (frequency < 0) {
        errors[freqErrorKey] = 'Frequency cannot be negative';
        isValid = false;
      }
      if (frequency > 10) {
        errors[freqErrorKey] = 'Frequency seems unusually high (>10)';
        // Don't set isValid = false for this warning
      }
      
      audiences.forEach(audience => {
        const reach = curve.reaches[audience.id] || 0;
        const reachErrorKey = `reach-${budgetIndex}-${audience.id}`;

        // Check reach values
        if (reach < 0) {
          errors[reachErrorKey] = 'Reach cannot be negative';
          isValid = false;
        }
        if (reach > 100) {
          errors[reachErrorKey] = 'Reach cannot exceed 100%';
          isValid = false;
        }


        // Check if reach is generally increasing (warning, not error)
        if (budgetIndex > 0) {
          const prevReach = curves[budgetIndex - 1]?.reaches[audience.id] || 0;
          if (reach < prevReach && reach > 0 && prevReach > 0) {
            errors[reachErrorKey] = 'Reach generally increases with higher budgets';
            // Don't set isValid = false for this warning
          }
        }
      });
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateCurves()) {
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      // Prepare audience data with calculated saturation data
      const audienceData = audiences.map(aud => {
        const satData = saturationData[aud.id] || { saturationPoint: 0, saturationBudget: null };
        return {
          gender: aud.gender,
          minAge: aud.minAge,
          maxAge: aud.maxAge,
          sel: aud.sel || null,
          finalTarget: aud.finalTarget,
          saturationPoint: satData.saturationPoint > 0 ? satData.saturationPoint : 0,
          saturationBudget: satData.saturationBudget > 0 ? satData.saturationBudget : null
        };
      });
      
      // Save target audiences with calculated saturation data
      const audienceResponse = await fetch('/api/admin/digital-diminishing-returns/audiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId,
          businessUnitId,
          audiences: audienceData
        })
      });

      if (!audienceResponse.ok) {
        const errorText = await audienceResponse.text();
        throw new Error(`Failed to save audiences: ${errorText}`);
      }

      // Save curves data
      const curvesResponse = await fetch('/api/admin/digital-diminishing-returns/curves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId,
          businessUnitId,
          curves: curves.map(curve => ({
            budget: curve.budget,
            frequency: curve.frequency,
            audience1Reach: audiences[0] ? curve.reaches[audiences[0].id] : null,
            audience2Reach: audiences[1] ? curve.reaches[audiences[1].id] : null,
            audience3Reach: audiences[2] ? curve.reaches[audiences[2].id] : null,
            audience4Reach: audiences[3] ? curve.reaches[audiences[3].id] : null,
            audience5Reach: audiences[4] ? curve.reaches[audiences[4].id] : null,
          }))
        })
      });

      if (!curvesResponse.ok) {
        throw new Error('Failed to save curves');
      }

      setSaveSuccess(true);
      onSave?.(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error: any) {
      console.error('Save error:', error);
      onSave?.(false);
    } finally {
      setSaving(false);
    }
  };

  const refreshData = async () => {
    await loadExistingData();
  };

  const formatBudget = (budget: number) => {
    if (budget >= 1000000) {
      return `$${(budget / 1000000).toFixed(1)}M`;
    }
    return `$${(budget / 1000)}K`;
  };

  if (audiences.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-500">
          <FiRefreshCw className="h-8 w-8 mx-auto mb-4" />
          <p>Please define target audiences first to generate the curves table.</p>
        </div>
      </div>
    );
  }

  // Debug: Log audiences to console
  console.log('Digital Curves - Audiences received:', audiences.length, audiences.map(a => a.finalTarget));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Budget vs Reach & Frequency Curves</h3>
            <p className="text-sm text-gray-500 mt-1">
              Enter reach percentages and frequency values for each budget level and target audience {dataLoaded && '(Data auto-loaded)'} • {audiences.length} audience{audiences.length !== 1 ? 's' : ''} defined
            </p>
          </div>
          <div className="flex space-x-2">
            {saveSuccess && (
              <div className="flex items-center text-green-600">
                <FiCheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Saved</span>
              </div>
            )}
            <button
              onClick={refreshData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
            <button
              onClick={handleSave}
              disabled={saving || audiences.length === 0}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4 mr-2" />
                  Save Data
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* Audience Info Cards */}
          <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${audiences.length}, 1fr)` }}>
            {audiences.map((audience, index) => {
              const satData = saturationData[audience.id];
              return (
                <div key={audience.id} className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                  <div className="font-semibold text-green-900 mb-1">{audience.finalTarget}</div>
                  {satData && satData.saturationPoint > 0 && (
                    <div className="text-xs space-y-1">
                      <div className="text-green-600 font-medium">
                        Sat: {satData.saturationPoint.toFixed(2)}%
                      </div>
                      <div className="text-blue-600 font-medium">
                        Budget: {formatBudget(satData.saturationBudget)}
                      </div>
                    </div>
                  )}
                  {(!satData || satData.saturationPoint === 0) && (
                    <div className="text-xs text-gray-500">
                      No saturation detected
                    </div>
                  )}
                  {index > 0 && (
                    <div className="flex space-x-1 mt-2 justify-center">
                      <button
                        onClick={() => copyColumnValues(audiences[0].id, audience.id)}
                        className="text-green-700 hover:text-green-800 text-xs flex items-center"
                        title="Copy reach values from first audience"
                      >
                        <FiCopy className="h-3 w-3 mr-1" />
                        Copy Reach
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spreadsheet-Style Grid */}
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <div className="overflow-auto" style={{ maxHeight: '500px' }}>
              {/* Header Row */}
              <div className="sticky top-0 bg-gray-100 border-b border-gray-300 grid" style={{ gridTemplateColumns: `80px 80px repeat(${audiences.length}, 120px)` }}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-r border-gray-300 flex items-center justify-center">
                  Budget
                </div>
                <div className="px-3 py-2 text-xs font-semibold text-blue-700 border-r border-gray-300 flex items-center justify-center">
                  Frequency
                </div>
                {audiences.map((audience, index) => (
                  <div key={`header-${audience.id}`} className="px-3 py-2 text-xs font-semibold text-green-700 border-r border-gray-300 text-center flex items-center justify-center">
                    {audience.finalTarget} (Reach%)
                  </div>
                ))}
              </div>
              
              {/* Data Grid */}
              {curves.map((curve, budgetIndex) => {
                const isEvenRow = budgetIndex % 2 === 0;
                return (
                  <div 
                    key={curve.budget} 
                    className={`grid border-b border-gray-200 ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}
                    style={{ gridTemplateColumns: `80px 80px repeat(${audiences.length}, 120px)` }}
                  >
                    {/* Budget Cell */}
                    <div className="px-3 py-2 text-sm font-medium text-gray-900 border-r border-gray-300 flex items-center justify-center">
                      {formatBudget(curve.budget)}
                    </div>
                    
                    {/* Frequency Cell */}
                    <div className="border-r border-gray-300 p-0 relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={curve.frequency === 0 ? '' : curve.frequency}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateFrequency(budgetIndex, 0);
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              updateFrequency(budgetIndex, numValue);
                            }
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData?.getData('text') || '';
                          const trimmedText = pastedText.trim();
                          
                          const hasMultipleValues = trimmedText.includes('\\n') || 
                                                  trimmedText.includes('\\t') || 
                                                  trimmedText.includes(',') ||
                                                  trimmedText.includes('\\r') ||
                                                  trimmedText.split(/\\s+/).length > 1;
                          
                          if (hasMultipleValues) {
                            handleMultiPaste(budgetIndex, null, trimmedText, 'frequency');
                          } else {
                            const cleanText = trimmedText.replace(/[^\\d.-]/g, '');
                            const numValue = parseFloat(cleanText);
                            if (!isNaN(numValue) && numValue >= 0) {
                              updateFrequency(budgetIndex, numValue);
                            }
                          }
                        }}
                        className={`w-full h-10 px-3 text-sm text-center border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                          validationErrors[`freq-${budgetIndex}`] ? 'bg-red-50 text-red-800' : 'bg-transparent'
                        }`}
                        placeholder="0.0"
                      />
                      
                      {validationErrors[`freq-${budgetIndex}`] && (
                        <div className="absolute top-full left-0 mt-1 bg-red-600 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                          <FiAlertCircle className="h-3 w-3 inline mr-1" />
                          {validationErrors[`freq-${budgetIndex}`]}
                        </div>
                      )}
                    </div>
                    
                    {/* Reach Cells */}
                    {audiences.map((audience) => {
                      const reach = curve.reaches[audience.id] || 0;
                      const reachDisplayValue = reach === 0 ? '' : reach;
                      const reachErrorKey = `reach-${budgetIndex}-${audience.id}`;
                      const hasReachError = validationErrors[reachErrorKey];
                      
                      return (
                        <div key={audience.id} className="border-r border-gray-300 p-0 relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={reachDisplayValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  updateReach(budgetIndex, audience.id, 0);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue)) {
                                    updateReach(budgetIndex, audience.id, numValue);
                                  }
                                }
                              }}
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedText = e.clipboardData?.getData('text') || '';
                                const trimmedText = pastedText.trim();
                                
                                const hasMultipleValues = trimmedText.includes('\n') || 
                                                        trimmedText.includes('\t') || 
                                                        trimmedText.includes(',') ||
                                                        trimmedText.includes('\r') ||
                                                        trimmedText.split(/\s+/).length > 1;
                                
                                if (hasMultipleValues) {
                                  handleMultiPaste(budgetIndex, audience.id, trimmedText, 'reach');
                                } else {
                                  const cleanText = trimmedText.replace(/[^\d.-]/g, '');
                                  const numValue = parseFloat(cleanText);
                                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                                    updateReach(budgetIndex, audience.id, numValue);
                                  }
                                }
                              }}
                              className={`w-full h-10 px-3 text-sm text-center border-0 focus:ring-2 focus:ring-green-500 focus:outline-none ${
                                hasReachError ? 'bg-red-50 text-red-800' : 'bg-transparent'
                              }`}
                              placeholder="0.00"
                            />
                            
                            {hasReachError && (
                              <div className="absolute top-full left-0 mt-1 bg-red-600 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                                <FiAlertCircle className="h-3 w-3 inline mr-1" />
                                {hasReachError}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remove number input spinners */}
          <style jsx>{`
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield;
            }
          `}</style>

          {/* Instructions */}
          <div className="mt-6 bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Instructions</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Budget column shows spending levels, Frequency column shows exposures per person</li>
              <li>• Each audience has its own Reach% column showing percentage of audience reached</li>
              <li>• Enter reach percentages (0-100) for each budget level and audience</li>
              <li>• Frequency applies to all audiences at each budget level</li>
              <li>• Reach values should generally increase with higher budgets</li>
              <li>• Use the copy buttons to duplicate reach values across similar audiences</li>
              <li>• Data will replace any existing curves for this country/business unit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}