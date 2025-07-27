'use client';

import React, { useState, useEffect } from 'react';
import { FiTv, FiSmartphone } from 'react-icons/fi';
import ShareOfVoiceGrid from '@/components/share-of-voice/ShareOfVoiceGrid';

interface Country {
  id: number;
  name: string;
}

interface BusinessUnit {
  id: number;
  name: string;
}

export default function ShareOfVoicePage() {
  const [mediaType, setMediaType] = useState<'tv' | 'digital'>('tv');
  const [businessUnitId, setBusinessUnitId] = useState<string>('');
  const [countryId, setCountryId] = useState<string>('');
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [countriesRes, businessUnitsRes] = await Promise.all([
        fetch('/api/data/countries'),
        fetch('/api/data/business-units')
      ]);

      if (countriesRes.ok && businessUnitsRes.ok) {
        const [countriesData, businessUnitsData] = await Promise.all([
          countriesRes.json(),
          businessUnitsRes.json()
        ]);
        
        setCountries(countriesData);
        setBusinessUnits(businessUnitsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showGrid = mediaType && businessUnitId && countryId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share of Voice Management
          </h1>
          <p className="text-gray-600">
            Manage competitor share of voice data with an Excel-like grid interface
          </p>
        </div>

        {/* Selection Controls */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Media Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'tv' | 'digital')}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="tv">TV Share of Voice</option>
                <option value="digital">Digital Share of Voice</option>
              </select>
            </div>

            {/* Business Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Unit
              </label>
              <select
                value={businessUnitId}
                onChange={(e) => setBusinessUnitId(e.target.value)}
                disabled={loading}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:opacity-50"
              >
                <option value="">Choose business unit...</option>
                {businessUnits.map((bu) => (
                  <option key={bu.id} value={bu.id}>
                    {bu.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                disabled={loading}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md disabled:opacity-50"
              >
                <option value="">Choose country...</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Summary */}
          {showGrid && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">
                  {mediaType === 'tv' ? <FiTv className="h-5 w-5" /> : <FiSmartphone className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Ready to edit {mediaType.toUpperCase()} SOV data
                  </p>
                  <p className="text-sm text-green-700">
                    {countries.find(c => c.id.toString() === countryId)?.name} • {businessUnits.find(bu => bu.id.toString() === businessUnitId)?.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SOV Grid */}
        {showGrid && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {mediaType.toUpperCase()} Share of Voice Data
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Enter {mediaType === 'tv' ? 'investment and TRP' : 'spend and impression'} data for each category and competitor
              </p>
            </div>
            <div className="p-6">
              <ShareOfVoiceGrid
                countryId={parseInt(countryId)}
                businessUnitId={parseInt(businessUnitId)}
                mediaType={mediaType}
                onSave={(success) => {
                  if (success) {
                    console.log('SOV data saved successfully');
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading data...</p>
          </div>
        )}
      </div>
    </div>
  );
}