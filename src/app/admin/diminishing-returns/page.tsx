'use client';

import React, { useState } from 'react';
import { FiBarChart, FiUpload, FiDatabase, FiFileText, FiArrowLeft, FiCheckCircle, FiDownload, FiTv, FiSmartphone, FiRefreshCw } from 'react-icons/fi';
import TvTargetAudienceForm from '@/components/diminishing-returns/TvTargetAudienceForm';
import TvCurvesTable from '@/components/diminishing-returns/TvCurvesTable';
import DigitalTargetAudienceForm from '@/components/diminishing-returns/DigitalTargetAudienceForm';
import DigitalCurvesTable from '@/components/diminishing-returns/DigitalCurvesTable';

interface SessionSummary {
  sessionId: string;
  fileName: string;
  totalRecords: number;
  mediaType: 'tv' | 'digital';
  validationSummary?: {
    total: number;
    critical: number;
    warning: number;
    suggestion: number;
  };
  country?: string;
  businessUnit?: string;
}

interface TargetAudience {
  id: string;
  gender: string;
  minAge: number;
  maxAge: number;
  sel: string;
  finalTarget: string;
  saturationPoint: number;
}

interface Country {
  id: number;
  name: string;
}

interface BusinessUnit {
  id: number;
  name: string;
}

