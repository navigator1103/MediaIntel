'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import Link from 'next/link';
import { FilterContext } from './UserNavigation';

interface Rule {
  id: number;
  platform: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
}

interface Score {
  id: number;
  ruleId: number;
  platform: string;
  countryId: number;
  brandId: number;
  score: number;
  trend: number;
  month: string;
  evaluation: string;
  rule: Rule;
  country: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
}

interface ChangeRequest {
  id: number;
  scoreId: number;
  userId?: number;
  requestedScore: number;
  comments: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  score: Score;
  user?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

const UserDashboard = () => {
  const [userScores, setUserScores] = useState<Score[]>([]);
  const [userChangeRequests, setUserChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Get filter state from context
  const { selectedBrand, selectedPlatform, selectedCountry, selectedMonth, setSelectedMonth } = useContext(FilterContext);
  
  // Convert string IDs from context to numbers for API calls
  const userBrandId = selectedBrand ? parseInt(selectedBrand) : null;
  const userCountryId = selectedCountry ? parseInt(selectedCountry) : null;

  // Create a data fetcher function that can be called whenever filters change
  const fetchUserDashboardData = async () => {
    console.log('Fetching data with filters:', { userCountryId, userBrandId, selectedPlatform, selectedMonth });
    
    try {
      // Set main loading state
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Extract year and month from selectedMonth
      const formattedMonth = selectedMonth;
      
      // Build common filter parameters for both API calls
      const filterParams = new URLSearchParams();
      filterParams.append('month', formattedMonth);
      if (userCountryId) filterParams.append('countryId', userCountryId.toString());
      if (userBrandId) filterParams.append('brandId', userBrandId.toString());
      if (selectedPlatform) filterParams.append('platform', selectedPlatform);
      
      // Add a small limit to change requests to improve performance
      const changeRequestParams = new URLSearchParams(filterParams);
      changeRequestParams.append('limit', '50'); // Limit to the most recent 50 change requests
      
      // Attempt to fetch data with retries
      let retryCount = 0;
      const maxRetries = 2;
      let scoresData: Score[] = [];
      let changeRequestsData: ChangeRequest[] = [];
      let fetchSuccess = false;
      
      while (retryCount <= maxRetries && !fetchSuccess) {
        try {
          if (retryCount > 0) {
            console.log(`Retry attempt ${retryCount} of ${maxRetries}`);
          }
          
          // Prepare both API calls to run in parallel
          const scoresPromise = fetchScores(filterParams.toString());
          const requestsPromise = fetchChangeRequests(changeRequestParams.toString());
          
          // Run both API calls in parallel with Promise.allSettled to handle partial failures
          const [scoresResult, requestsResult] = await Promise.allSettled([scoresPromise, requestsPromise]);
          
          // Handle scores result
          if (scoresResult.status === 'fulfilled') {
            scoresData = scoresResult.value;
            if (scoresData.length === 0) {
              console.log('No scores data returned');
            }
          } else {
            console.error('Scores promise rejected:', scoresResult.reason);
            throw new Error('Failed to fetch scores');
          }
          
          // Handle change requests result
          if (requestsResult.status === 'fulfilled') {
            changeRequestsData = requestsResult.value;
          } else {
            console.error('Change requests promise rejected:', requestsResult.reason);
            throw new Error('Failed to fetch change requests');
          }
          
          // If we got here, both fetches succeeded
          fetchSuccess = true;
          
        } catch (fetchErr) {
          console.error(`Fetch attempt ${retryCount + 1} failed:`, fetchErr);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }
      
      // Update state based on fetch results
      if (fetchSuccess) {
        setUserScores(scoresData);
        setUserChangeRequests(changeRequestsData);
        setError(null);
      } else {
        // All retries failed, show error and use empty data
        console.error('All fetch attempts failed');
        setUserScores([]);
        setUserChangeRequests([]);
        setError('Failed to load dashboard data after multiple attempts. Please try again later.');
      }
    } catch (err) {
      console.error('Error in fetchUserDashboardData:', err);
      setUserScores([]);
      setUserChangeRequests([]);
      setError('Error fetching user dashboard data. Please try again.');
    } finally {
      // Set main loading state to false when both operations are complete
      setLoading(false);
    }
  };
  
  // Helper function to fetch scores
  const fetchScores = async (queryParams: string): Promise<Score[]> => {
    setScoresLoading(true);
    try {
      const timestamp = new Date().getTime();
      const scoresUrl = `/api/scores?${queryParams}&_=${timestamp}`;
      console.log(`Fetching scores with URL: ${scoresUrl}`);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const scoresResponse = await fetch(scoresUrl, {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal,
          cache: 'no-store' // Next.js way to prevent caching
        });
        
        clearTimeout(timeoutId); // Clear the timeout
        
        if (scoresResponse.ok) {
          const data = await scoresResponse.json();
          console.log('Received scores data:', data.length, 'items');
          return data;
        } else {
          console.error('Failed to fetch scores:', scoresResponse.status, scoresResponse.statusText);
          setError(`Failed to fetch scores: ${scoresResponse.statusText}`);
          return [];
        }
      } catch (fetchErr) {
        // This inner try-catch is specifically for the fetch operation
        clearTimeout(timeoutId);
        throw fetchErr; // Re-throw to be caught by the outer catch
      }
    } catch (scoreErr: any) {
      // Check for abort error (timeout)
      if (scoreErr.name === 'AbortError') {
        console.error('Fetch scores request timed out');
        setError('Request timed out. Please try again.');
      } else {
        console.error('Error fetching scores:', scoreErr);
        setError('Error fetching scores. Please try again.');
      }
      return [];
    } finally {
      setScoresLoading(false);
    }
  };
  
  // Helper function to fetch change requests
  const fetchChangeRequests = async (queryParams: string): Promise<ChangeRequest[]> => {
    setRequestsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const requestsUrl = `/api/change-requests?${queryParams}&_=${timestamp}`;
      console.log(`Fetching change requests with URL: ${requestsUrl}`);
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const changeRequestsResponse = await fetch(requestsUrl, {
          method: 'GET',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal,
          cache: 'no-store' // Next.js way to prevent caching
        });
        
        clearTimeout(timeoutId); // Clear the timeout
        
        if (changeRequestsResponse.ok) {
          const data = await changeRequestsResponse.json();
          console.log('Received change requests data:', data.length, 'items');
          
          // Ensure all change requests have the expected structure
          const normalizedData = data.map((request: any) => ({
            ...request,
            // Ensure user property exists even if null
            user: request.user || null,
            // Ensure updatedAt exists
            updatedAt: request.updatedAt || request.createdAt
          }));
          
          return normalizedData;
        } else {
          const errorText = await changeRequestsResponse.text();
          console.error('Failed to fetch change requests:', changeRequestsResponse.status, changeRequestsResponse.statusText, errorText);
          return [];
        }
      } catch (fetchErr) {
        // This inner try-catch is specifically for the fetch operation
        clearTimeout(timeoutId);
        throw fetchErr; // Re-throw to be caught by the outer catch
      }
    } catch (requestErr: any) {
      // Check for abort error (timeout)
      if (requestErr.name === 'AbortError') {
        console.error('Fetch change requests timed out');
      } else {
        console.error('Error fetching change requests:', requestErr);
      }
      return [];
    } finally {
      setRequestsLoading(false);
    }
  };
  
