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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastUpdates, setLastUpdates] = useState<LastUpdate[]>([]);
  const [selectedLastUpdateId, setSelectedLastUpdateId] = useState<string>('');
  const [isLoadingLastUpdates, setIsLoadingLastUpdates] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  
  // Fetch last updates when component mounts
  useEffect(() => {
    // Fetch last update cycles and countries on component mount
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
  
  // Diagnose browser environment for file dialog issues
  useEffect(() => {
    console.log('=== BROWSER ENVIRONMENT DIAGNOSTICS ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('Vendor:', navigator.vendor);
    console.log('Max touch points:', navigator.maxTouchPoints);
    console.log('Cookies enabled:', navigator.cookieEnabled);
    console.log('Online status:', navigator.onLine);
    
    // Check for permissions API support
    if (navigator.permissions) {
      console.log('Permissions API supported');
      try {
        navigator.permissions.query({ name: 'camera' as PermissionName })
          .then(result => {
            console.log('Camera permission status:', result.state);
          })
          .catch(err => {
            console.log('Error checking camera permission:', err);
          });
      } catch (err) {
        console.log('Error using permissions API:', err);
      }
    } else {
      console.log('Permissions API not supported');
    }
    
    // Check for file input support
    try {
      const isFileInputSupported = (() => {
        const input = document.createElement('input');
        input.type = 'file';
        return input.type === 'file';
      })();
      console.log('File input supported:', isFileInputSupported);
    } catch (err) {
      console.log('Error checking file input support:', err);
    }
    
    // Check for FileReader API support
    console.log('FileReader supported:', typeof FileReader !== 'undefined');
    
    // Check if running in a secure context (needed for some APIs)
    console.log('Secure context:', window.isSecureContext);
    
    // Check for session storage issues
    try {
      const testKey = '_test_storage_' + Date.now();
      sessionStorage.setItem(testKey, 'test');
      const testValue = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      console.log('Session storage working:', testValue === 'test');
    } catch (err) {
      console.log('Session storage error:', err);
    }
    
    // Check for available disk space (if Quota API is supported)
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        console.log('Storage quota:', estimate.quota, 'bytes');
        console.log('Storage usage:', estimate.usage, 'bytes');
        console.log('Storage available:', estimate.quota && estimate.usage ? 
          ((estimate.quota - estimate.usage) / (1024 * 1024)).toFixed(2) + ' MB' : 'unknown');
      }).catch(err => {
        console.log('Error checking storage quota:', err);
      });
    } else {
      console.log('Storage API not supported');
    }
    
    console.log('=== END DIAGNOSTICS ===');
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange called', { hasFiles: !!e.target.files, filesLength: e.target.files?.length });
    try {
      const selectedFile = e.target.files?.[0];
      console.log('Selected file:', selectedFile ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type } : 'No file selected');
      
      if (selectedFile) {
        validateAndSetFile(selectedFile);
      } else {
        console.warn('No file selected in change event');
      }
      
      // Reset the input value to allow selecting the same file again
      e.target.value = '';
      console.log('File input value reset');
    } catch (error) {
      console.error('Error in handleFileChange:', error);
      setError(`Error selecting file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('handleDragEnter called');
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    } catch (error) {
      console.error('Error in handleDragEnter:', error);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('handleDragLeave called');
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    } catch (error) {
      console.error('Error in handleDragLeave:', error);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Don't log this one as it fires continuously
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    } catch (error) {
      console.error('Error in handleDragOver:', error);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    console.log('handleDrop called');
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      console.log('Files dropped:', { filesCount: e.dataTransfer.files.length });
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile) {
        console.log('Dropped file:', { name: droppedFile.name, size: droppedFile.size, type: droppedFile.type });
        if (droppedFile.name.endsWith('.csv')) {
          validateAndSetFile(droppedFile);
        } else {
          console.warn('Invalid file type dropped:', droppedFile.type);
          setError('Please upload a CSV file');
        }
      } else {
        console.warn('No file found in drop event');
        setError('No file detected in drop. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleDrop:', error);
      setError(`Error processing dropped file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle last update selection change
  const handleLastUpdateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Last update dropdown changed:', e.target.value);
    setSelectedLastUpdateId(e.target.value);
  };

  // Handle country selection change
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Country dropdown changed:', e.target.value);
    setSelectedCountry(e.target.value);
  };

  // Validate file type and size
  const validateAndSetFile = (file: File) => {
    console.log('validateAndSetFile called', { fileName: file.name, fileSize: file.size, fileType: file.type });
    try {
      // Reset previous errors
      setError(null);
      
      // Check file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        console.warn('Invalid file type:', file.type);
        setError('Please upload a CSV file');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.warn('File size too large:', file.size);
        setError('File size exceeds 10MB limit');
        return;
      }
      
      console.log('File validation passed, setting file');
      // Set the file
      setFile(file);
    } catch (error) {
      console.error('Error in validateAndSetFile:', error);
      setError(`Error validating file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    console.log('handleUpload called', { file: !!file, selectedLastUpdateId, selectedCountry });
    if (!file || !selectedLastUpdateId || !selectedCountry) {
      console.error('Missing required fields for upload', { file: !!file, selectedLastUpdateId, selectedCountry });
      return;
    }
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    setError('');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lastUpdateId', selectedLastUpdateId.toString());
    formData.append('country', selectedCountry);
    console.log('Form data created', { fileName: file.name, fileSize: file.size, lastUpdateId: selectedLastUpdateId, country: selectedCountry });
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + (Math.random() * 5);
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Set timeout for request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('Upload request timed out after 30 seconds');
        controller.abort();
      }, 30000); // 30 seconds timeout
      
      console.log('Sending upload request to /api/admin/media-sufficiency/upload');
      // Send request
      const response = await fetch('/api/admin/media-sufficiency/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      
      console.log('Upload response received', { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed with error', errorData);
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const data = await response.json();
      console.log('Upload successful', data);
      setUploadProgress(100);
      
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
    console.log('=== FILE DIALOG TRIGGER DIAGNOSTICS ===');
    console.log('triggerFileInput called', { fileInputRef: !!fileInputRef.current });
    
    // Check if any dropdown might be open
    const selectElements = document.querySelectorAll('select');
    const activeElement = document.activeElement;
    console.log('Active element when triggering file input:', activeElement?.tagName, activeElement?.id);
    
    // Check if any select element has focus
    const hasSelectFocus = Array.from(selectElements).some(select => select === activeElement);
    console.log('Select element has focus:', hasSelectFocus);
    
    // Force blur on any focused elements to ensure they don't interfere
    if (activeElement && activeElement !== document.body) {
      try {
        (activeElement as HTMLElement).blur();
        console.log('Forced blur on active element');
      } catch (blurError) {
        console.error('Error blurring active element:', blurError);
      }
    }
    
    // Log memory usage to check for potential resource issues
    try {
      // Chrome-specific memory API
      if (window.performance && (window.performance as any).memory) {
        const memory = (window.performance as any).memory;
        console.log('Memory usage:', {
          jsHeapSizeLimit: (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2) + ' MB',
          totalJSHeapSize: (memory.totalJSHeapSize / (1024 * 1024)).toFixed(2) + ' MB',
          usedJSHeapSize: (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) + ' MB'
        });
      } else {
        console.log('Memory API not available in this browser');
      }
    } catch (memoryError) {
      console.log('Error accessing memory metrics:', memoryError);
    }
    
    // Check for iframe embedding which might affect file dialog
    try {
      const isInIframe = window !== window.parent;
      console.log('Running in iframe:', isInIframe);
      if (isInIframe) {
        console.warn('File dialogs may be blocked in iframes in some browsers');
      }
    } catch (frameError) {
      console.log('Error checking iframe status:', frameError);
    }
    
    // Create a test file input to check if click works outside our component
    try {
      const testInput = document.createElement('input');
      testInput.type = 'file';
      testInput.style.display = 'none';
      document.body.appendChild(testInput);
      
      console.log('Test file input created');
      
      // Set up event listeners to detect if the dialog opens
      const focusListener = () => console.log('Test input received focus event');
      const blurListener = () => console.log('Test input received blur event');
      const clickListener = () => console.log('Test input received click event');
      
      testInput.addEventListener('focus', focusListener);
      testInput.addEventListener('blur', blurListener);
      testInput.addEventListener('click', clickListener);
      
      // Try to trigger the test input first
      try {
        console.log('Attempting to click test file input');
        setTimeout(() => {
          try {
            document.body.removeChild(testInput);
            console.log('Test input removed');
          } catch (cleanupError) {
            console.error('Error removing test input:', cleanupError);
          }
        }, 1000); // Clean up after 1 second
      } catch (testError) {
        console.error('Error with test file input:', testError);
      }
    } catch (testSetupError) {
      console.error('Error setting up test file input:', testSetupError);
    }
    
    // Now try the actual file input
    try {
      if (fileInputRef.current) {
        console.log('Attempting to click actual file input');
        console.log('File input attributes:', {
          id: fileInputRef.current.id,
          name: fileInputRef.current.name,
          accept: fileInputRef.current.accept,
          multiple: fileInputRef.current.multiple,
          disabled: fileInputRef.current.disabled,
          parentElement: fileInputRef.current.parentElement ? fileInputRef.current.parentElement.tagName : 'none'
        });
        
        // Try to focus before clicking
        try {
          fileInputRef.current.focus();
          console.log('Focus called on file input');
        } catch (focusError) {
          console.error('Error focusing file input:', focusError);
        }
        
        // Attempt the click with a small delay
        setTimeout(() => {
          try {
            fileInputRef.current?.click();
            console.log('File input click called with delay');
            
            // Check if the click had any effect after a short delay
            setTimeout(() => {
              console.log('Post-click check: file input value:', fileInputRef.current?.value || 'empty');
            }, 500);
          } catch (delayedClickError) {
            console.error('Error in delayed click:', delayedClickError);
          }
        }, 100);
      } else {
        console.error('File input reference is null');
        
        // Try to create a new file input as fallback
        console.log('Attempting to create fallback file input');
        const fallbackInput = document.createElement('input');
        fallbackInput.type = 'file';
        fallbackInput.accept = '.csv';
        fallbackInput.style.display = 'none';
        fallbackInput.onchange = (e) => {
          console.log('Fallback input change event triggered');
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            validateAndSetFile(files[0]);
          }
          document.body.removeChild(fallbackInput);
        };
        
        document.body.appendChild(fallbackInput);
        try {
          fallbackInput.click();
          console.log('Fallback input click called');
        } catch (fallbackError) {
          console.error('Error with fallback input:', fallbackError);
          document.body.removeChild(fallbackInput);
        }
      }
    } catch (error) {
      console.error('Error triggering file input:', error);
      setError(`Failed to open file dialog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('=== END FILE DIALOG DIAGNOSTICS ===');
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
                      onClick={(e) => {
                        console.log('Financial cycle dropdown clicked');
                        e.stopPropagation(); // Prevent event bubbling
                      }}
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

                {/* Country Selection */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-slate-800 mb-3">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      disabled={isLoadingCountries}
                      onClick={(e) => {
                        console.log('Country dropdown clicked');
                        e.stopPropagation(); // Prevent event bubbling
                      }}
                      className="w-full px-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
                    >
                      <option value="">Choose a country...</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {isLoadingCountries && (
                    <div className="text-sm text-slate-500 mt-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Loading countries...
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
                        onClick={(e) => console.log('File input clicked', e)}
                        onError={(e) => console.error('File input error', e)}
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
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer" onClick={triggerFileInput}>
                            <FiUpload className={`w-8 h-8 text-blue-600 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />
                          </div>
                          
                          {/* Direct file path input as workaround for file dialog issues */}
                          <div className="mt-6 border-t border-gray-200 pt-6">
                            <p className="text-sm text-gray-600 mb-3 text-center">Having trouble with file dialog?</p>
                            <div className="flex flex-col space-y-2">
                              <input 
                                type="text" 
                                placeholder="Enter file path (e.g., /path/to/file.csv)" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  const path = e.target.value;
                                  console.log('Direct path input changed:', path);
                                  if (path && !path.toLowerCase().endsWith('.csv')) {
                                    setError('Please enter a path to a CSV file');
                                  } else {
                                    setError(null);
                                  }
                                }}
                              />
                              <button 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-300"
                                onClick={async () => {
                                  const filePathInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                                  const filePath = filePathInput?.value;
                                  console.log('Using direct file path:', filePath);
                                  
                                  if (!filePath) {
                                    setError('Please enter a file path');
                                    return;
                                  }
                                  
                                  if (!filePath.toLowerCase().endsWith('.csv')) {
                                    setError('Please enter a path to a CSV file');
                                    return;
                                  }
                                  
                                  if (!selectedLastUpdateId) {
                                    setError('Please select a financial cycle');
                                    return;
                                  }
                                  
                                  if (!selectedCountry) {
                                    setError('Please select a country');
                                    return;
                                  }
                                  
                                  try {
                                    setIsUploading(true);
                                    setUploadProgress(10);
                                    
                                    // Use the server-side file path upload API
                                    console.log('Sending direct path upload request to API');
                                    const response = await fetch('/api/admin/media-sufficiency/upload', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        filePath,
                                        lastUpdateId: selectedLastUpdateId,
                                        country: selectedCountry
                                      })
                                    });
                                    
                                    setUploadProgress(70);
                                    
                                    if (!response.ok) {
                                      const errorData = await response.json();
                                      throw new Error(errorData.error || 'Failed to upload file');
                                    }
                                    
                                    const data = await response.json();
                                    console.log('Server-side file upload successful:', data);
                                    
                                    setUploadProgress(100);
                                    setIsUploading(false);
                                    
                                    // Create a mock File object for UI display only
                                    const mockFile = new File(
                                      ['Server-side file access placeholder'],
                                      filePath.split('/').pop() || 'upload.csv',
                                      { type: 'text/csv' }
                                    );
                                    setFile(mockFile);
                                    
                                    // Redirect to validation page
                                    router.push(`/admin/media-sufficiency/validation/${data.sessionId}`);
                                  } catch (error) {
                                    console.error('Error with server-side file upload:', error);
                                    setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                    setIsUploading(false);
                                    setUploadProgress(0);
                                  }
                                }}
                              >
                                Use This File
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              Server-side implementation required for actual file access
                            </p>
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
                {file && selectedLastUpdateId && selectedCountry && uploadStatus !== 'uploading' && (
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