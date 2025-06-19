'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiFile, FiAlertCircle, FiDownload, FiCheckCircle, FiArrowLeft, FiBarChart2, FiTarget, FiTrendingUp, FiLayers } from 'react-icons/fi';
import Link from 'next/link';

interface LastUpdate {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function EnhancedUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastUpdates, setLastUpdates] = useState<LastUpdate[]>([]);
  const [selectedLastUpdateId, setSelectedLastUpdateId] = useState<string>('');
  const [isLoadingLastUpdates, setIsLoadingLastUpdates] = useState(false);
  
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
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a CSV file');
    }
  };
  
  // Handle last update selection change
  const handleLastUpdateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLastUpdateId(e.target.value);
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
    
    if (!selectedLastUpdateId) {
      setError('Please select a Financial Cycle');
      return;
    }
    
    try {
      setUploadStatus('uploading');
      setError(null);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lastUpdateId', selectedLastUpdateId);
      formData.append('preprocessValidation', 'true');
      
      // Simulate progress updates for upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Send the file to the simple upload endpoint first with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
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
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-slate-300"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Media Sufficiency Import
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <FiBarChart2 className="w-4 h-4" />
              <span>Enhanced Upload</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <FiTrendingUp className="w-4 h-4" />
            <span>Smart Data Import</span>
          </div>
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Import Your Media Data
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Upload CSV files with intelligent validation, automatic mapping, and real-time error detection
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: FiTarget, title: "Smart Mapping", desc: "Auto-detect CSV columns" },
            { icon: FiCheckCircle, title: "Validation", desc: "Real-time data validation" },
            { icon: FiLayers, title: "Preview", desc: "Edit before importing" },
            { icon: FiBarChart2, title: "Analytics", desc: "Data insights & reporting" }
          ].map((feature, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-300">
              <feature.icon className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-8">
                {/* Financial Cycle Selection */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-slate-800 mb-3">
                    Financial Cycle
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLastUpdateId}
                      onChange={handleLastUpdateChange}
                      disabled={isLoadingLastUpdates}
                      className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                    >
                      <option value="">Choose a financial cycle...</option>
                      {lastUpdates.map((update) => (
                        <option key={update.id} value={update.id.toString()}>
                          {update.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {isLoadingLastUpdates && (
                    <div className="text-sm text-slate-500 mt-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading options...
                    </div>
                  )}
                </div>

                {/* File Upload Area */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-slate-800 mb-3">
                    Upload CSV File
                  </label>
                  
                  {uploadStatus === 'idle' && (
                    <div
                      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                        isDragging
                          ? 'border-blue-400 bg-blue-50/50 scale-105'
                          : file
                          ? 'border-green-400 bg-green-50/50'
                          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
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
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <FiCheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-800">{file.name}</p>
                            <p className="text-slate-600">{formatFileSize(file.size)} • CSV File</p>
                          </div>
                          <button
                            onClick={triggerFileInput}
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                          >
                            Choose different file
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4" onClick={triggerFileInput}>
                          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer">
                            <FiUpload className={`w-8 h-8 text-blue-600 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />
                          </div>
                          <div className="cursor-pointer">
                            <p className="text-lg font-semibold text-slate-800">
                              {isDragging ? 'Drop your file here' : 'Drag & drop your CSV file'}
                            </p>
                            <p className="text-slate-600 mt-2">or click to browse files</p>
                          </div>
                          <div className="text-sm text-slate-500">
                            Supports CSV files up to 10MB
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploadStatus === 'uploading' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="text-lg font-semibold text-blue-800">Uploading your file...</span>
                        </div>
                        <span className="text-blue-700 font-bold">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {file && selectedLastUpdateId && uploadStatus !== 'uploading' && (
                  <button
                    onClick={handleUpload}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={uploadStatus !== 'idle'}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <FiUpload className="w-5 h-5" />
                      <span>Start Import Process</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Template & Guidelines */}
          <div className="space-y-6">
            {/* CSV Template */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <FiDownload className="w-5 h-5 mr-2 text-blue-600" />
                CSV Template
              </h3>
              <p className="text-slate-600 mb-4">
                Download our template to ensure your data is formatted correctly.
              </p>
              <a
                href="/templates/media-sufficiency-template.csv"
                download
                className="inline-flex items-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <FiDownload className="w-4 h-4" />
                <span>Download Template</span>
              </a>
            </div>

            {/* Required Fields */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Required Fields</h3>
              <div className="space-y-2">
                {['Year', 'Country', 'Category', 'Range', 'Campaign', 'Media', 'Media Subtype', 'Start Date', 'End Date', 'Budget'].map((field) => (
                  <div key={field} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-slate-700">{field}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Optional Fields</h3>
              <div className="space-y-2">
                {['Sub Region', 'Q1-Q4 Budget', 'Target Reach', 'Current Reach', 'Business Unit', 'PM Type'].map((field) => (
                  <div key={field} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <span className="text-slate-600">{field}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}