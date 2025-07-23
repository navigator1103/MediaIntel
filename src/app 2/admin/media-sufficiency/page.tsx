'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiFile, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function MediaSufficiencyAdmin() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  
  // Handle drag events
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };
  
  // Validate file type and set file
  const validateAndSetFile = (file: File) => {
    // Check if file is CSV
    if (file.name.endsWith('.csv')) {
      setFile(file);
      setUploadedFileName(file.name);
      setUploadStatus('idle');
      setErrorMessage('');
    } else {
      setFile(null);
      setUploadStatus('error');
      setErrorMessage('Please upload a CSV file');
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file) return;
    
    setUploadStatus('uploading');
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Send file to API
      const response = await fetch('/api/admin/media-sufficiency/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const data = await response.json();
      
      if (data.success && data.sessionId) {
        setUploadStatus('success');
        
        // Show success message briefly before redirecting
        setTimeout(() => {
          router.push(`/admin/media-sufficiency/validate?sessionId=${data.sessionId}`);
        }, 1000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-quicksand text-gray-800">Media Sufficiency Data Import</h1>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-quicksand"
        >
          Back to Dashboard
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Step 1: Upload Sufficiency Data</h2>
        <p className="text-gray-600 mb-6">
          Upload your Media Sufficiency CSV file. The system will validate the data and guide you through the import process.
        </p>
        
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">
            Drag and drop your CSV file here, or{' '}
            <label className="text-indigo-600 hover:text-indigo-800 cursor-pointer">
              browse
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
              />
            </label>
          </p>
          <p className="text-xs text-gray-500 mt-1">Only CSV files are supported</p>
        </div>
        
        {/* File Preview */}
        {file && (
          <div className="bg-gray-50 rounded-lg p-4 flex items-center mb-6">
            <FiFile className="h-6 w-6 text-indigo-500 mr-3" />
            <div className="flex-1">
              <p className="font-medium text-gray-700">{uploadedFileName}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={() => setFile(null)}
            >
              Remove
            </button>
          </div>
        )}
        
        {/* Upload Status */}
        {uploadStatus === 'error' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
            <FiAlertTriangle className="h-5 w-5 mr-2" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-center">
            <FiCheckCircle className="h-5 w-5 mr-2" />
            <span>File uploaded successfully! Proceeding to validation...</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end">
          <button
            className={`px-6 py-2 rounded-md font-quicksand ${
              file && uploadStatus !== 'uploading'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-colors`}
            disabled={!file || uploadStatus === 'uploading'}
            onClick={handleUpload}
          >
            {uploadStatus === 'uploading' ? (
              <>
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                Uploading...
              </>
            ) : (
              'Upload & Continue'
            )}
          </button>
        </div>
      </div>
      
      {/* Import Steps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Import Process</h2>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1 p-4 border-l-4 border-indigo-600 bg-indigo-50 mb-4 md:mb-0 md:mr-4">
            <h3 className="font-medium text-indigo-800">Step 1: Upload</h3>
            <p className="text-sm text-gray-600">Upload your CSV file with media sufficiency data</p>
          </div>
          <div className="flex-1 p-4 border-l-4 border-gray-300 bg-gray-50 mb-4 md:mb-0 md:mr-4">
            <h3 className="font-medium text-gray-600">Step 2: Validate</h3>
            <p className="text-sm text-gray-600">System validates data and checks for issues</p>
          </div>
          <div className="flex-1 p-4 border-l-4 border-gray-300 bg-gray-50 mb-4 md:mb-0 md:mr-4">
            <h3 className="font-medium text-gray-600">Step 3: Review</h3>
            <p className="text-sm text-gray-600">Review and edit data before import</p>
          </div>
          <div className="flex-1 p-4 border-l-4 border-gray-300 bg-gray-50">
            <h3 className="font-medium text-gray-600">Step 4: Import</h3>
            <p className="text-sm text-gray-600">Confirm and import data into the system</p>
          </div>
        </div>
      </div>
    </div>
  );
}
