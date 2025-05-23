'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import { Spinner } from '@/components/ui/spinner';
import axios from 'axios';

// Color palette for charts
const COLORS = ['#1F4388', '#2A5CAA', '#3E7DCD', '#5E9FE0', '#7FBCE6', '#A0D8EC', '#C1E4F0', '#E2F0F6'];

// Interface for Game Plan data
interface GamePlanData {
  budgetByMediaType: Record<string, number>;
  budgetByCountry: Record<string, number>;
  budgetByCategory: Record<string, number>;
  budgetByCategoryPercentage: Record<string, number>;
  budgetByQuarter: {
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
  };
  campaignsByPMType: Record<string, number>;
  summary: {
    totalBudget: number;
    campaignCount: number;
    mediaTypeCount: number;
    countryCount: number;
    gamePlanCount: number;
    lastUpdate?: string;
  };
}

// Interface for Game Plan
interface GamePlan {
  id: number;
  campaignId: number;
  campaign?: {
    id: number;
    name: string;
  };
  mediaSubTypeId: number;
  mediaSubType?: {
    id: number;
    name: string;
    mediaType?: {
      id: number;
      name: string;
    };
  };
  countryId: number;
  country?: {
    id: number;
    name: string;
  };
  pmTypeId?: number;
  pmType?: {
    id: number;
    name: string;
  };
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
  last_update_id?: number;
  lastUpdate?: {
    id: number;
    name: string;
  };
  totalBudget: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
}

