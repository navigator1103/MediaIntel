'use client';

import React, { useState } from 'react';
import { FiBarChart, FiUpload, FiDatabase, FiFileText, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiDownload } from 'react-icons/fi';
import ReachPlanningUpload from '@/components/reach-planning/ReachPlanningUpload';
import ReachPlanningGrid from '@/components/reach-planning/ReachPlanningGrid';

interface SessionSummary {
  sessionId: string;
  fileName: string;
  totalRecords: number;
  validationSummary?: {
    total: number;
    critical: number;
    warning: number;
    suggestion: number;
  };
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface LastUpdate {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReachPlanningPage() {
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [activeTab, setActiveTab] = useState('export');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [lastUpdates, setLastUpdates] = useState<LastUpdate[]>([]);
  const [selectedLastUpdateId, setSelectedLastUpdateId] = useState<string>('');
  const [loadingLastUpdates, setLoadingLastUpdates] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load countries and last updates on component mount since default tab is 'export'
  React.useEffect(() => {
    loadCountries();
    loadLastUpdates();
  }, []);

  const handleUploadComplete = (sessionId: string) => {
    setCurrentSession(sessionId);
    setActiveTab('validation');
  };

  const handleValidationComplete = (sessionId: string, summary: any) => {
    setSessionSummary({
      sessionId,
      fileName: sessionSummary?.fileName || 'uploaded-file.csv',
      totalRecords: summary.uniqueRows || 0,
      validationSummary: summary
    });
  };

  const resetSession = () => {
    setCurrentSession(null);
    setSessionSummary(null);
    setActiveTab('export');
  };

  const loadCountries = async () => {
    if (countries.length > 0) return; // Already loaded
    
    try {
      setLoadingCountries(true);
      const response = await fetch('/api/admin/reach-planning/countries');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch countries');
      }
      
      const countriesData = await response.json();
      setCountries(countriesData);
    } catch (error) {
      console.error('Error loading countries:', error);
      alert(`Error loading countries: ${error.message}`);
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadLastUpdates = async () => {
    if (lastUpdates.length > 0) return; // Already loaded
    
    try {
      setLoadingLastUpdates(true);
      const response = await fetch('/api/admin/media-sufficiency/last-updates');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch financial cycles');
      }
      
      const lastUpdatesData = await response.json();
      setLastUpdates(lastUpdatesData);
    } catch (error) {
      console.error('Error loading financial cycles:', error);
      alert(`Error loading financial cycles: ${error.message}`);
    } finally {
      setLoadingLastUpdates(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'export') {
      loadCountries();
      loadLastUpdates();
    }
  };

  const handleExport = async () => {
    if (!selectedCountry) {
      alert('Please select a country first');
      return;
    }
    
    if (!selectedLastUpdateId) {
      alert('Please select a financial cycle first');
      return;
    }

    try {
      setExporting(true);
      const response = await fetch('/api/admin/reach-planning/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          countryId: selectedCountry,
          lastUpdateId: selectedLastUpdateId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'media-sufficiency-export.csv';

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Media Sufficiency Import
              </h1>
              <p className="text-gray-600">
                Import and validate media sufficiency data for campaign analysis
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
                    <FiFileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">{sessionSummary.fileName}</div>
                      <div className="text-sm text-gray-500">
                        {sessionSummary.totalRecords} records • Session: {sessionSummary.sessionId}
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
                onClick={() => handleTabChange('export')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'export'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="inline-flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-2">1</span>
                  <FiDownload className="h-4 w-4 mr-2" />
                  Export Template
                </span>
              </button>
              <button
                onClick={() => handleTabChange('upload')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="inline-flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-2">2</span>
                  <FiUpload className="h-4 w-4 mr-2" />
                  Upload Data
                </span>
              </button>
              <button
                onClick={() => handleTabChange('validation')}
                disabled={!currentSession}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'validation' && currentSession
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${!currentSession ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="inline-flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-2">3</span>
                  <FiBarChart className="h-4 w-4 mr-2" />
                  Validate & Import
                </span>
              </button>
              <button
                onClick={() => handleTabChange('database')}
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
                <ReachPlanningUpload 
                  onUploadComplete={handleUploadComplete}
                  onValidationComplete={handleValidationComplete}
                />
                
                {/* Upload Instructions */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Upload Instructions</h3>
                    <a
                      href="/templates/media-sufficiency-import-template.csv"
                      download="media-sufficiency-import-template.csv"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <FiFileText className="h-4 w-4 mr-2" />
                      Download Template
                    </a>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Fields</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <span className="text-red-600">• Last Update</span>
                        <span className="text-red-600">• Sub Region</span>
                        <span className="text-red-600">• Country</span>
                        <span className="text-red-600">• Category</span>
                        <span className="text-red-600">• Range</span>
                        <span className="text-red-600">• Campaign</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Optional Fields</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <span>• BU</span>
                        <span>• Franchise NS</span>
                        <span>• Campaign Socio-Demo Target</span>
                        <span>• TV Copy Length</span>
                        <span>• Total TRPs</span>
                        <span>• TV/Digital Reach metrics</span>
                        <span>• CPP 2024/2025</span>
                        <span>• WOA metrics</span>
                        <span>• Reach Level Checks</span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-blue-900">File Format Requirements & Validation</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• CSV format only</li>
                        <li>• Maximum file size: 10MB</li>
                        <li>• First row must contain column headers</li>
                        <li>• Download the template above for the correct format and example data</li>
                      </ul>
                      <h5 className="font-medium mt-3 mb-1 text-blue-900">Data Validation Rules:</h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• <strong>Text fields:</strong> Must contain text, not just numbers</li>
                        <li>• <strong>Numeric fields:</strong> Must be valid numbers (commas allowed)</li>
                        <li>• <strong>Percentage fields:</strong> 0-100% or 0-1 decimal format (includes Reach Level Check fields)</li>
                        <li>• <strong>Reach Level Check fields:</strong> Should contain percentages (e.g., "1%", "6%", "3%")</li>
                        <li>• <strong>Media compatibility:</strong> Media Sub Type must match Media type</li>
                        <li>• <strong>Database validation:</strong> Country, Category, Range, Campaign, and Media values must exist in database</li>
                        <li>• <strong>Relationship validation:</strong> Ranges must be compatible with Categories, Campaigns with Ranges, etc.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FiDownload className="h-5 w-5 mr-2" />
                      Export Pre-filled Template
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h4 className="font-medium mb-2 text-blue-900">How it works</h4>
                      <p className="text-sm text-blue-800">
                        Export a Media Sufficiency template pre-filled with campaign data from your Game Plans. 
                        The template will include all campaign structures (Country, Category, Range, Campaign) 
                        but you'll need to fill in the reach metrics manually.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Financial Cycle
                        </label>
                        {loadingLastUpdates ? (
                          <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                            <span className="text-sm text-gray-500">Loading financial cycles...</span>
                          </div>
                        ) : (
                          <select 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={selectedLastUpdateId}
                            onChange={(e) => setSelectedLastUpdateId(e.target.value)}
                          >
                            <option value="">Choose a financial cycle...</option>
                            {lastUpdates.map((update) => (
                              <option key={update.id} value={update.id.toString()}>
                                {update.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Country
                        </label>
                        {loadingCountries ? (
                          <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                            <span className="text-sm text-gray-500">Loading countries...</span>
                          </div>
                        ) : (
                          <select 
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                          >
                            <option value="">Choose a country...</option>
                            {countries.map((country) => (
                              <option key={country.id} value={country.id.toString()}>
                                {country.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      
                      <button 
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!selectedCountry || !selectedLastUpdateId || exporting}
                      >
                        {exporting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FiDownload className="h-4 w-4 mr-2" />
                            Export Pre-filled Template
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Tab */}
            {activeTab === 'validation' && (
              <div>
                {currentSession ? (
                  <ReachPlanningGrid sessionId={currentSession} />
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
                      onClick={() => handleTabChange('upload')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Go to Step 2 - Upload Data
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Database Status</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-green-900">MediaSufficiency Table</div>
                          <div className="text-sm text-green-700">Ready for imports</div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-600">
                          Active
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">34</div>
                          <div className="text-sm text-gray-500">Total Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">6</div>
                          <div className="text-sm text-gray-500">Required Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">8</div>
                          <div className="text-sm text-gray-500">Numeric Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">7</div>
                          <div className="text-sm text-gray-500">Percentage Fields</div>
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
                      <p>Import history will appear here after successful imports</p>
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