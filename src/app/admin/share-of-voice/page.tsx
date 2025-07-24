'use client';

import React, { useState } from 'react';
import { FiBarChart, FiUpload, FiDatabase, FiFileText, FiArrowLeft, FiCheckCircle, FiDownload, FiTv, FiSmartphone } from 'react-icons/fi';
import ShareOfVoiceUpload from '@/components/share-of-voice/ShareOfVoiceUpload';
import ShareOfVoiceGrid from '@/components/share-of-voice/ShareOfVoiceGrid';

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
  country?: string;
  businessUnit?: string;
}

export default function ShareOfVoicePage() {
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [mediaType, setMediaType] = useState<'tv' | 'digital'>('tv');
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('');

  const handleUploadComplete = (sessionId: string) => {
    setCurrentSession(sessionId);
    setActiveTab('validation');
  };

  const handleValidationComplete = (sessionId: string, summary: any) => {
    setSessionSummary({
      sessionId,
      fileName: sessionSummary?.fileName || 'uploaded-file.csv',
      totalRecords: summary.uniqueRows || 0,
      validationSummary: summary,
      country: summary.validationDetails?.country,
      businessUnit: summary.validationDetails?.businessUnit
    });
  };

  const handleBusinessUnitChange = (businessUnit: string) => {
    setSelectedBusinessUnit(businessUnit);
  };

  const resetSession = () => {
    setCurrentSession(null);
    setSessionSummary(null);
    setActiveTab('upload');
    setMediaType('tv');
    setSelectedBusinessUnit('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Share of Voice (SOV) Management
              </h1>
              <p className="text-gray-600">
                Upload and manage competitor share of voice data by business unit and country
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
                  Upload SOV Data
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
                    <h3 className="text-lg font-medium text-gray-900">Select SOV Data Type</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose whether you want to upload TV or Digital share of voice data
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
                            TV Share of Voice
                          </h4>
                          <p className={`text-sm mt-1 ${mediaType === 'tv' ? 'text-blue-700' : 'text-gray-500'}`}>
                            TV Investment & TRP data
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
                            Digital Share of Voice
                          </h4>
                          <p className={`text-sm mt-1 ${mediaType === 'digital' ? 'text-green-700' : 'text-gray-500'}`}>
                            Digital spend & impression data
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <ShareOfVoiceUpload 
                  mediaType={mediaType}
                  onUploadComplete={handleUploadComplete}
                  onValidationComplete={handleValidationComplete}
                  onBusinessUnitChange={handleBusinessUnitChange}
                />
                
                {/* Upload Instructions */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        {mediaType === 'tv' ? (
                          <>
                            <FiTv className="h-5 w-5 mr-2 text-blue-500" />
                            TV Share of Voice Upload Instructions
                          </>
                        ) : (
                          <>
                            <FiSmartphone className="h-5 w-5 mr-2 text-green-500" />
                            Digital Share of Voice Upload Instructions
                          </>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {mediaType === 'tv' 
                          ? 'Upload TV investment and TRP competitor data' 
                          : 'Upload digital spend and impression competitor data'
                        }
                      </p>
                    </div>
                    {selectedBusinessUnit && (
                      <a
                        href={mediaType === 'tv' ? 
                          `/templates/sov-tv-template-${selectedBusinessUnit.toLowerCase()}.csv` : 
                          `/templates/sov-digital-template-${selectedBusinessUnit.toLowerCase()}.csv`
                        }
                        download={mediaType === 'tv' ? 
                          `sov-tv-template-${selectedBusinessUnit.toLowerCase()}.csv` : 
                          `sov-digital-template-${selectedBusinessUnit.toLowerCase()}.csv`
                        }
                        className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md hover:bg-gray-50 ${
                          mediaType === 'tv' 
                            ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                            : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        <FiDownload className="h-4 w-4 mr-2" />
                        Download {selectedBusinessUnit} {mediaType === 'tv' ? 'TV' : 'Digital'} Template
                      </a>
                    )}
                    {!selectedBusinessUnit && (
                      <div className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md bg-gray-100 text-gray-400 cursor-not-allowed">
                        <FiDownload className="h-4 w-4 mr-2" />
                        Select Business Unit First
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Steps</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <span>Select Country from the dropdown</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <span>Select Business Unit (Nivea or Derma)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          <span>Upload CSV file with SOV data</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required CSV Fields</h4>
                      {mediaType === 'tv' ? (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-red-600">• Category</span>
                          <span className="text-red-600">• Company</span>
                          <span className="text-blue-600">• Total TV Investment (optional)</span>
                          <span className="text-blue-600">• Total TV TRPs (optional)</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-red-600">• Category</span>
                          <span className="text-red-600">• Company</span>
                          <span className="text-green-600">• Total Digital Spend (optional)</span>
                          <span className="text-green-600">• Total Digital Impressions (optional)</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Business Unit Categories</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-900">Nivea Categories:</span>
                          <div className="mt-1 text-gray-600">
                            Face Care, Hand Body, Face Cleansing, Sun, Men, Deo, Lip
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-purple-900">Derma Categories:</span>
                          <div className="mt-1 text-gray-600">
                            Acne, Anti Pigment, Sun, Body Lotion, Aquaphor, etc.
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${mediaType === 'tv' ? 'bg-blue-50' : 'bg-green-50'}`}>
                      <h4 className={`font-medium mb-2 ${mediaType === 'tv' ? 'text-blue-900' : 'text-green-900'}`}>
                        {mediaType === 'tv' ? 'TV' : 'Digital'} Data Requirements
                      </h4>
                      <ul className={`text-sm space-y-1 ${mediaType === 'tv' ? 'text-blue-800' : 'text-green-800'}`}>
                        <li>• <strong>Company names:</strong> "Nivea", "Competitor 1", "Competitor 2", etc.</li>
                        <li>• <strong>Categories:</strong> Must match the selected business unit</li>
                        <li>• <strong>{mediaType === 'tv' ? 'Investment/TRPs' : 'Spend/Impressions'}:</strong> Numeric values (commas allowed)</li>
                        <li>• <strong>Unique combinations:</strong> Each Category + Company combo should appear once</li>
                        <li>• <strong>Data separation:</strong> {mediaType === 'tv' ? 'TV' : 'Digital'} data is kept separate to avoid overwriting</li>
                        <li>• <strong>Data replacement:</strong> Upload will replace existing {mediaType === 'tv' ? 'TV' : 'Digital'} SOV data for the same country/business unit</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Tab */}
            {activeTab === 'validation' && (
              <div>
                {currentSession ? (
                  <ShareOfVoiceGrid sessionId={currentSession} key={`${currentSession}-${activeTab}`} />
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
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Database Status</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-green-900">ShareOfVoice Table</div>
                          <div className="text-sm text-green-700">Ready for SOV data imports</div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-600">
                          Active
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">4</div>
                          <div className="text-sm text-gray-500">Core Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">2</div>
                          <div className="text-sm text-gray-500">Required Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">2</div>
                          <div className="text-sm text-gray-500">Numeric Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">2</div>
                          <div className="text-sm text-gray-500">Foreign Keys</div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Data Structure</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><span className="font-medium">Country:</span> Links to selected country</div>
                          <div><span className="font-medium">Business Unit:</span> Links to Nivea or Derma</div>
                          <div><span className="font-medium">Category:</span> Business unit specific categories</div>
                          <div><span className="font-medium">Company:</span> Brand and competitors 1-5</div>
                          <div><span className="font-medium">Investment & TRPs:</span> Numeric performance data</div>
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
                      <p>SOV import history will appear here after successful imports</p>
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