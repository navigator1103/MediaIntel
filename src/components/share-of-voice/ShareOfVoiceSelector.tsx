'use client';

import React, { useState, useEffect } from 'react';
import { FiMapPin, FiHome } from 'react-icons/fi';

interface Country {
  id: number;
  name: string;
}

interface BusinessUnit {
  id: number;
  name: string;
}

interface ShareOfVoiceSelectorProps {
  onSelectionChange?: (countryId: number, businessUnitId: number, countryName: string, businessUnitName: string) => void;
}

export default function ShareOfVoiceSelector({ onSelectionChange }: ShareOfVoiceSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('');
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingBusinessUnits, setLoadingBusinessUnits] = useState(false);

  // Load countries on component mount
  useEffect(() => {
    loadCountries();
    loadBusinessUnits();
  }, []);

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const response = await fetch('/api/data/countries');
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadBusinessUnits = async () => {
    setLoadingBusinessUnits(true);
    try {
      const response = await fetch('/api/data/business-units');
      if (response.ok) {
        const data = await response.json();
        setBusinessUnits(data);
      }
    } catch (error) {
      console.error('Error loading business units:', error);
    } finally {
      setLoadingBusinessUnits(false);
    }
  };

  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    notifySelectionChange(countryId, selectedBusinessUnit);
  };

  const handleBusinessUnitChange = (businessUnitId: string) => {
    setSelectedBusinessUnit(businessUnitId);
    notifySelectionChange(selectedCountry, businessUnitId);
  };

  const notifySelectionChange = (countryId: string, businessUnitId: string) => {
    if (countryId && businessUnitId && onSelectionChange) {
      const country = countries.find(c => c.id.toString() === countryId);
      const businessUnit = businessUnits.find(bu => bu.id.toString() === businessUnitId);
      
      if (country && businessUnit) {
        onSelectionChange(
          parseInt(countryId), 
          parseInt(businessUnitId),
          country.name,
          businessUnit.name
        );
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Select Country & Business Unit</h3>
        <p className="text-sm text-gray-500 mt-1">
          Choose the country and business unit for your SOV data
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiMapPin className="inline h-4 w-4 mr-1" />
              Country
            </label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                disabled={loadingCountries}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Choose a country...</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id.toString()}>
                    {country.name}
                  </option>
                ))}
              </select>
              {loadingCountries && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Business Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiHome className="inline h-4 w-4 mr-1" />
              Business Unit
            </label>
            <div className="relative">
              <select
                value={selectedBusinessUnit}
                onChange={(e) => handleBusinessUnitChange(e.target.value)}
                disabled={loadingBusinessUnits}
                className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Choose a business unit...</option>
                {businessUnits.map((businessUnit) => (
                  <option key={businessUnit.id} value={businessUnit.id.toString()}>
                    {businessUnit.name}
                  </option>
                ))}
              </select>
              {loadingBusinessUnits && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedCountry && selectedBusinessUnit && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600">
                <FiMapPin className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Ready to load SOV data
                </p>
                <p className="text-sm text-green-700">
                  {countries.find(c => c.id.toString() === selectedCountry)?.name} • {businessUnits.find(bu => bu.id.toString() === selectedBusinessUnit)?.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}