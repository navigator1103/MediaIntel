'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle, FiLoader, FiTrendingUp, FiDownload } from 'react-icons/fi';
import CustomSelect from '@/components/ui/CustomSelect';

interface UploadState {
  status: 'idle' | 'uploading' | 'uploaded' | 'validating' | 'validated' | 'importing' | 'imported' | 'error';
  fileName?: string;
  totalRecords?: number;
  progress?: number;
  error?: string;
  importResults?: {
    successCount: number;
    errorCount: number;
    totalRecords: number;
  };
}

interface Country {
  id: number;
  name: string;
}

export default function DiminishingReturnsUploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle' });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('');
  const [loadingCountries, setLoadingCountries] = useState(false);

  // Load countries on component mount
  React.useEffect(() => {
    loadCountries();
  }, []);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndUploadFile(selectedFile);
    }
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
      if (droppedFile.name.toLowerCase().endsWith('.csv') || droppedFile.name.toLowerCase().endsWith('.xlsx')) {
        validateAndUploadFile(droppedFile);
      } else {
        setUploadState({
          status: 'error',
          error: 'Only CSV and Excel files are supported'
        });
      }
    }
  };

  const validateAndUploadFile = async (file: File) => {
    // Validate country selection
    if (!selectedCountryId) {
      setUploadState({
        status: 'error',
        error: 'Please select a country first'
      });
      return;
    }

    // Validate media type selection
    if (!selectedMediaType) {
      setUploadState({
        status: 'error',
        error: 'Please select a media type first'
      });
      return;
    }

    // Validate file type
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      setUploadState({
        status: 'error',
        error: 'Only CSV and Excel files are supported'
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
      formData.append('countryId', selectedCountryId);
      formData.append('mediaType', selectedMediaType);

      const response = await fetch('/api/admin/diminishing-returns/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      setUploadState({
        status: 'imported',
        fileName: file.name,
        totalRecords: result.totalRecords,
        progress: 100,
        importResults: result.importResults
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadState({
        status: 'error',
        error: error.message || 'Upload failed'
      });
    }
  };

  const resetUpload = () => {
    setUploadState({ status: 'idle' });
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/diminishing-returns-template.csv';
    link.download = 'diminishing-returns-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiTrendingUp className="h-6 w-6 mr-3 text-green-600" />
            Diminishing Returns Data Upload
          </h1>
          <p className="text-gray-600 mt-2">
            Upload media effectiveness curves including saturation points, TRP/budget levels, and reach performance data.
          </p>
          <div className="mt-4">
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Download CSV Template
            </button>
          </div>
        </div>

        <div className="p-6">
          {uploadState.status === 'idle' && (
            <>
              {/* Country Selection */}
              <div className="mb-6">
                <CustomSelect
                  label="Country"
                  required
                  options={countries.map(country => ({
                    value: country.id.toString(),
                    label: country.name
                  }))}
                  value={selectedCountryId}
                  onChange={setSelectedCountryId}
                  placeholder="Choose a country..."
                  loading={loadingCountries}
                  disabled={loadingCountries}
                />
              </div>

              {/* Media Type Selection */}
              <div className="mb-6">
                <CustomSelect
                  label="Media Type"
                  required
                  options={[
                    { value: 'TV', label: 'TV' },
                    { value: 'Digital', label: 'Digital' },
                    { value: 'Combined', label: 'Combined' }
                  ]}
                  value={selectedMediaType}
                  onChange={setSelectedMediaType}
                  placeholder="Choose a media type..."
                />
              </div>

              {/* File Upload Area */}
              {selectedCountryId && selectedMediaType && (
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <FiUpload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    {isDragging ? 'Drop the file here' : `Upload ${selectedMediaType} Diminishing Returns Data`}
                  </p>
                  <p className="text-gray-500 mb-4">
                    Drag and drop your CSV or Excel file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Expected format: Demographics, Saturation Point, Input Values ({selectedMediaType === 'TV' ? 'TRPs' : 'Budget'}), Reach/Frequency
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Maximum file size: 10MB
                  </p>
                </div>
              )}
            </>
          )}

          {uploadState.status === 'uploading' && (
            <div className="text-center py-8">
              <FiLoader className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="font-medium">Uploading {uploadState.fileName}...</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress || 0}%` }}
                />
              </div>
            </div>
          )}

          {uploadState.status === 'imported' && uploadState.importResults && (
            <div className="text-center py-8">
              <FiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
              <p className="font-medium text-lg mb-2">Import Complete!</p>
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {uploadState.importResults.totalRecords}
                    </div>
                    <div className="text-sm text-green-700">Total Records</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {uploadState.importResults.successCount}
                    </div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {uploadState.importResults.errorCount}
                    </div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                </div>
              </div>
              <button
                onClick={resetUpload}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
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
              <button
                onClick={resetUpload}
                className="mt-3 text-sm text-red-600 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-green-800 mb-2">Expected File Format</h3>
        <div className="text-sm text-green-700">
          <p className="mb-2">Your file should contain the following columns:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-1">TV Diminishing Returns:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Gender (F, M, BG)</li>
                <li>Min Age, Max Age</li>
                <li>SEL (optional)</li>
                <li>Final Target</li>
                <li>Saturation Point</li>
                <li>TRPs (input)</li>
                <li>R1+ Reach (output)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Digital Diminishing Returns:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Gender (F, M, BG)</li>
                <li>Min Age, Max Age</li>
                <li>SEL (optional)</li>
                <li>Final Target</li>
                <li>Saturation Point</li>
                <li>Budget (input)</li>
                <li>R1+ Reach (output)</li>
                <li>Frequency</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Combined:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Demographics</li>
                <li>Saturation Point</li>
                <li>Budget (input)</li>
                <li>Combined Reach</li>
                <li>Frequency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}