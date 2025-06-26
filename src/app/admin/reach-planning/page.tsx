'use client';

import React, { useState } from 'react';
import { FiBarChart, FiUpload, FiDatabase, FiFileText, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
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

export default function ReachPlanningPage() {
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

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
    setActiveTab('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Reach Planning Import
              </h1>
              <p className="text-gray-600">
                Import and validate reach planning data for media sufficiency analysis
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
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiUpload className="h-4 w-4 inline mr-2" />
                Upload
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
                <FiBarChart className="h-4 w-4 inline mr-2" />
                Validation
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
                <ReachPlanningUpload 
                  onUploadComplete={handleUploadComplete}
                  onValidationComplete={handleValidationComplete}
                />
                
                {/* Upload Instructions */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Upload Instructions</h3>
                    <a
                      href="/templates/reach-planning-template.csv"
                      download="reach-planning-template.csv"
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
                        <li>• <strong>Percentage fields:</strong> 0-100% or 0-1 decimal format</li>
                        <li>• <strong>Date fields:</strong> DD/MM/YYYY, DD-MM-YYYY, or YYYY-MM-DD formats</li>
                        <li>• <strong>Reach Level:</strong> Must be Sufficient, Moderate, Low, or Insufficient</li>
                        <li>• <strong>Media compatibility:</strong> Media Sub Type must match Media type</li>
                        <li>• <strong>Date range:</strong> End Date must be after Start Date</li>
                        <li>• <strong>Database validation:</strong> Country, Category, Range, Campaign, and Media values must exist in database</li>
                        <li>• <strong>Relationship validation:</strong> Ranges must be compatible with Categories, Campaigns with Ranges, etc.</li>
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
                      onClick={() => setActiveTab('upload')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Go to Upload
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
                          <div className="text-2xl font-bold text-gray-900">31</div>
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