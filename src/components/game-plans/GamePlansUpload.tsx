'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiUpload, FiFile, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import ModernDropdown from '../ui/ModernDropdown';

interface GamePlansUploadProps {
  onUploadComplete: (sessionId: string) => void;
  onValidationComplete: (sessionId: string, summary: any) => void;
}

interface LastUpdate {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface BusinessUnit {
  id: number;
  name: string;
}

export default function GamePlansUpload({ onUploadComplete, onValidationComplete }: GamePlansUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUpdates, setLastUpdates] = useState<LastUpdate[]>([]);
  const [selectedLastUpdateId, setSelectedLastUpdateId] = useState<string>('');
  const [isLoadingLastUpdates, setIsLoadingLastUpdates] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<string>('');
  const [isLoadingBusinessUnits, setIsLoadingBusinessUnits] = useState(false);

  // Fetch last updates when component mounts
  useEffect(() => {
    const fetchLastUpdates = async () => {
      setIsLoadingLastUpdates(true);
      try {
        const response = await fetch('/api/admin/media-sufficiency/last-updates');
        if (!response.ok) {
          throw new Error('Failed to fetch last updates');
        }
        const data = await response.json();
        setLastUpdates(data);
      } catch (err) {
        console.error('Error fetching last updates:', err);
        setError('Failed to load last update options. Please try refreshing the page.');
      } finally {
        setIsLoadingLastUpdates(false);
      }
    };

    fetchLastUpdates();
  }, []);

  // Fetch countries when component mounts
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch('/api/admin/media-sufficiency/master-data');
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        const data = await response.json();
        setCountries(data.countries || []);
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError('Failed to load countries. Please try refreshing the page.');
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Fetch business units when component mounts
  useEffect(() => {
    const fetchBusinessUnits = async () => {
      setIsLoadingBusinessUnits(true);
      try {
        const response = await fetch('/api/data/business-units');
        if (!response.ok) {
          throw new Error('Failed to fetch business units');
        }
        const data = await response.json();
        setBusinessUnits(data);
      } catch (err) {
        console.error('Error fetching business units:', err);
        setError('Failed to load business units. Please try refreshing the page.');
      } finally {
        setIsLoadingBusinessUnits(false);
      }
    };

    fetchBusinessUnits();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
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
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit');
      return;
    }
    
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file || !selectedLastUpdateId || !selectedCountry || !selectedBusinessUnitId) {
      setError('Please select a financial cycle, country, business unit, and file before uploading');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lastUpdateId', selectedLastUpdateId);
    formData.append('country', selectedCountry);
    formData.append('businessUnitId', selectedBusinessUnitId);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 30;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);
      
      const response = await fetch('/api/admin/media-sufficiency/upload', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      // Notify parent of successful upload
      onUploadComplete(data.sessionId);
      
      // If validation summary is included, notify parent
      if (data.validationSummary) {
        onValidationComplete(data.sessionId, data.validationSummary);
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Financial Cycle Selection */}
      <ModernDropdown
        label="Financial Cycle"
        options={lastUpdates.map(update => ({
          value: update.id.toString(),
          label: update.name
        }))}
        value={selectedLastUpdateId}
        onChange={setSelectedLastUpdateId}
        placeholder="Choose a financial cycle..."
        loading={isLoadingLastUpdates}
        searchable={true}
      />

      {/* Country Selection */}
      <ModernDropdown
        label="Country"
        options={countries.map(country => ({
          value: country,
          label: country
        }))}
        value={selectedCountry}
        onChange={setSelectedCountry}
        placeholder="Choose a country..."
        loading={isLoadingCountries}
        searchable={true}
      />

      {/* Business Unit Selection */}
      <ModernDropdown
        label="Business Unit"
        options={businessUnits.map(bu => ({
          value: bu.id.toString(),
          label: bu.name
        }))}
        value={selectedBusinessUnitId}
        onChange={setSelectedBusinessUnitId}
        placeholder="Choose a business unit..."
        loading={isLoadingBusinessUnits}
        searchable={true}
      />

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        
        {!file ? (
          <div>
            <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
              >
                Upload a file
              </button>
              {' '}or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">CSV files up to 25MB</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center">
              <FiFile className="h-8 w-8 text-green-500 mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Choose a different file
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Uploading...</span>
            <span className="text-sm text-blue-700">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && selectedLastUpdateId && selectedCountry && selectedBusinessUnitId && !isUploading && (
        <button
          onClick={handleUpload}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiUpload className="h-4 w-4 mr-2" />
          Start Upload
        </button>
      )}
    </div>
  );
}