export default function DiminishingReturnsPage() {
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [mediaType, setMediaType] = useState<'tv' | 'digital'>('tv');
  
  // Form-based state
  const [countries, setCountries] = useState<Country[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<number>(0);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<number>(0);
  const [targetAudiences, setTargetAudiences] = useState<TargetAudience[]>([{
    id: Math.random().toString(36).substr(2, 9),
    gender: 'F',
    minAge: 18,
    maxAge: 45,
    sel: '',
    finalTarget: 'F 18-45',
    saturationPoint: 0
  }]);
  const [showCurvesTable, setShowCurvesTable] = useState(false);
  
  // Digital form state
  const [digitalTargetAudiences, setDigitalTargetAudiences] = useState<TargetAudience[]>([{
    id: Math.random().toString(36).substr(2, 9),
    gender: 'F',
    minAge: 18,
    maxAge: 45,
    sel: '',
    finalTarget: 'F 18-45',
    saturationPoint: 0
  }]);
  const [showDigitalCurvesTable, setShowDigitalCurvesTable] = useState(false);

  const handleUploadComplete = (sessionId: string, type: 'tv' | 'digital') => {
    setCurrentSession(sessionId);
    setMediaType(type);
    setActiveTab('validation');
  };

  const handleValidationComplete = (sessionId: string, summary: any, type: 'tv' | 'digital') => {
    setSessionSummary({
      sessionId,
      fileName: sessionSummary?.fileName || 'uploaded-file.csv',
      totalRecords: summary.uniqueRows || 0,
      mediaType: type,
      validationSummary: summary,
      country: summary.validationDetails?.country,
      businessUnit: summary.validationDetails?.businessUnit
    });
  };

  const resetSession = () => {
    setCurrentSession(null);
    setSessionSummary(null);
    setActiveTab('upload');
    setMediaType('tv');
    setShowCurvesTable(false);
    setShowDigitalCurvesTable(false);
  };

  // Load countries and business units
  React.useEffect(() => {
    loadCountries();
    loadBusinessUnits();
  }, []);

  // Removed auto-loading to prevent flickering issues

  const loadCountries = async () => {
    try {
      console.log('Attempting to fetch countries...');
      // Use digital API but it uses the same data source as TV
      const response = await fetch('/api/admin/digital-diminishing-returns/countries');
      console.log('Countries response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Countries data:', data);
        setCountries(data);
      } else {
        const errorText = await response.text();
        console.error('Countries fetch failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadBusinessUnits = async () => {
    try {
      console.log('Attempting to fetch business units...');
      // Use digital API but it uses the same data source as TV
      const response = await fetch('/api/admin/digital-diminishing-returns/business-units');
      console.log('Business units response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Business units data:', data);
        setBusinessUnits(data);
      } else {
        const errorText = await response.text();
        console.error('Business units fetch failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading business units:', error);
    }
  };

  const loadExistingTvData = async () => {
    if (!selectedCountry || !selectedBusinessUnit) {
      return;
    }

    try {
      console.log('Loading existing TV data for:', { selectedCountry, selectedBusinessUnit });
      
      // Load audiences first
      const audienceResponse = await fetch(`/api/admin/tv-diminishing-returns/audiences?countryId=${selectedCountry}&businessUnitId=${selectedBusinessUnit}`);
      
      if (audienceResponse.ok) {
        const audienceData = await audienceResponse.json();
        if (audienceData.length > 0) {
          // Load existing audiences
          const loadedAudiences = audienceData.map((aud: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            gender: aud.gender,
            minAge: aud.minAge,
            maxAge: aud.maxAge,
            sel: aud.sel || '',
            finalTarget: aud.finalTarget,
            saturationPoint: aud.saturationPoint || 0
          }));
          
          setTargetAudiences(loadedAudiences);
          setShowCurvesTable(true); // Show curves table
          
          console.log(`Loaded ${loadedAudiences.length} target audiences`);
        } else {
          console.log('No existing TV data found');
        }
      } else {
        console.error('Failed to load audiences:', audienceResponse.status);
      }
    } catch (error) {
      console.error('Error loading existing TV data:', error);
    }
  };

  const loadExistingDigitalData = async () => {
    if (!selectedCountry || !selectedBusinessUnit) {
      return;
    }

    try {
      console.log('Loading existing Digital data for:', { selectedCountry, selectedBusinessUnit });
      
      // Load audiences first
      const audienceResponse = await fetch(`/api/admin/digital-diminishing-returns/audiences?countryId=${selectedCountry}&businessUnitId=${selectedBusinessUnit}`);
      
      if (audienceResponse.ok) {
        const audienceData = await audienceResponse.json();
        if (audienceData.length > 0) {
          // Load existing audiences
          const loadedAudiences = audienceData.map((aud: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            gender: aud.gender,
            minAge: aud.minAge,
            maxAge: aud.maxAge,
            sel: aud.sel || '',
            finalTarget: aud.finalTarget,
            saturationPoint: aud.saturationPoint || 0
          }));
          
          setDigitalTargetAudiences(loadedAudiences);
          setShowDigitalCurvesTable(true); // Show curves table
          
          console.log(`Successfully loaded ${loadedAudiences.length} target audiences and curves data.`);
        } else {
          console.log('No existing Digital data found');
        }
      } else {
        console.error('Failed to load digital audiences:', audienceResponse.status);
      }
    } catch (error) {
      console.error('Error loading existing Digital data:', error);
    }
  };

  const handleAudiencesChange = (audiences: TargetAudience[]) => {
    // Only hide curves table if audiences actually changed (not just a re-render)
    const audiencesChanged = JSON.stringify(audiences) !== JSON.stringify(targetAudiences);
    
    setTargetAudiences(audiences);
    
    if (audiencesChanged) {
      setShowCurvesTable(false);
    }
  };

  const handleGenerateTable = React.useCallback((audiences: TargetAudience[]) => {
    setTargetAudiences(audiences);
    setShowCurvesTable(true);
  }, [showCurvesTable]);

  // Digital handlers
  const handleDigitalAudiencesChange = (audiences: TargetAudience[]) => {
    // Only hide curves table if audiences actually changed (not just a re-render)
    const audiencesChanged = JSON.stringify(audiences) !== JSON.stringify(digitalTargetAudiences);
    
    setDigitalTargetAudiences(audiences);
    
    if (audiencesChanged) {
      setShowDigitalCurvesTable(false);
    }
  };

  const handleDigitalGenerateTable = React.useCallback((audiences: TargetAudience[]) => {
    setDigitalTargetAudiences(audiences);
    setShowDigitalCurvesTable(true);
  }, [showDigitalCurvesTable]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Diminishing Returns Management
              </h1>
              <p className="text-gray-600">
                Upload and manage TV and Digital diminishing returns curves by business unit and country
              </p>
            </div>
            
            {currentSession && (
              <button
                onClick={resetSession}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FiArrowLeft className="h-4 w-4 mr-2" />
                New Upload
              </button>
            )}
          </div>

          {/* Session Status */}
          {sessionSummary && (
            <div className="mt-6 bg-white rounded-lg shadow border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {sessionSummary.mediaType === 'tv' ? (
                      <FiTv className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FiSmartphone className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {sessionSummary.fileName} ({sessionSummary.mediaType.toUpperCase()})
                      </div>
                      <div className="text-sm text-gray-500">
                        {sessionSummary.totalRecords} records • {sessionSummary.businessUnit} • {sessionSummary.country}
                      </div>
                      <div className="text-xs text-gray-400">
                        Session: {sessionSummary.sessionId}
                      </div>
                    </div>
                  </div>
                  
                  {sessionSummary.validationSummary && (
                    <div className="flex space-x-2">
                      {sessionSummary.validationSummary.critical > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {sessionSummary.validationSummary.critical} Critical
                        </span>
                      )}
                      {sessionSummary.validationSummary.warning > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {sessionSummary.validationSummary.warning} Warnings
                        </span>
                      )}
                      {sessionSummary.validationSummary.suggestion > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {sessionSummary.validationSummary.suggestion} Suggestions
                        </span>
                      )}
                      {sessionSummary.validationSummary.total === 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheckCircle className="w-3 h-3 mr-1" />
                          All Valid
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="inline-flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-2">1</span>
                  <FiUpload className="h-4 w-4 mr-2" />
                  Upload Curves
                </span>
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                disabled={!currentSession}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'validation' && currentSession
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!currentSession ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="inline-flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-2">2</span>
                  <FiBarChart className="h-4 w-4 mr-2" />
                  Validate & Import
                </span>
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'database'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiDatabase className="h-4 w-4 inline mr-2" />
                Database
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {/* Media Type Selection */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Select Media Type</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose whether you want to create TV or Digital diminishing returns curves
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setMediaType('tv')}
                        className={`p-6 rounded-lg border-2 transition-colors ${
                          mediaType === 'tv'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <FiTv className={`h-8 w-8 mb-3 ${mediaType === 'tv' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <h4 className={`font-medium ${mediaType === 'tv' ? 'text-blue-900' : 'text-gray-900'}`}>
                            TV Diminishing Returns
                          </h4>
                          <p className={`text-sm mt-1 ${mediaType === 'tv' ? 'text-blue-700' : 'text-gray-500'}`}>
                            TRP-based reach curves
                          </p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setMediaType('digital')}
                        className={`p-6 rounded-lg border-2 transition-colors ${
                          mediaType === 'digital'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <FiSmartphone className={`h-8 w-8 mb-3 ${mediaType === 'digital' ? 'text-green-600' : 'text-gray-400'}`} />
                          <h4 className={`font-medium ${mediaType === 'digital' ? 'text-green-900' : 'text-gray-900'}`}>
                            Digital Diminishing Returns
                          </h4>
                          <p className={`text-sm mt-1 ${mediaType === 'digital' ? 'text-green-700' : 'text-gray-500'}`}>
                            Budget-based reach & frequency curves
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Country and Business Unit Selection */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Select Country & Business Unit</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose the country and business unit for your diminishing returns data
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedCountry}
                          onChange={(e) => setSelectedCountry(parseInt(e.target.value))}
                          className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value={0}>Choose a country...</option>
                          {countries.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Unit <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedBusinessUnit}
                          onChange={(e) => setSelectedBusinessUnit(parseInt(e.target.value))}
                          className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value={0}>Choose a business unit...</option>
                          {businessUnits.map((bu) => (
                            <option key={bu.id} value={bu.id}>
                              {bu.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>


                {/* TV Form Components */}
                {mediaType === 'tv' && selectedCountry && selectedBusinessUnit && (
                  <>
                    <TvTargetAudienceForm
                      countryId={selectedCountry}
                      businessUnitId={selectedBusinessUnit}
                      audiences={targetAudiences}
                      onAudiencesChange={handleAudiencesChange}
                      onGenerateTable={handleGenerateTable}
                      onLoadExisting={loadExistingTvData}
                    />

                    {showCurvesTable && (
                      <TvCurvesTable
                        countryId={selectedCountry}
                        businessUnitId={selectedBusinessUnit}
                        audiences={targetAudiences}
                      />
                    )}
                  </>
                )}

                {/* Digital Form Components */}
                {mediaType === 'digital' && selectedCountry && selectedBusinessUnit && (
                  <>
                    <DigitalTargetAudienceForm
                      countryId={selectedCountry}
                      businessUnitId={selectedBusinessUnit}
                      audiences={digitalTargetAudiences}
                      onAudiencesChange={handleDigitalAudiencesChange}
                      onGenerateTable={handleDigitalGenerateTable}
                      onLoadExisting={loadExistingDigitalData}
                    />

                    {showDigitalCurvesTable && (
                      <DigitalCurvesTable
                        countryId={selectedCountry}
                        businessUnitId={selectedBusinessUnit}
                        audiences={digitalTargetAudiences}
                      />
                    )}
                  </>
                )}

                {/* Instructions */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-8 py-6 border-b border-gray-200 bg-white rounded-t-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${mediaType === 'tv' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        <FiFileText className={`h-6 w-6 ${mediaType === 'tv' ? 'text-blue-600' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {mediaType === 'tv' ? 'TV Form Interface Guide' : 'Digital Form Interface Guide'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {mediaType === 'tv' 
                            ? 'Create and manage diminishing returns curves using our spreadsheet-style interface'
                            : 'Create and manage budget vs reach & frequency curves using our spreadsheet-style interface'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-8">
                    {/* Required Steps */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className={`h-1 w-8 ${mediaType === 'tv' ? 'bg-blue-500' : 'bg-green-500'} rounded-full`}></div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {mediaType === 'tv' ? 'Quick Start Steps' : 'Quick Start Steps'}
                        </h4>
                      </div>
                      
                      {mediaType === 'tv' ? (
                        <div className="grid gap-4">
                          <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                            <div>
                              <div className="font-medium text-gray-900">Select Location & Business Unit</div>
                              <div className="text-sm text-gray-600 mt-1">Choose your country and business unit (Nivea or Derma) from the dropdowns above</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                            <div>
                              <div className="font-medium text-gray-900">Define Target Audiences</div>
                              <div className="text-sm text-gray-600 mt-1">Create your target demographics using the form interface or load existing data</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                            <div>
                              <div className="font-medium text-gray-900">Input TRP vs Reach Data</div>
                              <div className="text-sm text-gray-600 mt-1">Use the spreadsheet-style grid to enter your curve data with copy-paste support</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                            <div>
                              <div className="font-medium text-gray-900">Select Location & Business Unit</div>
                              <div className="text-sm text-gray-600 mt-1">Choose your country and business unit (Nivea or Derma) from the dropdowns above</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                            <div>
                              <div className="font-medium text-gray-900">Define Target Audiences</div>
                              <div className="text-sm text-gray-600 mt-1">Create your target demographics using the form interface or load existing data</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                            <div>
                              <div className="font-medium text-gray-900">Input Budget vs Reach & Frequency Data</div>
                              <div className="text-sm text-gray-600 mt-1">Use the spreadsheet-style grid to enter your curve data with copy-paste support</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Key Features */}
                    {true && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-1 w-8 bg-green-500 rounded-full"></div>
                          <h4 className="text-lg font-semibold text-gray-900">Key Features</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-100">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">Auto-calculated Saturation Points</div>
                              <div className="text-xs text-gray-600 mt-1">System automatically detects when reach growth slows</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-100">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">Excel Copy-Paste Support</div>
                              <div className="text-xs text-gray-600 mt-1">Paste data directly from Excel spreadsheets</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-100">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">Real-time Validation</div>
                              <div className="text-xs text-gray-600 mt-1">Instant feedback on data quality and errors</div>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-100">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">Load Existing Data</div>
                              <div className="text-xs text-gray-600 mt-1">Button highlights when data is available</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Data Requirements */}
                    <div className={`${mediaType === 'tv' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} p-6 rounded-xl border-2`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-2 rounded-lg ${mediaType === 'tv' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          <FiBarChart className={`h-5 w-5 ${mediaType === 'tv' ? 'text-blue-600' : 'text-green-600'}`} />
                        </div>
                        <h4 className={`text-lg font-semibold ${mediaType === 'tv' ? 'text-blue-900' : 'text-green-900'}`}>
                          {mediaType === 'tv' ? 'TV' : 'Digital'} Data Requirements
                        </h4>
                      </div>
                      
                      <div className="grid lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h5 className={`font-medium text-sm ${mediaType === 'tv' ? 'text-blue-800' : 'text-green-800'}`}>Target Audience Format</h5>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <code className="px-2 py-1 bg-white rounded text-blue-600 font-mono text-xs">F 18-45</code>
                              <span className={mediaType === 'tv' ? 'text-blue-700' : 'text-green-700'}>Female 18-45 years</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <code className="px-2 py-1 bg-white rounded text-blue-600 font-mono text-xs">M 25-54</code>
                              <span className={mediaType === 'tv' ? 'text-blue-700' : 'text-green-700'}>Male 25-54 years</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <code className="px-2 py-1 bg-white rounded text-blue-600 font-mono text-xs">BG 18-45</code>
                              <span className={mediaType === 'tv' ? 'text-blue-700' : 'text-green-700'}>Both genders 18-45</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h5 className={`font-medium text-sm ${mediaType === 'tv' ? 'text-blue-800' : 'text-green-800'}`}>
                            {mediaType === 'tv' ? 'TRP & Reach' : 'Budget & Reach'} Values
                          </h5>
                          <div className="space-y-2">
                            {mediaType === 'tv' ? (
                              <>
                                <div className="flex items-center space-x-2 text-sm">
                                  <code className="px-2 py-1 bg-white rounded text-green-600 font-mono text-xs">100-1450</code>
                                  <span className="text-blue-700">TRP range (Target Rating Points)</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <code className="px-2 py-1 bg-white rounded text-green-600 font-mono text-xs">0.00-100.00</code>
                                  <span className="text-blue-700">Reach percentages</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <code className="px-2 py-1 bg-white rounded text-orange-600 font-mono text-xs">≤0.701%</code>
                                  <span className="text-blue-700">Saturation threshold</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center space-x-2 text-sm">
                                  <code className="px-2 py-1 bg-white rounded text-green-600 font-mono text-xs">$50K-$2M</code>
                                  <span className="text-green-700">Budget range</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <code className="px-2 py-1 bg-white rounded text-green-600 font-mono text-xs">1.0-5.0</code>
                                  <span className="text-green-700">Frequency values</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <code className="px-2 py-1 bg-white rounded text-green-600 font-mono text-xs">0-100%</code>
                                  <span className="text-green-700">Reach percentages</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`mt-4 p-3 bg-white bg-opacity-60 rounded-lg border ${mediaType === 'tv' ? 'border-blue-200' : 'border-green-200'}`}>
                        <div className="flex items-start space-x-2">
                          <FiRefreshCw className={`h-4 w-4 mt-0.5 ${mediaType === 'tv' ? 'text-blue-600' : 'text-green-600'}`} />
                          <div className={`text-xs ${mediaType === 'tv' ? 'text-blue-700' : 'text-green-700'}`}>
                            <strong>Data Persistence:</strong> Your data automatically saves and replaces existing curves for the same country/business unit combination.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Tab */}
            {activeTab === 'validation' && (
              <div>
                {currentSession ? (
                  <div className="text-center py-12 text-gray-500">
                    Validation component will be rendered here for {mediaType.toUpperCase()} session: {currentSession}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiBarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Data to Validate
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Upload a CSV file to view validation results and data preview.
                    </p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Go to Step 1 - Upload Data
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* TV Diminishing Returns */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <FiTv className="h-5 w-5 mr-2 text-blue-500" />
                        TV Diminishing Returns
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div>
                            <div className="font-medium text-blue-900">TvDiminishingReturns Table</div>
                            <div className="text-sm text-blue-700">TRP vs Reach curves</div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-600">
                            Active
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">7</div>
                            <div className="text-xs text-gray-500">Core Fields</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">TRP</div>
                            <div className="text-xs text-gray-500">Input Metric</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Digital Diminishing Returns */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <FiSmartphone className="h-5 w-5 mr-2 text-green-500" />
                        Digital Diminishing Returns
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div>
                            <div className="font-medium text-green-900">DigitalDiminishingReturns Table</div>
                            <div className="text-sm text-green-700">Budget vs Reach & Frequency curves</div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-600">
                            Active
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">8</div>
                            <div className="text-xs text-gray-500">Core Fields</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-gray-900">Budget</div>
                            <div className="text-xs text-gray-500">Input Metric</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Import History</h3>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-8 text-gray-500">
                      <FiDatabase className="h-8 w-8 mx-auto mb-2" />
                      <p>Diminishing returns import history will appear here after successful imports</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}