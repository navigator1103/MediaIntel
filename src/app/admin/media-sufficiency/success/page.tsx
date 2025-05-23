'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiDatabase, FiArrowLeft, FiBarChart2 } from 'react-icons/fi';

interface ImportResults {
  subRegionsCount: number;
  countriesCount: number;
  categoriesCount: number;
  rangesCount: number;
  mediaTypesCount: number;
  mediaSubtypesCount: number;
  businessUnitsCount: number;
  pmTypesCount: number;
  campaignsCount: number;
  campaignMediaCount: number;
}

export default function ImportSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [recordCount, setRecordCount] = useState<number>(0);
  
  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch session data from API
        const response = await fetch(`/api/admin/media-sufficiency/session?sessionId=${sessionId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch session data');
        }
        
        const data = await response.json();
        
        // Set session data
        setFileName(data.sessionData.fileName || 'Unknown file');
        setRecordCount(data.sessionData.recordCount || 0);
        
        // Set import results if available
        if (data.sessionData.importResults) {
          setImportResults(data.sessionData.importResults);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading session data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
        setLoading(false);
      }
    };
    
    loadSessionData();
  }, [sessionId]);
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-quicksand text-gray-800">Import Successful</h1>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-quicksand"
        >
          Back to Dashboard
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-medium">Error</p>
          <p>{error}</p>
          <button
            onClick={() => router.push('/admin/media-sufficiency')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Return to Upload
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center text-green-700 mb-4">
              <FiCheckCircle className="h-8 w-8 mr-3" />
              <h2 className="text-2xl font-medium">Import Completed Successfully</h2>
            </div>
            <p className="text-green-600 mb-4">
              Your file <span className="font-medium">{fileName}</span> with {recordCount} records has been successfully imported to the PostgreSQL database and synchronized with SQLite.
            </p>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => router.push('/admin/media-sufficiency')}
                className="px-4 py-2 flex items-center text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                <FiArrowLeft className="mr-2" />
                Back to Upload
              </button>
              <button
                onClick={() => router.push('/dashboard/media-sufficiency')}
                className="px-4 py-2 flex items-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                <FiBarChart2 className="mr-2" />
                View Dashboard
              </button>
            </div>
          </div>
          
          {/* Import Results */}
          {importResults && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center text-gray-700 mb-4">
                <FiDatabase className="h-6 w-6 mr-3" />
                <h3 className="text-xl font-medium">Import Summary</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Master Data</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Sub Regions</span>
                      <span className="font-medium">{importResults.subRegionsCount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Countries</span>
                      <span className="font-medium">{importResults.countriesCount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Categories</span>
                      <span className="font-medium">{importResults.categoriesCount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Ranges</span>
                      <span className="font-medium">{importResults.rangesCount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Media Types</span>
                      <span className="font-medium">{importResults.mediaTypesCount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Media Subtypes</span>
                      <span className="font-medium">{importResults.mediaSubtypesCount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Business Units</span>
                      <span className="font-medium">{importResults.businessUnitsCount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">PM Types</span>
                      <span className="font-medium">{importResults.pmTypesCount}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Campaign Data</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Campaigns</span>
                      <span className="font-medium">{importResults.campaignsCount}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Campaign Media Items</span>
                      <span className="font-medium">{importResults.campaignMediaCount}</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Data Synchronization</h4>
                    <p className="text-blue-600 text-sm">
                      All imported data has been automatically synchronized between PostgreSQL and SQLite databases to ensure consistency across environments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
