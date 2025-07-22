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
  trp: number;
  reaches: { [audienceId: string]: number };
}

interface SaturationData {
  saturationPoint: number; // reach percentage
  saturationTrp: number;   // TRP level
}

interface TvCurvesTableProps {
  countryId: number;
  businessUnitId: number;
  audiences: TargetAudience[];
  onSave?: (success: boolean) => void;
}

const STANDARD_TRPS = [
  100, 150, 200, 250, 300, 350, 400, 450, 500, 550,
  600, 650, 700, 750, 800, 850, 900, 950, 1000, 1050,
  1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450
];

export default function TvCurvesTable({
  countryId,
  businessUnitId,
  audiences,
  onSave
}: TvCurvesTableProps) {
  const [curves, setCurves] = useState<CurveData[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [saturationData, setSaturationData] = useState<{ [audienceId: string]: SaturationData }>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Initialize curves when audiences change
  useEffect(() => {
    const initialCurves: CurveData[] = STANDARD_TRPS.map(trp => ({
      trp,
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
      const curvesResponse = await fetch(`/api/admin/tv-diminishing-returns/curves?countryId=${countryId}&businessUnitId=${businessUnitId}`);
      
      if (curvesResponse.ok) {
        const savedCurves = await curvesResponse.json();
        
        if (savedCurves.length > 0) {
          // Update curves with saved data
          setCurves(prev => {
            const newCurves = prev.map(curve => {
              const savedCurve = savedCurves.find((saved: any) => saved.trp === curve.trp);
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
      const audienceResponse = await fetch(`/api/admin/tv-diminishing-returns/audiences?countryId=${countryId}&businessUnitId=${businessUnitId}`);
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
              saturationTrp: savedAudience.saturationTrp || 0
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
      if (satData.saturationPoint > 0 || satData.saturationTrp > 0) {
        newSaturationData[audience.id] = satData;
      }
    });
    
    setSaturationData(prev => ({ ...prev, ...newSaturationData }));
  }, [curves, audiences]);

  // Calculate saturation point and TRP for an audience
  const calculateSaturation = (audienceId: string): SaturationData => {
    // Get all curves with valid reach data, sorted by TRP
    const validCurves = curves
      .map(curve => ({
        trp: curve.trp,
        reach: curve.reaches[audienceId] || 0
      }))
      .filter(item => item.reach > 0) // Only include positive reach values
      .sort((a, b) => a.trp - b.trp); // Ensure TRP ascending order
    
    if (validCurves.length < 2) {
      return { saturationPoint: 0, saturationTrp: 0 };
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
          saturationTrp: current.trp
        };
      }
    }
    
    // If no saturation point found, return empty values
    return { saturationPoint: 0, saturationTrp: 0 };
  };

  const updateReach = (trpIndex: number, audienceId: string, value: number) => {
    setCurves(prev => prev.map((curve, index) => {
      if (index === trpIndex) {
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
    const errorKey = `${trpIndex}-${audienceId}`;
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

  const handleMultiPaste = (startTrpIndex: number, audienceId: string, pastedText: string) => {
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
        const targetIndex = startTrpIndex + index;
        if (targetIndex < newCurves.length && value >= 0 && value <= 100) {
          newCurves[targetIndex] = {
            ...newCurves[targetIndex],
            reaches: {
              ...newCurves[targetIndex].reaches,
              [audienceId]: value
            }
          };
        }
      });
      
      return newCurves;
    });
  };

  const validateCurves = (): boolean => {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    curves.forEach((curve, trpIndex) => {
      audiences.forEach(audience => {
        const reach = curve.reaches[audience.id] || 0;
        const errorKey = `${trpIndex}-${audience.id}`;

        // Check for negative values
        if (reach < 0) {
          errors[errorKey] = 'Reach cannot be negative';
          isValid = false;
        }

        // Check for values over 100% (unrealistic reach)
        if (reach > 100) {
          errors[errorKey] = 'Reach cannot exceed 100%';
          isValid = false;
        }

        // Check if reach is increasing (warning, not error)
        if (trpIndex > 0) {
          const prevReach = curves[trpIndex - 1]?.reaches[audience.id] || 0;
          if (reach < prevReach && reach > 0 && prevReach > 0) {
            errors[errorKey] = 'Reach generally increases with higher TRPs';
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
        const satData = saturationData[aud.id] || { saturationPoint: 0, saturationTrp: null };
        return {
          gender: aud.gender,
          minAge: aud.minAge,
          maxAge: aud.maxAge,
          sel: aud.sel || null,
          finalTarget: aud.finalTarget,
          saturationPoint: satData.saturationPoint > 0 ? satData.saturationPoint : 0,
          saturationTrp: satData.saturationTrp > 0 ? satData.saturationTrp : null
        };
      });
      
      // Save target audiences with calculated saturation data
      const audienceResponse = await fetch('/api/admin/tv-diminishing-returns/audiences', {
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
      const curvesResponse = await fetch('/api/admin/tv-diminishing-returns/curves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId,
          businessUnitId,
          curves: curves.map(curve => ({
            trp: curve.trp,
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">TRP vs Reach Curves</h3>
            <p className="text-sm text-gray-500 mt-1">
              Enter reach percentages for each TRP level and target audience {dataLoaded && '(Data auto-loaded)'}
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
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                <div key={audience.id} className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                  <div className="font-semibold text-blue-900 mb-1">{audience.finalTarget}</div>
                  {satData && satData.saturationPoint > 0 && (
                    <div className="text-xs space-y-1">
                      <div className="text-green-600 font-medium">
                        Sat: {satData.saturationPoint.toFixed(2)}%
                      </div>
                      <div className="text-blue-600 font-medium">
                        TRP: {satData.saturationTrp}
                      </div>
                    </div>
                  )}
                  {(!satData || satData.saturationPoint === 0) && (
                    <div className="text-xs text-gray-500">
                      No saturation detected
                    </div>
                  )}
                  {index > 0 && (
                    <button
                      onClick={() => copyColumnValues(audiences[0].id, audience.id)}
                      className="text-blue-700 hover:text-blue-800 text-xs mt-2 flex items-center justify-center mx-auto"
                      title="Copy values from first audience"
                    >
                      <FiCopy className="h-3 w-3 mr-1" />
                      Copy
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spreadsheet-Style Grid */}
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <div className="overflow-auto" style={{ maxHeight: '500px' }}>
              {/* Header Row */}
              <div className="sticky top-0 bg-gray-100 border-b border-gray-300 grid" style={{ gridTemplateColumns: `80px repeat(${audiences.length}, 120px)` }}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-r border-gray-300 flex items-center justify-center">
                  TRP
                </div>
                {audiences.map((audience) => (
                  <div key={`header-${audience.id}`} className="px-3 py-2 text-xs font-semibold text-gray-700 border-r border-gray-300 text-center flex items-center justify-center">
                    {audience.finalTarget}
                  </div>
                ))}
              </div>
              
              {/* Data Grid */}
              {curves.map((curve, trpIndex) => {
                const isEvenRow = trpIndex % 2 === 0;
                return (
                  <div 
                    key={curve.trp} 
                    className={`grid border-b border-gray-200 ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}
                    style={{ gridTemplateColumns: `80px repeat(${audiences.length}, 120px)` }}
                  >
                    {/* TRP Cell */}
                    <div className="px-3 py-2 text-sm font-medium text-gray-900 border-r border-gray-300 flex items-center justify-center">
                      {curve.trp}
                    </div>
                    
                    {/* Reach Cells */}
                    {audiences.map((audience, audienceIndex) => {
                      const reach = curve.reaches[audience.id] || 0;
                      const displayValue = reach === 0 ? '' : reach;
                      const errorKey = `${trpIndex}-${audience.id}`;
                      const hasError = validationErrors[errorKey];
                      
                      return (
                        <div key={audience.id} className="border-r border-gray-300 p-0 relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={displayValue}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                updateReach(trpIndex, audience.id, 0);
                              } else {
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue)) {
                                  updateReach(trpIndex, audience.id, numValue);
                                }
                              }
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pastedText = e.clipboardData?.getData('text') || '';
                              const trimmedText = pastedText.trim();
                              
                              // Check if pasting multiple values
                              const hasMultipleValues = trimmedText.includes('\n') || 
                                                      trimmedText.includes('\t') || 
                                                      trimmedText.includes(',') ||
                                                      trimmedText.includes('\r') ||
                                                      trimmedText.split(/\s+/).length > 1;
                              
                              if (hasMultipleValues) {
                                handleMultiPaste(trpIndex, audience.id, trimmedText);
                              } else {
                                const cleanText = trimmedText.replace(/[^\d.-]/g, '');
                                const numValue = parseFloat(cleanText);
                                if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                                  updateReach(trpIndex, audience.id, numValue);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              // Handle Ctrl+C (copy)
                              if (e.ctrlKey && e.key === 'c') {
                                const value = e.currentTarget.value;
                                navigator.clipboard.writeText(value);
                                e.preventDefault();
                              }
                              // Prevent default Ctrl+V since we handle it in onPaste
                              else if (e.ctrlKey && e.key === 'v') {
                                e.preventDefault();
                              }
                            }}
                            className={`w-full h-10 px-3 text-sm text-center border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                              hasError ? 'bg-red-50 text-red-800' : 'bg-transparent'
                            }`}
                            placeholder="0.00"
                          />
                          
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
                          
                          {hasError && (
                            <div className="absolute top-full left-0 mt-1 bg-red-600 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                              <FiAlertCircle className="h-3 w-3 inline mr-1" />
                              {hasError}
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

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enter reach percentages (0-100) for each TRP level</li>
              <li>• Reach values should generally increase with higher TRPs</li>
              <li>• Reach cannot exceed the saturation point for each audience</li>
              <li>• Use the copy button to duplicate values across similar audiences</li>
              <li>• Data will replace any existing curves for this country/business unit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}