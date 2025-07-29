'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiUpload, FiDatabase, FiFileText, FiArrowLeft, FiCheckCircle, FiAlertCircle, FiBarChart } from 'react-icons/fi';
import GamePlansUpload from '@/components/game-plans/GamePlansUpload';
import GamePlansValidation from '@/components/game-plans/GamePlansValidation';

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

export default function GamePlansUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  
  const [currentSession, setCurrentSession] = useState<string | null>(sessionIdFromUrl);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [activeTab, setActiveTab] = useState(sessionIdFromUrl ? 'validation' : 'upload');

  // Update current session when URL changes
  useEffect(() => {
    if (sessionIdFromUrl) {
      setCurrentSession(sessionIdFromUrl);
      setActiveTab('validation');
    }
  }, [sessionIdFromUrl]);

  const handleUploadComplete = (sessionId: string) => {
    setCurrentSession(sessionId);
    setActiveTab('validation');
    // Update URL to include session ID
    router.push(`/admin/game-plans/upload?sessionId=${sessionId}`);
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
    // Remove session ID from URL
    router.push('/admin/game-plans/upload');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Game Plans Upload
              </h1>
              <p className="text-gray-600">
                Import and manage detailed media plans with budget allocation
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
                <GamePlansUpload 
                  onUploadComplete={handleUploadComplete}
                  onValidationComplete={handleValidationComplete}
                />
                
                {/* Upload Instructions */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Upload Instructions</h3>
                    <div className="flex space-x-3">
                      <a
                        href="/templates/NIVEA_ABP2026_Nebula_Templates.xlsx"
                        download="NIVEA_ABP2026_Nebula_Templates.xlsx"
                        className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                      >
                        <FiFileText className="h-4 w-4 mr-2" />
                        Download Excel Template for Nivea
                      </a>
                      <a
                        href="/templates/DERMA_ABP2026_Nebula_Templates.xlsx"
                        download="DERMA_ABP2026_Nebula_Templates.xlsx"
                        className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                      >
                        <FiFileText className="h-4 w-4 mr-2" />
                        Download Excel Template for Derma
                      </a>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Fields</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <span className="text-red-600">• Year</span>
                        <span className="text-red-600">• Country</span>
                        <span className="text-red-600">• Category</span>
                        <span className="text-red-600">• Range</span>
                        <span className="text-red-600">• Campaign</span>
                        <span className="text-red-600">• Media Type</span>
                        <span className="text-red-600">• Media Sub Type</span>
                        <span className="text-red-600">• Burst</span>
                        <span className="text-red-600">• Start Date</span>
                        <span className="text-red-600">• End Date</span>
                        <span className="text-red-600">• Total Budget</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Optional Fields</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <span>• Sub Region</span>
                        <span>• Business Unit</span>
                        <span>• PM Type</span>
                        <span>• Q1-Q4 Budget</span>
                        <span>• Total TRPs</span>
                        <span className="text-orange-600">• Total R1+ (required for Digital, Open TV, OOH)</span>
                        <span>• Total R3+</span>
                        <span>• Total WOA</span>
                        <span>• Weeks Off Air / W Off Air</span>
                        <span>• NS vs WM</span>
                        <span>• Playbook ID</span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-blue-900">File Format Requirements</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Upload must be in CSV format (use Excel templates above, then save as CSV)</li>
                        <li>• Maximum file size: 10MB</li>
                        <li>• First row must contain column headers</li>
                        <li>• Date format: YYYY-MM-DD</li>
                        <li>• Budget values should be numeric (no currency symbols)</li>
                        <li>• Burst must be a positive integer (1, 2, 3, etc.)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 text-green-900">Excel Templates</h4>
                      <p className="text-sm text-green-800 mb-2">
                        For your convenience, we provide Excel templates with pre-configured formatting and business unit specific guidance:
                      </p>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• <strong>Nivea Template:</strong> Contains Nivea-specific categories, ranges, and campaigns</li>
                        <li>• <strong>Derma Template:</strong> Contains Derma-specific categories, ranges, and campaigns</li>
                        <li>• Templates include validation rules and dropdown lists for easier data entry</li>
                        <li>• Remember to save as CSV before uploading</li>
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
                  <GamePlansValidation sessionId={currentSession} />
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
                          <div className="font-medium text-green-900">GamePlans Table</div>
                          <div className="text-sm text-green-700">Ready for imports</div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-600">
                          Active
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">24</div>
                          <div className="text-sm text-gray-500">Total Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">10</div>
                          <div className="text-sm text-gray-500">Required Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">11</div>
                          <div className="text-sm text-gray-500">Numeric Fields</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">2</div>
                          <div className="text-sm text-gray-500">Date Fields</div>
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