export default function MediaSufficiencyDashboard() {
  // State for data
  const [gamePlanData, setGamePlanData] = useState<GamePlanData | null>(null);
  const [gamePlans, setGamePlans] = useState<GamePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPMTypes, setSelectedPMTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLastUpdates, setSelectedLastUpdates] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 1000000]);
  const [lastUpdateDate, setLastUpdateDate] = useState<string>('');
  
  // State for sidebar
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  // State for filtered data
  const [filteredData, setFilteredData] = useState<GamePlanData | null>(null);
  
  // State for campaign distribution data
  const [campaignDistributionData, setCampaignDistributionData] = useState<Array<{name: string; value: number; color: string}>>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // State for available update options
  const [availableUpdateOptions, setAvailableUpdateOptions] = useState<Array<{id: number, name: string}>>([]);
  
  // State for country budget by quarter table
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  
  // Toggle country expansion
  const toggleCountryExpansion = (country: string) => {
    setExpandedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country) 
        : [...prev, country]
    );
  };
  
  // Refs for charts
  const campaignChartRef = useRef<HTMLDivElement>(null);
  const mediaTypeChartRef = useRef<HTMLDivElement>(null);
  const countryChartRef = useRef<HTMLDivElement>(null);
  
  // Fetch Game Plan data
  useEffect(() => {
    const fetchGamePlanData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch aggregated dashboard data
        const dashboardResponse = await axios.get('/api/dashboard/media-similarity');
        
        // Add lastUpdate field if not present
        if (dashboardResponse.data && dashboardResponse.data.summary && !dashboardResponse.data.summary.lastUpdate) {
          dashboardResponse.data.summary.lastUpdate = new Date().toISOString();
        }
        
        setGamePlanData(dashboardResponse.data);
        setFilteredData(dashboardResponse.data); // Initialize filtered data with all data
        
        try {
          // Fetch raw game plans data for the Campaign by Quarter table
          const gamePlansResponse = await axios.get('/api/admin/media-sufficiency/game-plans');
          setGamePlans(gamePlansResponse.data || []);
        } catch (gamePlansError) {
          console.error('Error fetching game plans:', gamePlansError);
          // Continue with the dashboard even if game plans fetch fails
          // This ensures the rest of the dashboard still works
        }
        
        setError(null);
        
        // Set initial budget range based on data
        if (dashboardResponse.data && dashboardResponse.data.summary) {
          setBudgetRange([0, dashboardResponse.data.summary.totalBudget]);
        }
        
        // Log the game plans data to help with debugging
        console.log('Game Plans Data:', gamePlans);
        
        try {
          // Extract unique lastUpdate options from game plans
          const lastUpdateMap = new Map();
            
          // Fetch the last_updates table directly to get the options
          const lastUpdatesResponse = await axios.get('/api/admin/last-updates');
          if (lastUpdatesResponse.data && Array.isArray(lastUpdatesResponse.data)) {
            lastUpdatesResponse.data.forEach((update: {id: number, name: string}) => {
              lastUpdateMap.set(update.id, update.name);
            });
          }
            
          // Also try to extract from game plans as a backup
          if (gamePlans && gamePlans.length > 0) {
            gamePlans.forEach((plan: GamePlan) => {
              // Debug: Log each plan's lastUpdate property
              console.log('Plan lastUpdate:', plan.lastUpdate, 'Plan last_update_id:', plan.last_update_id);
              
              if (plan.lastUpdate && plan.lastUpdate.id && plan.lastUpdate.name) {
                lastUpdateMap.set(plan.lastUpdate.id, plan.lastUpdate.name);
              } else if (plan.last_update_id) {
                // If we have a last_update_id but no lastUpdate object, try to use it
                console.log('Using last_update_id:', plan.last_update_id);
                // We'll set a temporary name based on the ID until we get the real name
                lastUpdateMap.set(plan.last_update_id, `Update ${plan.last_update_id}`);
              }
            });
          }
            
          // Convert to array of options
          const updateOptions = Array.from(lastUpdateMap.entries()).map(([id, name]) => ({
            id: Number(id),
            name: String(name)
          }));
          
          setAvailableUpdateOptions(updateOptions);
          
          // Set the most recent update as the default (or clear it if none available)
          if (updateOptions.length > 0) {
            setLastUpdateDate(String(updateOptions[0].id));
          } else {
            setLastUpdateDate('');
          }
        } catch (gamePlansError) {
          console.error('Error fetching game plans:', gamePlansError);
          // Continue with the dashboard even if game plans fetch fails
          // This ensures the rest of the dashboard still works
        }
        
        // Generate campaign distribution data
        if (dashboardResponse.data && dashboardResponse.data.budgetByCategoryPercentage) {
          // Use the category percentage data from the API
          const distributionData = Object.entries(dashboardResponse.data.budgetByCategoryPercentage)
            .map(([name, percentage], index) => {
              // Get the absolute budget value for this category
              const absoluteBudget = dashboardResponse.data.budgetByCategory[name] as number;
              
              return {
                name,
                value: percentage as number, // Use percentage values for the chart
                absoluteBudget: absoluteBudget, // Keep absolute budget for tooltip
                color: COLORS[index % COLORS.length]
              };
            })
            // Sort by percentage value (descending)
            .sort((a, b) => b.value - a.value);
          
          setCampaignDistributionData(distributionData);
        }
      } catch (err) {
        console.error('Error fetching game plan data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGamePlanData();
  }, [selectedYear]);
  
  // Toggle sidebar expansion
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };
  
  // Handle media type selection
  const toggleMediaType = (mediaType: string) => {
    setSelectedMediaTypes(prev => 
      prev.includes(mediaType) 
        ? prev.filter(type => type !== mediaType) 
        : [...prev, mediaType]
    );
  };
  
  // Handle country selection
  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) 
        ? prev.filter(c => c !== country) 
        : [...prev, country]
    );
  };
  
  // Handle PM type selection
  const togglePMType = (pmType: string) => {
    setSelectedPMTypes(prev => 
      prev.includes(pmType) 
        ? prev.filter(type => type !== pmType) 
        : [...prev, pmType]
    );
  };
  
  // Handle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category]
    );
  };
  
  // Handle last update selection
  const toggleLastUpdate = (lastUpdate: string) => {
    setSelectedLastUpdates(prev => 
      prev.includes(lastUpdate) 
        ? prev.filter(update => update !== lastUpdate) 
        : [...prev, lastUpdate]
    );
  };
  
  // Helper function to apply all filters to game plans
  const applyAllFilters = (plans: GamePlan[]): GamePlan[] => {
    let filteredPlans = [...plans];
    
    // Apply media type filter
    if (selectedMediaTypes.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.mediaSubType?.mediaType && 
        selectedMediaTypes.includes(plan.mediaSubType.mediaType.name)
      );
    }
    
    // Apply country filter
    if (selectedCountries.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.country && 
        plan.country.name && 
        selectedCountries.includes(plan.country.name)
      );
    }
    
    // Apply PM type filter
    if (selectedPMTypes.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.pmType && 
        selectedPMTypes.includes(plan.pmType.name)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.category && 
        plan.category.name && 
        selectedCategories.includes(plan.category.name)
      );
    }
    
    // Last Update filter removed
    
    return filteredPlans;
  };
  
  // Handle campaign distribution chart click
  const handleCampaignBarClick = (data: any) => {
    console.log('Campaign bar clicked:', data);
    // Toggle filter - if already selected, clear the filter
    if (activeFilter === data.name) {
      setActiveFilter(null);
    } else {
      setActiveFilter(data.name);
    }
  };
  
  // Handle budget range change
  const handleBudgetRangeChange = (range: [number, number]) => {
    setBudgetRange(range);
  };
  
  // Handle last update selection change
  const handleLastUpdateChange = (lastUpdateId: string) => {
    setLastUpdateDate(lastUpdateId);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSelectedMediaTypes([]);
    setSelectedCountries([]);
    setSelectedPMTypes([]);
    setSelectedCategories([]);
    setSelectedLastUpdates([]);
    if (gamePlanData && gamePlanData.summary) {
      setBudgetRange([0, gamePlanData.summary.totalBudget]);
    }
    setLastUpdateDate('');
    setFilteredData(gamePlanData);
  };
  
  // Apply filters when they change
  // Note: We need to include selectedCategories in the dependency array from the beginning
  // to avoid React errors about changing dependency array size
  useEffect(() => {
    if (!gamePlanData) return;
    
    // Start with all data
    let filtered = { ...gamePlanData };
    
    // Apply media type filter
    if (selectedMediaTypes.length > 0) {
      // Filter budget by media type
      const filteredBudgetByMediaType: Record<string, number> = {};
      Object.entries(gamePlanData.budgetByMediaType).forEach(([mediaType, budget]) => {
        if (selectedMediaTypes.includes(mediaType)) {
          filteredBudgetByMediaType[mediaType] = budget;
        }
      });
      filtered.budgetByMediaType = filteredBudgetByMediaType;
    }
    
    // Apply country filter
    if (selectedCountries.length > 0) {
      // Filter budget by country
      const filteredBudgetByCountry: Record<string, number> = {};
      Object.entries(gamePlanData.budgetByCountry).forEach(([country, budget]) => {
        if (selectedCountries.includes(country)) {
          filteredBudgetByCountry[country] = budget;
        }
      });
      filtered.budgetByCountry = filteredBudgetByCountry;
    }
    
    // Apply PM type filter
    if (selectedPMTypes.length > 0) {
      // Filter campaigns by PM type
      const filteredCampaignsByPMType: Record<string, number> = {};
      Object.entries(gamePlanData.campaignsByPMType).forEach(([pmType, count]) => {
        if (selectedPMTypes.includes(pmType)) {
          filteredCampaignsByPMType[pmType] = count;
        }
      });
      filtered.campaignsByPMType = filteredCampaignsByPMType;
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      // Filter budget by category
      const filteredBudgetByCategory: Record<string, number> = {};
      Object.entries(gamePlanData.budgetByCategory).forEach(([category, budget]) => {
        if (selectedCategories.includes(category)) {
          filteredBudgetByCategory[category] = budget;
        }
      });
      filtered.budgetByCategory = filteredBudgetByCategory;
      
      // Also filter the category percentages
      const filteredBudgetByCategoryPercentage: Record<string, number> = {};
      Object.entries(gamePlanData.budgetByCategoryPercentage).forEach(([category, percentage]) => {
        if (selectedCategories.includes(category)) {
          filteredBudgetByCategoryPercentage[category] = percentage as number;
        }
      });
      filtered.budgetByCategoryPercentage = filteredBudgetByCategoryPercentage;
    }
    
    // Always update the campaign distribution data based on the current filtered data
    // This ensures the chart responds to all filters
    let totalFilteredBudget = 0;
    let filteredBudgetByCategory: Record<string, number> = {};
    
    // First, determine which categories to include based on filters
    if (selectedMediaTypes.length > 0 || selectedCountries.length > 0 || selectedPMTypes.length > 0 || selectedCategories.length > 0) {
      // Apply all filters using the helper function
      let filteredPlans = applyAllFilters(gamePlans);
      
      // Calculate budget by category from filtered plans
      filteredPlans.forEach(plan => {
        if (!plan.category || !plan.category.name || !plan.totalBudget) return;
        
        const categoryName = plan.category.name;
        const budget = Number(plan.totalBudget) || 0;
        
        if (!filteredBudgetByCategory[categoryName]) {
          filteredBudgetByCategory[categoryName] = 0;
        }
        
        filteredBudgetByCategory[categoryName] += budget;
        totalFilteredBudget += budget;
      });
    } else {
      // If no filters are applied, use the original data
      filteredBudgetByCategory = { ...gamePlanData.budgetByCategory };
      Object.values(filteredBudgetByCategory).forEach(budget => {
        totalFilteredBudget += budget as number;
      });
    }
    
    // Calculate new percentages
    const filteredBudgetByCategoryPercentage: Record<string, number> = {};
    Object.entries(filteredBudgetByCategory).forEach(([category, budget]) => {
      filteredBudgetByCategoryPercentage[category] = totalFilteredBudget > 0 
        ? (budget / totalFilteredBudget) * 100 
        : 0;
    });
    
    // Update filtered data
    filtered.budgetByCategory = filteredBudgetByCategory;
    filtered.budgetByCategoryPercentage = filteredBudgetByCategoryPercentage;
    
    // Update campaign distribution data
    const distributionData = Object.entries(filteredBudgetByCategoryPercentage)
      .map(([name, percentage], index) => {
        // Ensure percentage is a valid number and cap it at 100%
        const validPercentage = Math.min(Number(percentage) || 0, 100);
        
        return {
          name,
          value: validPercentage,
          absoluteBudget: filteredBudgetByCategory[name],
          color: COLORS[index % COLORS.length]
        };
      })
      .sort((a, b) => b.value - a.value);
    
    setCampaignDistributionData(distributionData);
    
    // Update filtered data
    setFilteredData(filtered);
    
  // We need to include all filter dependencies from the beginning to avoid React errors
  }, [gamePlanData, selectedMediaTypes, selectedCountries, selectedPMTypes, selectedCategories]);

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Top Navigation */}
      <Navigation />
      
      {/* Dashboard Header */}
      <div className="border-b border-gray-200 px-6 py-4 mt-16">
        <h1 className="text-2xl font-bold text-gray-800">Media Sufficiency Dashboard</h1>
        <p className="text-gray-600 mt-1">Game Plans Overview and Budget Analysis</p>
      </div>
      
      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarExpanded ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className={`${sidebarExpanded ? 'block' : 'hidden'} text-lg font-medium text-gray-700`}>Filters</h2>
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              {sidebarExpanded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1">
            {/* Fiscal Year filter removed */}
            
            {/* Last Update filter removed */}
            
            {/* Media Type Filter */}
            {gamePlanData && (
              <div className="p-4">
                <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-700 mb-2`}>Media Type</h3>
                <div className="space-y-2">
                  {Object.keys(gamePlanData.budgetByMediaType).map(mediaType => (
                    <div key={mediaType} className="flex items-center">
                      <input
                        id={`media-${mediaType}`}
                        type="checkbox"
                        checked={selectedMediaTypes.includes(mediaType)}
                        onChange={() => toggleMediaType(mediaType)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`media-${mediaType}`} 
                        className={`${sidebarExpanded ? 'block' : 'hidden'} ml-2 text-sm text-gray-700`}
                      >
                        {mediaType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Country Filter */}
            {gamePlanData && (
              <div className="p-4">
                <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-700 mb-2`}>Country</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.keys(gamePlanData.budgetByCountry).map(country => (
                    <div key={country} className="flex items-center">
                      <input
                        id={`country-${country}`}
                        type="checkbox"
                        checked={selectedCountries.includes(country)}
                        onChange={() => toggleCountry(country)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`country-${country}`} 
                        className={`${sidebarExpanded ? 'block' : 'hidden'} ml-2 text-sm text-gray-700`}
                      >
                        {country}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* PM Type Filter */}
            {gamePlanData && (
              <div className={`p-4 ${sidebarExpanded ? 'block' : 'hidden'}`}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">PM Type</h3>
                <div className="space-y-2">
                  {gamePlanData && Object.keys(gamePlanData.campaignsByPMType).map((pmType) => (
                    <div key={pmType} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`pmType-${pmType}`}
                        checked={selectedPMTypes.includes(pmType)}
                        onChange={() => togglePMType(pmType)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`pmType-${pmType}`} className="ml-2 text-sm text-gray-700">
                        {pmType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Category Filter */}
            {gamePlanData && (
              <div className={`p-4 ${sidebarExpanded ? 'block' : 'hidden'}`}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
                <div className="space-y-2">
                  {gamePlanData && Object.keys(gamePlanData.budgetByCategory).map((category) => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Clear Filters Button */}
            <button
              onClick={clearAllFilters}
              className={`${sidebarExpanded ? 'block' : 'hidden'} w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md text-sm`}
            >
              Clear All Filters
            </button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          ) : filteredData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Total Budget</div>
                    <div className="text-2xl font-semibold text-indigo-600">€{filteredData.summary.totalBudget.toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Campaigns</div>
                    <div className="text-2xl font-semibold text-blue-600">{filteredData.summary.campaignCount}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Media Types</div>
                    <div className="text-2xl font-semibold text-green-600">{filteredData.summary.mediaTypeCount}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Countries</div>
                    <div className="text-2xl font-semibold text-purple-600">{filteredData.summary.countryCount}</div>
                  </div>
                </div>
              </div>
              
              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Campaign Distribution Chart */}
                <div className="bg-white rounded-lg shadow p-4" ref={campaignChartRef}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Campaign Distribution</h2>
                    <div className="text-xs text-gray-500">
                      Click on bars to filter dashboard
                    </div>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={campaignDistributionData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                          onClick={handleCampaignBarClick}
                          className="cursor-pointer"
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 100]} 
                          />
                          <Tooltip 
                            formatter={(value, name, props) => {
                              // For the value (percentage)
                              if (typeof value === 'number') {
                                // Get the absolute budget from the entry
                                const entry = props.payload;
                                const absoluteBudget = entry?.absoluteBudget;
                                
                                // Show both percentage and absolute budget
                                return [
                                  `${value.toFixed(2)}%`,
                                  `€${absoluteBudget?.toLocaleString() || '0'}`
                                ];
                              }
                              return value;
                            }}
                            labelFormatter={(label) => `Category: ${label}`}
                            labelStyle={{ color: '#333', fontWeight: 'bold' }}
                            itemStyle={{ padding: '2px 0' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            content={() => (
                              <div className="flex justify-center items-center mt-2">
                                <div className="bg-black w-4 h-4 mr-2"></div>
                                <span className="text-sm">Percentage</span>
                              </div>
                            )}
                          />
                          <Bar 
                            dataKey="value" 
                            name="Budget %" 
                            radius={[4, 4, 0, 0]}
                            isAnimationActive={false}
                            onClick={(data) => handleCampaignBarClick(data)}
                          >
                            {campaignDistributionData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke={activeFilter === entry.name ? '#000' : 'none'}
                                strokeWidth={activeFilter === entry.name ? 2 : 0}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                
                {/* Country Budget by Quarter */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Country Budget by Quarter</h2>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Spinner />
                    </div>
                  ) : gamePlans.length === 0 ? (
                    <div className="flex justify-center items-center h-[200px] text-gray-500">
                      <div className="text-center">
                        <p className="mb-2">No detailed country data available.</p>
                        <p className="text-sm">Upload game plans with country details to see quarterly breakdown.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1 %</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2 %</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q3 %</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q4 %</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Budget</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredData && gamePlans && (() => {
                            // Filter game plans based on selected filters
                            let filteredPlans = [...gamePlans];
                            
                            // Apply media type filter
                            if (selectedMediaTypes.length > 0) {
                              filteredPlans = filteredPlans.filter(plan => 
                                plan.mediaSubType?.mediaType && 
                                selectedMediaTypes.includes(plan.mediaSubType.mediaType.name)
                              );
                            }
                            
                            // Apply country filter
                            if (selectedCountries.length > 0) {
                              filteredPlans = filteredPlans.filter(plan => 
                                plan.country && 
                                plan.country.name && 
                                selectedCountries.includes(plan.country.name)
                              );
                            }
                            
                            // Apply PM type filter
    if (selectedPMTypes.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.pmType && 
        selectedPMTypes.includes(plan.pmType.name)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.category && 
        plan.category.name && 
        selectedCategories.includes(plan.category.name)
      );
    }
                            
                            // Get unique countries from filtered plans
                            const filteredCountries = Array.from(new Set(filteredPlans
                              .filter(plan => plan.country && plan.country.name)
                              .map(plan => plan.country!.name)));
                            
                            // Process each country
                            return filteredCountries.flatMap(country => {
                              // Get all game plans for this country
                              const countryPlans = filteredPlans.filter(plan => 
                                plan.country && 
                                plan.country.name && 
                                plan.country.name.toLowerCase() === country.toLowerCase()
                              );
                              
                              // Calculate total budget for this country
                              const countryTotalBudget = countryPlans.reduce((sum, plan) => sum + (Number(plan.totalBudget) || 0), 0);
                              
                              // Calculate quarterly budgets for this country
                              const countryQ1Budget = countryPlans.reduce((sum, plan) => sum + (Number(plan.q1Budget) || 0), 0);
                              const countryQ2Budget = countryPlans.reduce((sum, plan) => sum + (Number(plan.q2Budget) || 0), 0);
                              const countryQ3Budget = countryPlans.reduce((sum, plan) => sum + (Number(plan.q3Budget) || 0), 0);
                              const countryQ4Budget = countryPlans.reduce((sum, plan) => sum + (Number(plan.q4Budget) || 0), 0);
                              
                              // Calculate quarterly percentages
                              const q1Percentage = countryTotalBudget > 0 ? Math.round((countryQ1Budget / countryTotalBudget) * 100) : 0;
                              const q2Percentage = countryTotalBudget > 0 ? Math.round((countryQ2Budget / countryTotalBudget) * 100) : 0;
                              const q3Percentage = countryTotalBudget > 0 ? Math.round((countryQ3Budget / countryTotalBudget) * 100) : 0;
                              const q4Percentage = countryTotalBudget > 0 ? Math.round((countryQ4Budget / countryTotalBudget) * 100) : 0;
                              
                              // Check if this country is expanded
                              const isExpanded = expandedCountries.includes(country);
                              
                              // Get categories for this country
                              const categoryPlans: Record<string, {
                                total: number;
                                q1: number;
                                q2: number;
                                q3: number;
                                q4: number;
                              }> = {};
                              
                              // Group plans by category
                              countryPlans.forEach(plan => {
                                const categoryName = plan.category?.name || 'Uncategorized';
                                
                                if (!categoryPlans[categoryName]) {
                                  categoryPlans[categoryName] = {
                                    total: 0,
                                    q1: 0,
                                    q2: 0,
                                    q3: 0,
                                    q4: 0
                                  };
                                }
                                
                                categoryPlans[categoryName].total += Number(plan.totalBudget) || 0;
                                categoryPlans[categoryName].q1 += Number(plan.q1Budget) || 0;
                                categoryPlans[categoryName].q2 += Number(plan.q2Budget) || 0;
                                categoryPlans[categoryName].q3 += Number(plan.q3Budget) || 0;
                                categoryPlans[categoryName].q4 += Number(plan.q4Budget) || 0;
                              });
                              
                              // Convert to array and sort by total budget
                              const categories = Object.entries(categoryPlans)
                                .map(([name, data]) => ({
                                  name,
                                  ...data,
                                  q1Percentage: data.total > 0 ? Math.round((data.q1 / data.total) * 100) : 0,
                                  q2Percentage: data.total > 0 ? Math.round((data.q2 / data.total) * 100) : 0,
                                  q3Percentage: data.total > 0 ? Math.round((data.q3 / data.total) * 100) : 0,
                                  q4Percentage: data.total > 0 ? Math.round((data.q4 / data.total) * 100) : 0
                                }))
                                .sort((a, b) => b.total - a.total);
                              
                              // Create rows for country and its categories
                              const rows = [];
                              
                              // Country row
                              rows.push(
                                <tr 
                                  key={`country-${country}`}
                                  className="bg-blue-50 cursor-pointer hover:bg-blue-100"
                                  onClick={() => toggleCountryExpansion(country)}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                    <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>
                                    {country}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q1Percentage}%</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q2Percentage}%</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q3Percentage}%</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q4Percentage}%</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">€ {countryTotalBudget.toLocaleString()}</td>
                                </tr>
                              );
                              
                              // Category rows (only if country is expanded)
                              if (isExpanded) {
                                categories.forEach(category => {
                                  rows.push(
                                    <tr 
                                      key={`${country}-${category.name}`}
                                      className="bg-white"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 pl-12">
                                        {category.name}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.q1Percentage}%</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.q2Percentage}%</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.q3Percentage}%</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.q4Percentage}%</td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€ {category.total.toLocaleString()}</td>
                                    </tr>
                                  );
                                });
                              }
                              
                              return rows;
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Country Performance by Sub-Media Type */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Country Performance by Sub-Media Type</h2>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Spinner />
                    </div>
                  ) : gamePlans.length === 0 ? (
                    <div className="flex justify-center items-center h-[200px] text-gray-500">
                      <div className="text-center">
                        <p className="mb-2">No detailed country data available.</p>
                        <p className="text-sm">Upload game plans with country and media type details to see performance breakdown.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                            {/* Dynamically generate columns for each sub-media type */}
                            {(() => {
                              // Get all unique sub-media types from filtered game plans
                              let filteredPlans = [...gamePlans];
                              
                              // Apply media type filter
                              if (selectedMediaTypes.length > 0) {
                                filteredPlans = filteredPlans.filter(plan => 
                                  plan.mediaSubType?.mediaType && 
                                  selectedMediaTypes.includes(plan.mediaSubType.mediaType.name)
                                );
                              }
                              
                              // Apply country filter
                              if (selectedCountries.length > 0) {
                                filteredPlans = filteredPlans.filter(plan => 
                                  plan.country && 
                                  plan.country.name && 
                                  selectedCountries.includes(plan.country.name)
                                );
                              }
                              
                              // Apply PM type filter
    if (selectedPMTypes.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.pmType && 
        selectedPMTypes.includes(plan.pmType.name)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.category && 
        plan.category.name && 
        selectedCategories.includes(plan.category.name)
      );
    }
                              
                              // Get unique sub-media types
                              const subMediaTypes = Array.from(new Set(
                                filteredPlans
                                  .filter(plan => plan.mediaSubType && plan.mediaSubType.name)
                                  .map(plan => plan.mediaSubType!.name)
                              )).sort();
                              
                              // Return table headers for each sub-media type
                              return subMediaTypes.map(subMediaType => (
                                <th 
                                  key={`header-${subMediaType}`}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {subMediaType}
                                </th>
                              ));
                            })()} 
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            // Get all unique countries and sub-media types from filtered game plans
                            let filteredPlans = [...gamePlans];
                            
                            // Apply media type filter
                            if (selectedMediaTypes.length > 0) {
                              filteredPlans = filteredPlans.filter(plan => 
                                plan.mediaSubType?.mediaType && 
                                selectedMediaTypes.includes(plan.mediaSubType.mediaType.name)
                              );
                            }
                            
                            // Apply country filter
                            if (selectedCountries.length > 0) {
                              filteredPlans = filteredPlans.filter(plan => 
                                plan.country && 
                                plan.country.name && 
                                selectedCountries.includes(plan.country.name)
                              );
                            }
                            
                            // Apply PM type filter
    if (selectedPMTypes.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.pmType && 
        selectedPMTypes.includes(plan.pmType.name)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.category && 
        plan.category.name && 
        selectedCategories.includes(plan.category.name)
      );
    }
                            
                            // Get unique countries
                            const countries = Array.from(new Set(
                              filteredPlans
                                .filter(plan => plan.country && plan.country.name)
                                .map(plan => plan.country!.name)
                            )).sort();
                            
                            // Get unique sub-media types
                            const subMediaTypes = Array.from(new Set(
                              filteredPlans
                                .filter(plan => plan.mediaSubType && plan.mediaSubType.name)
                                .map(plan => plan.mediaSubType!.name)
                            )).sort();
                            
                            // Calculate country performance by sub-media type
                            const countryPerformance: Record<string, Record<string, number>> = {};
                            
                            // Initialize country performance data
                            countries.forEach(country => {
                              countryPerformance[country] = {};
                              subMediaTypes.forEach(subMediaType => {
                                countryPerformance[country][subMediaType] = 0;
                              });
                            });
                            
                            // Calculate total budget for each country
                            const countryTotalBudgets: Record<string, number> = {};
                            countries.forEach(country => {
                              countryTotalBudgets[country] = filteredPlans
                                .filter(plan => plan.country && plan.country.name === country)
                                .reduce((sum, plan) => sum + (Number(plan.totalBudget) || 0), 0);
                            });
                            
                            // Calculate budget for each country and sub-media type
                            filteredPlans.forEach(plan => {
                              if (plan.country && plan.country.name && plan.mediaSubType && plan.mediaSubType.name) {
                                const country = plan.country.name;
                                const subMediaType = plan.mediaSubType.name;
                                const budget = Number(plan.totalBudget) || 0;
                                
                                countryPerformance[country][subMediaType] += budget;
                              }
                            });
                            
                            // Convert budget to percentage
                            countries.forEach(country => {
                              const totalBudget = countryTotalBudgets[country];
                              if (totalBudget > 0) {
                                subMediaTypes.forEach(subMediaType => {
                                  const budget = countryPerformance[country][subMediaType];
                                  countryPerformance[country][subMediaType] = (budget / totalBudget) * 100;
                                });
                              }
                            });
                            
                            // Generate table rows
                            return countries.map(country => (
                              <tr key={`performance-${country}`} className="bg-blue-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {country}
                                </td>
                                {subMediaTypes.map(subMediaType => (
                                  <td 
                                    key={`${country}-${subMediaType}`}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                  >
                                    {countryPerformance[country][subMediaType].toFixed(1)}%
                                  </td>
                                ))}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Campaign by Quarter */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Campaign by Quarter</h2>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Spinner />
                    </div>
                  ) : gamePlans.length === 0 ? (
                    <div className="flex justify-center items-center h-[200px] text-gray-500">
                      <div className="text-center">
                        <p className="mb-2">No detailed campaign data available.</p>
                        <p className="text-sm">Upload game plans with campaign details to see quarterly breakdown.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto" style={{ maxHeight: '300px' }}>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q3</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q4</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredData && gamePlans && (() => {
                            // Filter game plans based on selected filters
                            let filteredPlans = [...gamePlans];
                            
                            // Apply media type filter
                            if (selectedMediaTypes.length > 0) {
                              filteredPlans = filteredPlans.filter(plan => 
                                plan.mediaSubType?.mediaType && 
                                selectedMediaTypes.includes(plan.mediaSubType.mediaType.name)
                              );
                            }
                            
                            // Apply country filter
                            if (selectedCountries.length > 0) {
                              filteredPlans = filteredPlans.filter(plan => 
                                plan.country && 
                                plan.country.name && 
                                selectedCountries.includes(plan.country.name)
                              );
                            }
                            
                            // Apply PM type filter
    if (selectedPMTypes.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.pmType && 
        selectedPMTypes.includes(plan.pmType.name)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.category && 
        plan.category.name && 
        selectedCategories.includes(plan.category.name)
      );
    }
                            
                            // Get unique countries from filtered plans
                            const filteredCountries = Array.from(new Set(filteredPlans
                              .filter(plan => plan.country && plan.country.name)
                              .map(plan => plan.country!.name)));
                            
                            // Process each country
                            const tableRows = filteredCountries.flatMap(country => {
                              // Get total budget for this country
                              const countryBudget = filteredData?.budgetByCountry?.[country] || 0;
                              
                              // Get all campaigns for this country from the filtered plans
                              const countryCampaigns = filteredPlans.filter((plan: GamePlan) => {
                                if (!plan.country || !plan.country.name) return false;
                                return plan.country.name.toLowerCase() === country.toLowerCase();
                              });
                              
                              // If no campaigns found for this country, return empty array
                              if (countryCampaigns.length === 0) {
                                return [];
                              }
                              
                              // Group campaigns by name and sum their budgets
                              const campaignGroups: Record<string, {
                                name: string;
                                total: number;
                                q1: number;
                                q2: number;
                                q3: number;
                                q4: number;
                              }> = {};
                              
                              countryCampaigns.forEach(plan => {
                                if (!plan.campaign) return;
                                
                                const campaignName = plan.campaign.name || 'Unknown Campaign';
                                
                                if (!campaignGroups[campaignName]) {
                                  campaignGroups[campaignName] = {
                                    name: campaignName,
                                    total: 0,
                                    q1: 0,
                                    q2: 0,
                                    q3: 0,
                                    q4: 0
                                  };
                                }
                                
                                campaignGroups[campaignName].total += Number(plan.totalBudget) || 0;
                                campaignGroups[campaignName].q1 += Number(plan.q1Budget) || 0;
                                campaignGroups[campaignName].q2 += Number(plan.q2Budget) || 0;
                                campaignGroups[campaignName].q3 += Number(plan.q3Budget) || 0;
                                campaignGroups[campaignName].q4 += Number(plan.q4Budget) || 0;
                              });
                              
                              // Convert to array and sort by total budget
                              const campaigns = Object.values(campaignGroups)
                                .filter(campaign => campaign.total > 0)
                                .sort((a, b) => b.total - a.total);
                              
                              // If no campaigns with budget found, return empty array
                              if (campaigns.length === 0) {
                                return [];
                              }
                              
                              // Create rows for each campaign
                              return campaigns.map((campaign, campaignIndex) => {
                                return (
                                  <tr 
                                    key={`${country}-${campaign.name}-${campaignIndex}`}
                                    className={campaignIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {country}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {campaign.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      € {campaign.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {campaign.q1 > 0 ? `€ ${campaign.q1.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {campaign.q2 > 0 ? `€ ${campaign.q2.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {campaign.q3 > 0 ? `€ ${campaign.q3.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {campaign.q4 > 0 ? `€ ${campaign.q4.toLocaleString()}` : '-'}
                                    </td>
                                  </tr>
                                );
                              });
                            });
                            
                            return tableRows;
                          })()}
                          
                          {/* Show a message if no data is displayed in the table */}
                          {filteredData && Object.entries(filteredData.budgetByCountry || {}).length === 0 && 
                           gamePlans.length > 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                No campaign data available for the selected filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Top Countries by Budget */}
                <div className="bg-white rounded-lg shadow p-4" ref={countryChartRef}>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Countries by Budget</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(filteredData?.budgetByCountry || {})
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([country, budget]) => ({ country, budget }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="country" type="category" width={80} />
                        <Tooltip formatter={(value) => typeof value === 'number' ? `€${value.toLocaleString()}` : `€${value}`} />
                        <Bar 
                          dataKey="budget" 
                          fill="#3E7DCD" 
                          onClick={(data) => toggleCountry(data.country)}
                        >
                          {Object.entries(filteredData?.budgetByCountry || {})
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([country], index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={selectedCountries.includes(country) ? '#ff7300' : '#3E7DCD'} 
                              />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Campaigns by PM Type */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Campaigns by PM Type</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(filteredData?.campaignsByPMType || {}).map(([type, count]) => ({
                          type,
                          count
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar 
                          dataKey="count" 
                          name="Campaign Count" 
                          fill="#5E9FE0" 
                          onClick={(data) => togglePMType(data.type)}
                        >
                          {Object.entries(filteredData?.campaignsByPMType || {}).map(([type], index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={selectedPMTypes.includes(type) ? '#ff7300' : '#5E9FE0'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Budget Timeline Chart - New Addition */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Budget Timeline</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { month: 'Jan', budget: (filteredData?.budgetByQuarter?.Q1 || 0) / 3 },
                        { month: 'Feb', budget: (filteredData?.budgetByQuarter?.Q1 || 0) / 3 },
                        { month: 'Mar', budget: (filteredData?.budgetByQuarter?.Q1 || 0) / 3 },
                        { month: 'Apr', budget: (filteredData?.budgetByQuarter?.Q2 || 0) / 3 },
                        { month: 'May', budget: (filteredData?.budgetByQuarter?.Q2 || 0) / 3 },
                        { month: 'Jun', budget: (filteredData?.budgetByQuarter?.Q2 || 0) / 3 },
                        { month: 'Jul', budget: (filteredData?.budgetByQuarter?.Q3 || 0) / 3 },
                        { month: 'Aug', budget: (filteredData?.budgetByQuarter?.Q3 || 0) / 3 },
                        { month: 'Sep', budget: (filteredData?.budgetByQuarter?.Q3 || 0) / 3 },
                        { month: 'Oct', budget: (filteredData?.budgetByQuarter?.Q4 || 0) / 3 },
                        { month: 'Nov', budget: (filteredData?.budgetByQuarter?.Q4 || 0) / 3 },
                        { month: 'Dec', budget: (filteredData?.budgetByQuarter?.Q4 || 0) / 3 }
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => typeof value === 'number' ? `€${value.toLocaleString()}` : `€${value}`} />
                      <Area type="monotone" dataKey="budget" stroke="#1F4388" fill="#3E7DCD" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No game plan data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