  // Use effect to fetch data when filters change or on initial load
  useEffect(() => {
    console.log('Fetching data due to filter change or initial load');
    
    // Set a flag to track if the component is still mounted
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await fetchUserDashboardData();
      } catch (err) {
        console.error('Error in fetchUserDashboardData effect:', err);
        if (isMounted) {
          setError('Failed to load dashboard data. Please refresh the page.');
          setLoading(false);
        }
      }
    };
    
    // Start loading data
    loadData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
    
    // We're including all dependencies to ensure this runs when any filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCountryId, userBrandId, selectedPlatform, selectedMonth]);
  
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'meta':
        return 'bg-blue-100 text-blue-800';
      case 'google ads':
        return 'bg-green-100 text-green-800';
      case 'tiktok':
        return 'bg-purple-100 text-purple-800';
      case 'dv360':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get platform background color for chart bars
  const getPlatformBgColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'meta':
        return 'bg-blue-500';
      case 'google ads':
        return 'bg-green-500';
      case 'tiktok':
        return 'bg-purple-500';
      case 'dv360':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted for Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return (
        <span className="text-green-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
          </svg>
          {trend}
        </span>
      );
    } else if (trend < 0) {
      return (
        <span className="text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          {Math.abs(trend)}
        </span>
      );
    } else {
      return (
        <span className="text-gray-600">0</span>
      );
    }
  };
  
  // Show a loading overlay instead of replacing the entire content
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white bg-opacity-70 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-indigo-700 font-medium">Loading data for {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}...</p>
      </div>
    </div>
  );
  
  // Initial loading state (before any data is fetched)
  if (loading && userScores.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  // Group scores by platform for the platform summary
  const scoresByPlatform = userScores.reduce((acc, score) => {
    if (!acc[score.platform]) {
      acc[score.platform] = [];
    }
    acc[score.platform].push(score);
    return acc;
  }, {} as Record<string, Score[]>);
  
  // Group scores by category for the category-based display
  const scoresByCategory = userScores.reduce((acc, score) => {
    const category = score.rule.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(score);
    return acc;
  }, {} as Record<string, Score[]>);
  
  // Calculate average score by platform
  const platformAverages = Object.entries(scoresByPlatform).map(([platform, scores]) => {
    const total = scores.reduce((sum, score) => sum + score.score, 0);
    const average = total / scores.length;
    return { platform, average };
  }).sort((a, b) => a.platform.localeCompare(b.platform)); // Sort by platform name for consistent display
  
  // Log platform averages for debugging
  console.log('Platform Averages:', platformAverages);
  
  // Component for secondary loading indicator
  const SecondaryLoadingIndicator = ({ message }: { message: string }) => (
    <div className="fixed top-4 right-4 bg-white shadow-md rounded-md p-3 z-50 flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-700">{message}</span>
    </div>
  );
  
  return (
    <div className="space-y-6 px-6 py-4 pt-16 relative">
      {/* Main loading indicator */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
          <div className="h-full bg-blue-600 animate-loading-bar"></div>
        </div>
      )}
      
      {/* Secondary loading indicators */}
      {scoresLoading && !loading && <SecondaryLoadingIndicator message="Loading scores..." />}
      {requestsLoading && !loading && <SecondaryLoadingIndicator message="Loading requests..." />}
      
      {loading && userScores.length > 0 && <LoadingOverlay />}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Welcome to Your MediaIQ Dashboard</h2>
            <p className="text-gray-600 mt-1">
              This dashboard shows your performance across digital marketing platforms. 
              You can view your scores, track your progress, and submit change requests.
            </p>
          </div>
          <div className="relative">
            <div 
              className="bg-indigo-50 p-3 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors duration-200 flex items-center space-x-2"
              onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
              title="Click to change month"
            >
              <div>
                <div className="text-sm text-gray-500">Selected Period</div>
                <div className="text-lg font-semibold text-indigo-700">
                  {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <svg 
                className={`w-5 h-5 text-indigo-600 transition-transform duration-200 ${isMonthSelectorOpen ? 'transform rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            
            {isMonthSelectorOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-10 border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-200 bg-indigo-50">
                  <h3 className="text-sm font-medium text-gray-700">Select Month & Year</h3>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {/* 2025 Months */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-500 mb-1 px-2">2025</div>
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthValue = `2025-${String(i + 1).padStart(2, '0')}`;
                        const isSelected = selectedMonth === monthValue;
                        const monthName = new Date(`2025-${i + 1}-01`).toLocaleString('default', { month: 'short' });
                        return (
                          <button
                            key={monthValue}
                            className={`py-2 px-2 text-sm rounded-md transition-colors duration-150 ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-100 text-gray-700'}`}
                            onClick={() => {
                              if (selectedMonth !== monthValue) {
                                setLoading(true); // Show loading indicator
                                setSelectedMonth(monthValue);
                              }
                              setIsMonthSelectorOpen(false);
                            }}
                          >
                            {monthName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 2024 Months */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1 px-2">2024</div>
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthValue = `2024-${String(i + 1).padStart(2, '0')}`;
                        const isSelected = selectedMonth === monthValue;
                        const monthName = new Date(`2024-${i + 1}-01`).toLocaleString('default', { month: 'short' });
                        return (
                          <button
                            key={monthValue}
                            className={`py-2 px-2 text-sm rounded-md transition-colors duration-150 ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-100 text-gray-700'}`}
                            onClick={() => {
                              if (selectedMonth !== monthValue) {
                                setLoading(true); // Show loading indicator
                                setSelectedMonth(monthValue);
                              }
                              setIsMonthSelectorOpen(false);
                            }}
                          >
                            {monthName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="p-2 border-t border-gray-200 flex justify-end bg-gray-50">
                  <button 
                    className="text-xs text-gray-600 hover:text-indigo-600 transition-colors duration-150"
                    onClick={() => setIsMonthSelectorOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-md">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-gray-500">Average Score</div>
                <div className="text-xl font-semibold text-gray-800">
                  {userScores.length > 0 
                    ? (userScores.reduce((sum, score) => sum + score.score, 0) / userScores.length).toFixed(1) 
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-gray-500">Good Scores</div>
                <div className="text-xl font-semibold text-gray-800">
                  {userScores.filter(score => score.score >= 80).length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-md">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm text-gray-500">Needs Attention</div>
                <div className="text-xl font-semibold text-gray-800">
                  {userScores.filter(score => score.score < 60).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      


      {/* Platform Summary */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Platform Performance</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {platformAverages.map(({ platform, average }) => (
            <div key={platform} className="border rounded-lg p-4">
              <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPlatformColor(platform)} mb-2`}>
                {platform}
              </div>
              <div className="flex items-end">
                <span className={`text-3xl font-bold ${getScoreColor(average)}`}>
                  {average.toFixed(1)}
                </span>
                <span className="text-gray-500 ml-1 mb-1">/100</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Based on {scoresByPlatform[platform].length} rules
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Your Scores */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Your Scores</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select 
              className="border border-gray-300 rounded px-2 py-1 text-sm" 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        <div className="space-y-8">
          {/* Define the actual categories from the data */}
          {Object.keys(scoresByCategory).map(category => {
            const categoryScores = scoresByCategory[category] || [];
            if (categoryScores.length === 0) return null;
            
            // Calculate how many scores to show based on pagination
            const totalScores = Object.values(scoresByCategory).flat().length;
            const categoryProportion = categoryScores.length / totalScores;
            const scoresToShow = Math.max(1, Math.ceil(categoryProportion * itemsPerPage));
            
            // Log the category and scores for debugging
            console.log(`Rendering category: ${category} with ${categoryScores.length} scores`);
            
            return (
              <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
                <h2 className="text-lg font-semibold p-4 bg-gray-50 border-b flex items-center">
                  {/* Icon based on category */}
                  {category === 'Audience' && (
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  )}
                  {category === 'Campaign Settings' && (
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  )}
                  {category === 'Measurement' && (
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  )}
                  {category === 'Bidding' && (
                    <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                  {category === 'Creative' && (
                    <svg className="w-5 h-5 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  )}
                  {/* Default icon for other categories */}
                  {!['Audience', 'Campaign Settings', 'Measurement', 'Bidding', 'Creative'].includes(category) && (
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                  {category}
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule #</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoryScores.length > 0 ? (
                        // Show scores for this category
                        categoryScores
                          .slice(0, scoresToShow)
                          .map((score) => (
                          <tr key={score.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">#{score.ruleId}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{score.rule.title}</div>
                              {/* Only show description if it's different from the title */}
                              {score.rule.description !== score.rule.title && (
                                <div className="text-sm text-gray-500 mt-1">{score.rule.description}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlatformColor(score.platform)}`}>
                                {score.platform}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{score.brand.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{score.country.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${getScoreColor(score.score)}`}>{score.score}/100</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">{getTrendIcon(score.trend)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {userChangeRequests.some(req => req.scoreId === score.id && req.status === 'Submitted for Review') ? (
                                <span className="text-amber-600 font-medium">Submitted for Review</span>
                              ) : (
                                <Link href={`/change-requests/new?scoreId=${score.id}`} className="text-indigo-600 hover:text-indigo-900">Request Change</Link>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                            No scores found for this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          
          {userScores.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No scores found for your country and brand.
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {userScores.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{Math.min(userScores.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
              <span className="font-medium">{Math.min(userScores.length, currentPage * itemsPerPage)}</span> of{' '}
              <span className="font-medium">{userScores.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              >
                Previous
              </button>
              
              {/* Page number buttons */}
              {Array.from({ length: Math.ceil(userScores.length / itemsPerPage) }, (_, i) => i + 1)
                // Show only a limited number of page buttons
                .filter(page => {
                  const totalPages = Math.ceil(userScores.length / itemsPerPage);
                  // Always show first, last, current, and pages immediately adjacent to current
                  return (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1) ||
                    (currentPage <= 3 && page <= 5) ||
                    (currentPage >= totalPages - 2 && page >= totalPages - 4)
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis when there are gaps in the sequence
                  const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                  
                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsisBefore && <span className="px-2">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(userScores.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(userScores.length / itemsPerPage)}
                className={`px-3 py-1 rounded ${currentPage >= Math.ceil(userScores.length / itemsPerPage) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      

    </div>
  );
};

export default UserDashboard;
