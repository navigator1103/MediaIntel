'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiFile, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

export default function EnhancedUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
    
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };
  
  // Validate file type and size
  const validateAndSetFile = (file: File) => {
    // Reset previous errors
    setError(null);
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    // Set the file
    setFile(file);
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      setError(null); // Clear any previous errors
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preprocessValidation', 'true'); // Tell the API to validate during upload
      
      // Simulate progress updates for upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Send the file to the simple upload endpoint first with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response: Response;
      try {
        response = await fetch('/api/admin/media-sufficiency/upload', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Upload timed out after 30 seconds. Please try with a smaller file.');
        }
        throw fetchError;
      }
      
      // Clear progress interval
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      // Set upload progress to 100%
      setUploadProgress(100);
      
      // Process the response data
      const data = await response.json();
      
      // Check if upload was successful
      if (!data.success || !data.sessionId) {
        throw new Error(data.error || 'Upload failed - no session ID returned');
      }
      
      // Store session ID
      setSessionId(data.sessionId);
      
      // Upload complete - redirect to validation page
      router.push(`/admin/media-sufficiency/enhanced-validate?sessionId=${data.sessionId}`);
      
    } catch (error) {
      setUploadStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };
  
  // No longer needed as we redirect automatically after upload
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Import Media Sufficiency Data</h1>
        <Link
          href="/admin"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Enhanced Data Import</h2>
        <p className="text-gray-600 mb-6">
          Upload your CSV file containing media sufficiency data. Our enhanced import process will:
        </p>
        
        <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
          <li>Automatically map your CSV columns to the expected fields</li>
          <li>Validate your data with smart suggestions for corrections</li>
          <li>Allow you to preview and edit data before importing</li>
          <li>Provide batch resolution tools for common issues</li>
        </ul>
        
        {uploadStatus === 'idle' && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
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
            
            {file ? (
              <div className="flex flex-col items-center">
                <FiFile className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium text-gray-700">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB • CSV
                </p>
              </div>
            ) : (
              <label className="flex flex-col items-center cursor-pointer w-full h-full">
                <FiUpload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700">
                  {isDragging ? 'Drop your file here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-sm text-gray-500 mt-2">or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-start">
            <FiAlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>
      
      {/* Upload Progress UI */}
      {uploadStatus === 'uploading' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Uploading and Processing File...</h3>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading and preprocessing data</span>
              <span className="text-sm font-medium text-gray-700">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we upload and preprocess your data. You'll be redirected to the data preview page automatically.
            </p>
          </div>
        </div>
      )}
      
      {/* File Selection Button */}
      {!file && (
        <div className="flex justify-center mb-8">
          <label className="px-6 py-3 bg-[#115f9a] text-white rounded-md hover:bg-[#1984c5] transition-colors flex items-center gap-2 cursor-pointer">
            <FiFile className="text-lg" />
            Select CSV File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Upload Button */}
      {file && uploadStatus !== 'uploading' && (
        <div className="flex justify-center mb-8">
          <button
            onClick={handleUpload}
            className="px-6 py-3 bg-[#115f9a] text-white rounded-md hover:bg-[#1984c5] transition-colors flex items-center gap-2"
            disabled={uploadStatus === 'uploading'}
          >
            <FiUpload className="text-lg" />
            Upload CSV File
          </button>
        </div>
      )}
      
      {/* CSV Template Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-3">CSV Template Guidelines</h3>
        <p className="text-blue-700 mb-4">
          Your CSV file should include the following fields for optimal import:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Required Fields:</h4>
            <ul className="list-disc pl-6 text-blue-700 space-y-1">
              <li>Year</li>
              <li>Country</li>
              <li>Category</li>
              <li>Range</li>
              <li>Campaign</li>
              <li>Media</li>
              <li>Media Subtype</li>
              <li>Start Date</li>
              <li>End Date</li>
              <li>Budget</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Optional Fields:</h4>
            <ul className="list-disc pl-6 text-blue-700 space-y-1">
              <li>Sub Region</li>
              <li>Q1 Budget</li>
              <li>Q2 Budget</li>
              <li>Q3 Budget</li>
              <li>Q4 Budget</li>
              <li>Target Reach</li>
              <li>Current Reach</li>
              <li>Business Unit</li>
              <li>PM Type</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4">
          <a
            href="/templates/media-sufficiency-template.csv"
            download
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <FiFile className="mr-2" />
            Download CSV Template
          </a>
        </div>
      </div>
    </div>
  );
}
