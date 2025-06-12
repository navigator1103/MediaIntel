'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiInfo, FiArrowLeft, FiLoader } from 'react-icons/fi';
import DataPreviewGrid, { ValidationIssue } from '@/components/media-sufficiency/DataPreviewGrid';
import MediaSufficiencyValidator from '@/lib/validation/mediaSufficiencyValidator';

export default function EnhancedValidate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [masterData, setMasterData] = useState<any>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'in-progress' | 'success' | 'error'>('idle');
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    stage: string;
  }>({ current: 0, total: 0, percentage: 0, stage: 'Not started' });
  const [importErrors, setImportErrors] = useState<Array<{ message: string }>>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [validator, setValidator] = useState<MediaSufficiencyValidator | null>(null);
  const [validationSummary, setValidationSummary] = useState<any>(null);
  const [highlightedCell, setHighlightedCell] = useState<{rowIndex: number, columnName: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Load session data and initialize validator
  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        // Redirect to upload page after a short delay
        setTimeout(() => {
          router.push('/admin/media-sufficiency/enhanced-upload');
        }, 3000);
        return;
      }
      
      try {
        // Fetch session data from API
        const response = await fetch(`/api/admin/media-sufficiency/enhanced-session?sessionId=${sessionId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch session data');
        }
        
        const data = await response.json();
        
        // Set session metadata
        setFileName(data.sessionData.fileName || 'Unknown file');
        setFileSize(data.sessionData.fileSize || 0);
        setRecordCount(data.sessionData.recordCount || 0);
        
        // Set CSV data
        if (data.records && data.records.length > 0) {
          setCsvData(data.records);
        }
        
        // Set validation issues if they exist in the response
        if (data.validationIssues) {
          // Ensure validationIssues is an array
          const issues = Array.isArray(data.validationIssues) ? data.validationIssues : [];
          console.log('Validation issues:', issues.length);
          setValidationIssues(issues);
          setValidationStatus('success');
        } else {
          console.log('No validation issues in response');
          setValidationIssues([]);
        }
        
        // Set validation summary if it exists
        if (data.validationSummary) {
          setValidationSummary(data.validationSummary);
        }
        
        // Set master data
        if (data.sessionData && data.sessionData.masterData) {
          setMasterData(data.sessionData.masterData);
          
          try {
            // Fetch additional master data from our API endpoint
            const masterDataResponse = await fetch('/api/admin/media-sufficiency/master-data');
            if (masterDataResponse.ok) {
              const additionalMasterData = await masterDataResponse.json();
              
              // Merge the master data
              const mergedMasterData = {
                ...data.sessionData.masterData,
                ...additionalMasterData
              };
              
              setMasterData(mergedMasterData);
              
              // Initialize validator with merged master data
              const newValidator = new MediaSufficiencyValidator(mergedMasterData);
              setValidator(newValidator);
            } else {
              // If API fails, still initialize with original master data
              const newValidator = new MediaSufficiencyValidator(data.sessionData.masterData);
              setValidator(newValidator);
            }
          } catch (error) {
            console.error('Error fetching additional master data:', error);
            // Initialize with original master data if API fails
            const newValidator = new MediaSufficiencyValidator(data.sessionData.masterData);
            setValidator(newValidator);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading session data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
        setError(errorMessage.includes('not found') ? 'Session not found. Please upload a file first.' : errorMessage);
        setLoading(false);
        
        // Redirect to upload page after a short delay for session errors
        if (errorMessage.includes('not found') || errorMessage.includes('session')) {
          setTimeout(() => {
            router.push('/admin/media-sufficiency/enhanced-upload');
          }, 3000);
        }
      }
    };
    
    loadSessionData();
  }, [sessionId]);
  
  // Run validation when data and validator are ready
  useEffect(() => {
    if (csvData.length > 0 && validator) {
      // Create an async function inside useEffect
      const executeValidation = async () => {
        try {
          await runValidation();
        } catch (error) {
          console.error('Error executing validation:', error);
          setValidationStatus('error');
          setError(error instanceof Error ? error.message : 'Validation failed');
        }
      };
      
      // Call the async function
      executeValidation();
    }
  }, [csvData, validator]);
  
  // Run validation
  const runValidation = async () => {
    if (!validator || csvData.length === 0) return;
    
    setValidationStatus('validating');
    console.log('Starting validation with data:', csvData.slice(0, 2)); // Log first 2 records
    console.log('Master data available:', masterData ? Object.keys(masterData) : 'None');
    
    try {
      // Validate all records - properly await the Promise
      console.log('Running validator.validateAll...');
      const issues = await validator.validateAll(csvData);
      
      // Ensure issues is an array
      if (!Array.isArray(issues)) {
        console.error('validateAll did not return an array:', issues);
        throw new Error('Validation failed: Invalid response format');
      }
      
      console.log(`Validation complete. Found ${issues.length} issues.`);
      if (issues.length > 0) {
        console.log('Sample issues:', issues.slice(0, 5)); // Log first 5 issues
      }
      setValidationIssues(issues);
      
      // Generate validation summary
      console.log('Generating validation summary...');
      const summary = validator.getValidationSummary(issues);
      console.log('Validation summary:', summary);
      setValidationSummary(summary);
      
      setValidationStatus('success');
    } catch (error) {
      console.error('Error during validation:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
      setValidationStatus('error');
      setError(error instanceof Error ? error.message : 'Validation failed');
    }
  };
  
  // Function to update session data on the server
  const updateSessionData = async (updatedData: any[]) => {
    if (!sessionId) return;
    
    try {
      console.log('Updating session data on server with latest edits...');
      const response = await fetch('/api/admin/media-sufficiency/update-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          records: updatedData
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update session data:', errorText);
      } else {
        console.log('Session data updated successfully');
      }
    } catch (error) {
      console.error('Error updating session data:', error);
    }
  };
  
  // Handle data changes from the grid with chunked validation for large datasets
  const handleDataChange = async (updatedData: any[]) => {
    setCsvData(updatedData);
    
    // Update session data on the server
    await updateSessionData(updatedData);
    
    // Re-run validation with chunking for large datasets
    if (validator) {
      try {
        // Set validation status to in-progress
        setValidationStatus('in-progress');
        setValidationProgress(0);
        
        // Define chunk size based on data size
        const CHUNK_SIZE = updatedData.length > 5000 ? 500 : 1000;
        const totalChunks = Math.ceil(updatedData.length / CHUNK_SIZE);
        let allIssues: ValidationIssue[] = [];
        
        // Process validation in chunks
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const startIndex = chunkIndex * CHUNK_SIZE;
          const endIndex = Math.min(startIndex + CHUNK_SIZE, updatedData.length);
          const dataChunk = updatedData.slice(startIndex, endIndex);
          
          // Update progress
          const currentProgress = Math.round(((chunkIndex) / totalChunks) * 100);
          setValidationProgress(currentProgress);
          
          // Process this chunk
          // Use a small timeout to allow UI updates between chunks
          await new Promise<void>((resolve) => {
            setTimeout(async () => {
              try {
                // Validate this chunk - use validateAll with offset adjustment
                const chunkIssues = await validator.validateAll(dataChunk);
                if (Array.isArray(chunkIssues)) {
                  // Adjust row indices to match the original data
                  const adjustedIssues = chunkIssues.map(issue => ({
                    ...issue,
                    rowIndex: issue.rowIndex + startIndex
                  }));
                  allIssues = [...allIssues, ...adjustedIssues];
                }
                resolve();
              } catch (error) {
                console.error(`Error validating chunk ${chunkIndex}:`, error);
                resolve(); // Continue despite errors
              }
            }, 0);
          });
        }
        
        // All chunks processed
        setValidationProgress(100);
        setValidationIssues(allIssues);
        
        // Update validation summary
        const summary = validator.getValidationSummary(allIssues);
        setValidationSummary(summary);
        
        // Update validation status
        setValidationStatus('success');
      } catch (error) {
        console.error('Error during validation:', error);
        setError(error instanceof Error ? error.message : 'Validation failed');
        setValidationStatus('error');
      }
    }
  };
  
  // Handle cell edit
  const handleCellEdit = async (rowIndex: number, columnName: string, newValue: any) => {
    // Update the data
    const updatedData = [...csvData];
    updatedData[rowIndex][columnName] = newValue;
    setCsvData(updatedData);
    
    // Update session data on the server
    await updateSessionData(updatedData);
    
    // Clear highlighted cell
    setHighlightedCell(null);
    
    // Re-run validation
    if (validator) {
      try {
        // Properly await the Promise
        const newIssues = await validator.validateAll(updatedData);
        
        // Ensure issues is an array
        if (Array.isArray(newIssues)) {
          setValidationIssues(newIssues);
          
          // Update validation summary
          const summary = validator.getValidationSummary(newIssues);
          setValidationSummary(summary);
        } else {
          console.error('validateAll did not return an array:', newIssues);
          setError('Validation failed: Invalid response format');
        }
      } catch (error) {
        console.error('Error during validation after cell edit:', error);
        setError(error instanceof Error ? error.message : 'Validation failed');
      }
    }
  };

  // Handle import to SQLite
  const handleImportToSQLite = async () => {
    if (!sessionId) return;
    
    try {
      // Set initial import status
      setImportStatus('importing');
      setImportProgress({ current: 0, total: csvData.length, percentage: 0, stage: 'Starting import...' });
      
      console.log('Starting import process with session ID:', sessionId);
      
      // Call the SQLite import API with better error handling
      try {
        const response = await fetch('/api/admin/media-sufficiency/import-sqlite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            sessionId
            // Don't send csvData, the API will read it from the session file
          }),
          // Add cache control to prevent caching issues
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Failed to import data';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If parsing fails, use the raw error text
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
        
        console.log('Import API call successful');
      } catch (fetchError: unknown) {
        console.error('Error calling import API:', fetchError);
        setImportStatus('error');
        
        // Handle the error safely
        let errorMessage = 'Unknown error during import';
        if (fetchError instanceof Error) {
          errorMessage = fetchError.message;
        } else if (typeof fetchError === 'string') {
          errorMessage = fetchError;
        }
        
        setImportErrors([{ message: errorMessage }]);
        return; // Exit early to prevent polling
      }
      
      // Start polling for progress updates
      console.log('Starting progress polling for session ID:', sessionId);
      let pollCount = 0;
      const maxPolls = 300; // Maximum number of polls (5 minutes at 1 second intervals)
      
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          if (pollCount > maxPolls) {
            console.log('Maximum polling attempts reached');
            clearInterval(pollInterval);
            setImportStatus('error');
            setImportErrors([{ message: 'Import process timed out after 5 minutes' }]);
            return;
          }
          
          // Add timestamp to prevent caching
          const timestamp = new Date().getTime();
          console.log(`Polling import progress for session ${sessionId}, poll #${pollCount}`);
          
          const response = await fetch(`/api/admin/media-sufficiency/import-progress?sessionId=${sessionId}&_t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Pragma': 'no-cache',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          // If response is not ok, log the error
          if (!response.ok) {
            console.error(`Error checking import progress: ${response.status} ${response.statusText}`);
            console.error('Response headers:', Object.fromEntries([...response.headers.entries()]));
            // Don't stop polling on temporary API errors
            return;
          }
          
          // Get the response text first for debugging
          const responseText = await response.text();
          console.log(`Poll #${pollCount} raw response:`, responseText);
          
          // Try to parse the JSON
          let data: { 
            progress?: number; 
            status?: string; 
            errors?: any[];
            error?: string;
          } = {};
          
          try {
            data = JSON.parse(responseText);
            console.log(`Poll #${pollCount} parsed response:`, data);
          } catch (parseError) {
            console.error(`Error parsing progress response: ${parseError}`);
            return;
          }
          
          // Update progress state if it exists
          if (data && data.progress !== undefined) {
            console.log(`Setting progress: ${JSON.stringify(data.progress)}`);
            // Check if data.progress is a number or an object
            if (typeof data.progress === 'number') {
              // If it's a number, update the percentage while keeping other properties
              setImportProgress(prev => ({
                ...prev,
                percentage: data.progress as number,
                current: Math.floor((data.progress as number / 100) * prev.total),
                stage: 'Importing data'
              }));
            } else if (typeof data.progress === 'object' && data.progress !== null) {
              // If it's an object, merge with current state
              setImportProgress(prev => ({
                ...prev,
                ...(data.progress as any)
              }));
            }
          } else {
            console.warn('No progress data in response');
          }
          
          // Update import status based on the status from the server
          if (data.status === 'completed') {
            console.log('Import completed successfully');
            setImportStatus('success');
            clearInterval(pollInterval);
            
            // Show success message briefly before redirecting
            setSuccessMessage('Data imported successfully!');
            setTimeout(() => {
              router.push('/admin/media-sufficiency');
            }, 2000);
          } else if (data.status === 'error') {
            console.log('Import failed with error');
            setImportStatus('error');
            setImportErrors(data.errors || []);
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error('Fetch error during polling:', error);
          // Don't stop polling on temporary network errors
          return;
        }
      }, 1000); // Poll every second
      // Safety cleanup - clear interval after 5 minutes regardless
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 300000);
      
    } catch (error) {
      console.error('Error importing data:', error);
      setImportStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to import data');
    }
  };
  
  // Check if import is allowed
  const canImport: boolean = !!(validator && validationStatus === 'success' && (() => {
    // Ensure validationIssues is an array before calling canImport
    if (validator && Array.isArray(validationIssues)) {
      return validator.canImport(validationIssues);
    }
    return false;
  })());
  
  return (
    <div className="p-6 max-w-full mx-auto" style={{ maxWidth: '95vw' }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Enhanced Data Validation</h1>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
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
        <div className="space-y-6">
          {/* File Info */}
          <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-800">{fileName}</h2>
              <p className="text-sm text-gray-600">
                {recordCount} records • {(fileSize / 1024).toFixed(2)} KB
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {validationStatus === 'success' && validationSummary && (
                <>
                  <FiAlertCircle className="text-red-500" />
                  <span className="text-red-700 font-medium">{validationSummary?.critical || 0}</span>
                  <FiAlertTriangle className="text-yellow-500 ml-2" />
                  <span className="text-yellow-700 font-medium">{validationSummary?.warning || 0}</span>
                  <FiInfo className="text-blue-500 ml-2" />
                  <span className="text-blue-700 font-medium">{validationSummary?.suggestion || 0}</span>
                </>
              )}
              
              {validationStatus === 'validating' && (
                <div className="flex items-center text-indigo-600">
                  <FiLoader className="animate-spin mr-2" />
                  <span>Validating...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Data Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Data Preview</h3>
            <p className="text-sm text-gray-600 mb-4">
              Preview and edit your data below. Click on cells to edit values. Cells with validation issues are highlighted.
            </p>
            
            {csvData.length > 0 ? (
              <DataPreviewGrid
                data={csvData}
                validationIssues={validationIssues}
                onDataChange={handleDataChange}
                onCellEdit={handleCellEdit}
                highlightedCell={highlightedCell}
                validationStatus={validationStatus}
                validationSummary={validationSummary}
                importStatus={importStatus}
                importProgress={importProgress}
                importErrors={importErrors}
                onImport={handleImportToSQLite}
                canImport={canImport}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No data available
              </div>
            )}
          </div>
          
          {/* Import Status Summary */}
          {validationStatus === 'success' && validationSummary && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Import Status</h3>
              <div className={`p-3 rounded-lg ${canImport ? 'bg-green-50' : 'bg-red-50'}`}>
                {canImport ? (
                  <p className="text-green-700 flex items-center">
                    <FiCheckCircle className="mr-2" />
                    Data is ready to be imported ({validationSummary.total || 0} total issues found)
                  </p>
                ) : (
                  <p className="text-red-700 flex items-center">
                    <FiAlertCircle className="mr-2" />
                    Critical issues must be fixed before import ({validationSummary.critical || 0} critical issues found)
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/admin/media-sufficiency')}
              className="px-4 py-2 flex items-center text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              <FiArrowLeft className="mr-2" />
              Back to Upload
            </button>
            
            <div className="flex space-x-4">
              <button
                onClick={runValidation}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
                disabled={validationStatus === 'validating'}
              >
                {validationStatus === 'validating' ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  <>Revalidate Data</>
                )}
              </button>
              
              <button
                onClick={handleImportToSQLite}
                disabled={importStatus === 'importing' || !canImport}
                className={`px-6 py-3 rounded-md font-medium flex items-center justify-center transition-colors ${importStatus === 'importing' || !canImport
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
              >
                {importStatus === 'importing' ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Importing to SQLite...
                  </>
                ) : (
                  <>Import to SQLite</>
                )}
              </button>
            </div>
          </div>
          
          {/* Import Progress Bar */}
          {importStatus === 'importing' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-700 mb-2">
                <FiLoader className="animate-spin mr-2" />
                <span className="font-medium">Import Progress</span>
              </div>
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out" 
                    style={{ width: `${importProgress.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{importProgress.current} of {importProgress.total} records processed</span>
                <span>{importProgress.percentage}%</span>
              </div>
              <p className="text-blue-600 mt-2">
                {importProgress.stage}
              </p>
            </div>
          )}
          
          {/* Import Error */}
          {importStatus === 'error' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-700 mb-2">
                <FiAlertTriangle className="mr-2" />
                <span className="font-medium">Import Error</span>
              </div>
              <p className="text-red-600">
                {error || 'An error occurred during the import process. Please try again.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}