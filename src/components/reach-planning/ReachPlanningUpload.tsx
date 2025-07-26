'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle, FiLoader } from 'react-icons/fi';

interface UploadState {
  status: 'idle' | 'uploading' | 'uploaded' | 'validating' | 'validated' | 'importing' | 'imported' | 'error';
  sessionId?: string;
  fileName?: string;
  totalRecords?: number;
  progress?: number;
  error?: string;
  validationSummary?: {
    total: number;
    critical: number;
    warning: number;
    suggestion: number;
    uniqueRows: number;
  };
  canImport?: boolean;
}

interface ReachPlanningUploadProps {
  onUploadComplete?: (sessionId: string) => void;
  onValidationComplete?: (sessionId: string, summary: any) => void;
}

interface LastUpdate {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Country {
  id: number;
  name: string;
}

export default function ReachPlanningUpload({ 
  onUploadComplete, 
  onValidationComplete 
}: ReachPlanningUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastUpdates, setLastUpdates] = useState<LastUpdate[]>([]);
  const [selectedLastUpdateId, setSelectedLastUpdateId] = useState<string>('');
  const [loadingLastUpdates, setLoadingLastUpdates] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [loadingCountries, setLoadingCountries] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndUploadFile(selectedFile);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.name.toLowerCase().endsWith('.csv')) {
        validateAndUploadFile(droppedFile);
      } else {
        setUploadState({
          status: 'error',
          error: 'Only CSV files are supported'
        });
      }
    }
  };

  // Load last updates and countries when component mounts
  useEffect(() => {
    loadLastUpdates();
    loadCountries();
  }, []);

  const loadLastUpdates = async () => {
    try {
      setLoadingLastUpdates(true);
      const response = await fetch('/api/admin/media-sufficiency/last-updates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial cycles');
      }
      
      const data = await response.json();
      setLastUpdates(data);
    } catch (error) {
      console.error('Error loading financial cycles:', error);
    } finally {
      setLoadingLastUpdates(false);
    }
  };

  const loadCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await fetch('/api/admin/reach-planning/countries');
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      
      const data = await response.json();
      setCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const validateAndUploadFile = async (file: File) => {
    try {
      // Validate selections first
      if (!selectedLastUpdateId) {
        setUploadState({
          status: 'error',
          error: 'Please select a financial cycle first'
        });
        return;
      }

      if (!selectedCountry) {
        setUploadState({
          status: 'error',
          error: 'Please select a country first'
        });
        return;
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadState({
          status: 'error',
          error: 'Only CSV files are supported'
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadState({
          status: 'error',
          error: 'File size must be less than 10MB'
        });
        return;
      }

      await uploadFile(file);
    } catch (error: any) {
      console.error('Validation and upload error:', error);
      setUploadState({
        status: 'error',
        error: error.message || 'Failed to upload file'
      });
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploadState({
        status: 'uploading',
        fileName: file.name,
        progress: 0
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('lastUpdateId', selectedLastUpdateId);
      formData.append('countryId', selectedCountry);

      const response = await fetch('/api/admin/reach-planning/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Upload failed';
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setUploadState({
        status: 'uploaded',
        sessionId: result.sessionId,
        fileName: file.name,
        totalRecords: result.totalRecords,
        progress: 100
      });

      onUploadComplete?.(result.sessionId);

      // Auto-start validation
      await validateSession(result.sessionId);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadState({
        status: 'error',
        error: error.message || 'Upload failed'
      });
    }
  };

  const validateSession = async (sessionId: string) => {
    try {
      setUploadState(prev => ({
        ...prev,
        status: 'validating'
      }));

      const response = await fetch('/api/admin/reach-planning/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Validation failed';
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setUploadState(prev => ({
        ...prev,
        status: 'validated',
        validationSummary: result.summary,
        canImport: result.canImport
      }));

      onValidationComplete?.(sessionId, result.summary);

    } catch (error: any) {
      console.error('Validation error:', error);
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Validation failed'
      }));
    }
  };

  const importData = async () => {
    if (!uploadState.sessionId) return;

    try {
      setUploadState(prev => ({
        ...prev,
        status: 'importing'
      }));

      const response = await fetch('/api/admin/reach-planning/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: uploadState.sessionId,
          uploadedBy: 'admin' // This should come from user context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();

      setUploadState(prev => ({
        ...prev,
        status: 'imported'
      }));

    } catch (error: any) {
      console.error('Import error:', error);
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Import failed'
      }));
    }
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FiUpload className="h-5 w-5 mr-2" />
            Media Sufficiency Data Upload
          </h3>
        </div>
        <div className="p-6">
          {uploadState.status === 'idle' && (
            <>
              {/* Financial Cycle Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Financial Cycle
                </label>
                <div className="relative">
                  <select
                    value={selectedLastUpdateId}
                    onChange={(e) => setSelectedLastUpdateId(e.target.value)}
                    disabled={loadingLastUpdates}
                    className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Choose a financial cycle...</option>
                    {lastUpdates.map((update) => (
                      <option key={update.id} value={update.id.toString()}>
                        {update.name}
                      </option>
                    ))}
                  </select>
                  {loadingLastUpdates && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Country Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
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
            </>
          )}

          {uploadState.status === 'idle' && selectedLastUpdateId && selectedCountry && (
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <FiUpload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                {isDragging ? 'Drop the CSV file here' : 'Upload Media Sufficiency CSV'}
              </p>
              <p className="text-gray-500 mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Maximum file size: 10MB
              </p>
            </div>
          )}

          {uploadState.status === 'uploading' && (
            <div className="text-center py-8">
              <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="font-medium">Uploading {uploadState.fileName}...</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress || 0}%` }}
                />
              </div>
            </div>
          )}

          {uploadState.status === 'uploaded' && (
            <div className="text-center py-8">
              <FiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
              <p className="font-medium">Upload Complete</p>
              <p className="text-gray-600">
                {uploadState.totalRecords} records uploaded successfully
              </p>
            </div>
          )}

          {uploadState.status === 'validating' && (
            <div className="text-center py-8">
              <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="font-medium">Validating data...</p>
            </div>
          )}

          {uploadState.status === 'validated' && uploadState.validationSummary && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">Validation Complete</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {uploadState.validationSummary.critical}
                  </div>
                  <div className="text-sm text-red-700">Critical</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {uploadState.validationSummary.warning}
                  </div>
                  <div className="text-sm text-yellow-700">Warnings</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {uploadState.validationSummary.suggestion}
                  </div>
                  <div className="text-sm text-blue-700">Suggestions</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {uploadState.validationSummary.uniqueRows}
                  </div>
                  <div className="text-sm text-gray-700">Affected Rows</div>
                </div>
              </div>

              <div className="flex space-x-4">
                {uploadState.canImport ? (
                  <button
                    onClick={importData}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Import Data to Database
                  </button>
                ) : (
                  <div className="flex-1 bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <FiAlertCircle className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <div className="text-sm text-red-800">
                          Cannot import data with critical validation errors. Please fix the issues first.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Upload New File
                </button>
              </div>
            </div>
          )}

          {uploadState.status === 'importing' && (
            <div className="text-center py-8">
              <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="font-medium">Importing data to database...</p>
            </div>
          )}

          {uploadState.status === 'imported' && (
            <div className="text-center py-8">
              <FiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
              <p className="font-medium">Import Complete</p>
              <p className="text-gray-600 mb-4">
                Data has been successfully imported to the MediaSufficiency table
              </p>
              <button
                onClick={resetUpload}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Upload Another File
              </button>
            </div>
          )}

          {uploadState.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <div className="text-sm text-red-800">
                    {uploadState.error}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}