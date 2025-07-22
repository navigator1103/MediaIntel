'use client';

import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiRefreshCw } from 'react-icons/fi';

interface TargetAudience {
  id: string;
  gender: string;
  minAge: number;
  maxAge: number;
  sel: string;
  finalTarget: string;
  saturationPoint: number;
}

interface DigitalTargetAudienceFormProps {
  countryId: number;
  businessUnitId: number;
  audiences: TargetAudience[];
  onAudiencesChange: (audiences: TargetAudience[]) => void;
  onGenerateTable: (audiences: TargetAudience[]) => void;
  onLoadExisting: () => void;
}

export default function DigitalTargetAudienceForm({
  countryId,
  businessUnitId,
  audiences,
  onAudiencesChange,
  onGenerateTable,
  onLoadExisting
}: DigitalTargetAudienceFormProps) {
  const [loading, setLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  // Check for existing data when country/business unit changes
  React.useEffect(() => {
    const checkExistingData = async () => {
      if (!countryId || !businessUnitId) {
        setHasExistingData(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/digital-diminishing-returns/audiences?countryId=${countryId}&businessUnitId=${businessUnitId}`);
        if (response.ok) {
          const data = await response.json();
          setHasExistingData(data.length > 0);
        } else {
          setHasExistingData(false);
        }
      } catch (error) {
        setHasExistingData(false);
      }
    };

    checkExistingData();
  }, [countryId, businessUnitId]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addAudience = () => {
    const newAudience: TargetAudience = {
      id: generateId(),
      gender: 'F',
      minAge: 18,
      maxAge: 45,
      sel: '',
      finalTarget: '',
      saturationPoint: 0 // Will be calculated automatically
    };
    onAudiencesChange([...audiences, newAudience]);
  };

  const removeAudience = (id: string) => {
    onAudiencesChange(audiences.filter(aud => aud.id !== id));
  };

  const updateAudience = (id: string, field: keyof TargetAudience, value: any) => {
    const updatedAudiences = audiences.map(aud => {
      if (aud.id === id) {
        const updated = { ...aud, [field]: value };
        
        // Auto-generate final target when demographics change
        if (['gender', 'minAge', 'maxAge', 'sel'].includes(field)) {
          const selPart = updated.sel ? ` ${updated.sel}` : '';
          updated.finalTarget = `${updated.gender} ${updated.minAge}-${updated.maxAge}${selPart}`;
        }
        
        return updated;
      }
      return aud;
    });
    onAudiencesChange(updatedAudiences);
  };

  const isValidAudience = (audience: TargetAudience) => {
    return audience.gender && 
           audience.minAge > 0 && 
           audience.maxAge > audience.minAge &&
           audience.finalTarget.trim() !== '';
  };

  const allAudiencesValid = audiences.length > 0 && audiences.every(isValidAudience);

  const handleGenerateTable = () => {
    if (allAudiencesValid) {
      onGenerateTable(audiences);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Digital Target Audiences</h3>
            <p className="text-sm text-gray-500 mt-1">
              Define the target audiences for your Digital diminishing returns curves.
            </p>
          </div>
        </div>

        {/* Audiences Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Age
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Age
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SEL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Target
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {audiences.map((audience) => (
                  <tr key={audience.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={audience.gender}
                        onChange={(e) => updateAudience(audience.id, 'gender', e.target.value)}
                        className="block w-full text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="F">F</option>
                        <option value="M">M</option>
                        <option value="BG">BG</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={audience.minAge}
                        onChange={(e) => updateAudience(audience.id, 'minAge', parseInt(e.target.value) || 0)}
                        className="block w-20 text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={audience.maxAge}
                        onChange={(e) => updateAudience(audience.id, 'maxAge', parseInt(e.target.value) || 0)}
                        className="block w-20 text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        placeholder="ABC"
                        value={audience.sel}
                        onChange={(e) => updateAudience(audience.id, 'sel', e.target.value)}
                        className="block w-20 text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        value={audience.finalTarget}
                        onChange={(e) => updateAudience(audience.id, 'finalTarget', e.target.value)}
                        className="block w-32 text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-gray-50"
                        placeholder="Auto-generated"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => removeAudience(audience.id)}
                        disabled={audiences.length === 1}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={addAudience}
                disabled={audiences.length >= 5}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <FiPlus className="h-4 w-4 mr-2" />
                Add Target Audience
              </button>

              <button
                onClick={onLoadExisting}
                disabled={!countryId || !businessUnitId || loading}
                className={`inline-flex items-center px-3 py-2 shadow-sm text-sm leading-4 font-medium rounded-md disabled:opacity-50 ${
                  hasExistingData 
                    ? 'bg-green-600 text-white hover:bg-green-700 border border-green-600' 
                    : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                {loading ? (
                  <>
                    <div className={`animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full ${
                      hasExistingData ? 'border-white' : 'border-gray-600'
                    }`} />
                    Loading...
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="h-4 w-4 mr-2" />
                    Load Existing Data
                    {hasExistingData && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Available
                      </span>
                    )}
                  </>
                )}
              </button>
              
              {/* Status */}
              <div className="text-sm text-gray-500">
                {audiences.length} audience{audiences.length !== 1 ? 's' : ''} defined
                {allAudiencesValid ? (
                  <span className="text-green-600 ml-2">✓ Valid</span>
                ) : (
                  <span className="text-red-600 ml-2">⚠ Incomplete</span>
                )}
              </div>
            </div>

            <button
              onClick={handleGenerateTable}
              disabled={!allAudiencesValid}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Curves Table
            </button>
          </div>

          {/* Validation Messages */}
          {!allAudiencesValid && audiences.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Please ensure all target audiences are properly defined:
              </p>
              <ul className="mt-2 text-xs text-yellow-700 list-disc list-inside">
                <li>Gender must be selected</li>
                <li>Max age must be greater than min age</li>
                <li>Final target must be filled</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}