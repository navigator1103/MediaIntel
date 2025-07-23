'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart
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

// Interface for Media Sufficiency Reach data
interface MediaSufficiencyReachData {
  summary: {
    totalRecords: number;
    countries: number;
    campaigns: number;
    lastUpdated: string | null;
    woaOpenTv: number;
    woaPaidTv: number;
    woaPmFf: number;
    woaInfluencersAmplification: number;
  };
  tvReachData: Array<{
    campaign: string;
    country: string;
    category: string;
    currentReach: number;
    idealReach: number;
    gap: number;
  }>;
  digitalReachData: Array<{
    campaign: string;
    country: string;
    category: string;
    currentReach: number;
    idealReach: number;
    gap: number;
  }>;
  combinedReachData: Array<{
    campaign: string;
    country: string;
    category: string;
    currentReach: number;
    idealReach: number;
    gap: number;
  }>;
  countryReachAnalysis: Array<{
    country: string;
    campaigns: number;
    avgTvReach: number;
    avgTvIdeal: number;
    avgDigitalReach: number;
    avgDigitalIdeal: number;
    avgCombinedReach: number;
    avgCombinedIdeal: number;
    tvGap: number;
    digitalGap: number;
    combinedGap: number;
  }>;
  categoryReachAnalysis: Array<{
    category: string;
    campaigns: number;
    avgTvReach: number;
    avgTvIdeal: number;
    avgDigitalReach: number;
    avgDigitalIdeal: number;
    avgCombinedReach: number;
    avgCombinedIdeal: number;
    tvGap: number;
    digitalGap: number;
    combinedGap: number;
  }>;
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
  startDate?: string;
  endDate?: string;
}

export default function MediaSufficiencyDashboard() {
  // State for data
  const [gamePlanData, setGamePlanData] = useState<GamePlanData | null>(null);
  const [gamePlans, setGamePlans] = useState<GamePlan[]>([]);
  const [mediaSufficiencyReachData, setMediaSufficiencyReachData] = useState<MediaSufficiencyReachData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReach, setIsLoadingReach] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for filters
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['India']);
  const [selectedSubRegions, setSelectedSubRegions] = useState<string[]>([]);
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
  
  // Fetch Media Sufficiency Reach data
  const fetchMediaSufficiencyReachData = async () => {
    try {
      setIsLoadingReach(true);
      const response = await axios.get('/api/dashboard/media-sufficiency-reach');
      setMediaSufficiencyReachData(response.data);
    } catch (error) {
      console.error('Error fetching media sufficiency reach data:', error);
    } finally {
      setIsLoadingReach(false);
    }
  };
  
  // Fetch Game Plan data
  useEffect(() => {
    const fetchGamePlanData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch aggregated dashboard data
        const dashboardResponse = await axios.get('/api/dashboard/media-sufficiency');
        
        // Add lastUpdate field if not present
        if (dashboardResponse.data && dashboardResponse.data.summary && !dashboardResponse.data.summary.lastUpdate) {
          dashboardResponse.data.summary.lastUpdate = new Date().toISOString();
        }
        
        setGamePlanData(dashboardResponse.data);
        setFilteredData(dashboardResponse.data); // Initialize filtered data with all data
        
        try {
          // Fetch raw game plans data for the Campaign by Quarter table
          const gamePlansResponse = await axios.get('/api/admin/media-sufficiency/game-plans');
          
          // Use the actual start and end date fields from the game plans table
          // Handle the API response structure which returns an object with gamePlans property
          const gamePlansData = gamePlansResponse.data.gamePlans || gamePlansResponse.data || [];
          const gamePlansWithDates = gamePlansData.map((plan: GamePlan) => {
            const year = parseInt(selectedYear);
            
            // Check if plan already has valid start and end dates
            if (plan.startDate && plan.endDate) {
              // Use existing dates
              console.log(`Using existing dates for campaign ${plan.campaign?.name}: ${plan.startDate} - ${plan.endDate}`);
              return plan;
            }
            
            console.log(`No existing dates for campaign ${plan.campaign?.name}, calculating based on quarters.`);
            
            // If dates are missing, fall back to calculating based on quarters with budget
            let startDate = null;
            let endDate = null;
            
            // Determine start date based on first quarter with budget
            if (plan.q1Budget > 0) {
              startDate = new Date(year, 0, 1); // Jan 1
            } else if (plan.q2Budget > 0) {
              startDate = new Date(year, 3, 1); // Apr 1
            } else if (plan.q3Budget > 0) {
              startDate = new Date(year, 6, 1); // Jul 1
            } else if (plan.q4Budget > 0) {
              startDate = new Date(year, 9, 1); // Oct 1
            }
            
            // Determine end date based on last quarter with budget
            if (plan.q4Budget > 0) {
              endDate = new Date(year, 11, 31); // Dec 31
            } else if (plan.q3Budget > 0) {
              endDate = new Date(year, 8, 30); // Sep 30
            } else if (plan.q2Budget > 0) {
              endDate = new Date(year, 5, 30); // Jun 30
            } else if (plan.q1Budget > 0) {
              endDate = new Date(year, 2, 31); // Mar 31
            }
            
            // If no budget in any quarter, default to full year
            if (!startDate || !endDate) {
              startDate = new Date(year, 0, 1);
              endDate = new Date(year, 11, 31);
            }
            
            return {
              ...plan,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString()
            };
          });
          
          setGamePlans(gamePlansWithDates);
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
  
  // Fetch reach data when Sufficiency tab is activated
  useEffect(() => {
    if (activeTab === 'sufficiency' && !mediaSufficiencyReachData) {
      fetchMediaSufficiencyReachData();
    }
  }, [activeTab]);
  
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

  // Handle sub region selection
  const toggleSubRegion = (subRegion: string) => {
    setSelectedSubRegions(prev => 
      prev.includes(subRegion) 
        ? prev.filter(sr => sr !== subRegion) 
        : [...prev, subRegion]
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
        plan.mediaSubType?.mediaType?.name && selectedMediaTypes.includes(plan.mediaSubType.mediaType.name)
      );
    }
    
    // Apply country filter
    if (selectedCountries.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.country?.name && selectedCountries.includes(plan.country.name)
      );
    }
    
    // Apply PM type filter
    if (selectedPMTypes.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.pmType?.name && selectedPMTypes.includes(plan.pmType.name)
      );
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.category?.name && selectedCategories.includes(plan.category.name)
      );
    }
    
    // Last Update filter removed
    
    return filteredPlans;
  };
  
  // Calculate TV and Digital share from game plans
  const calculateMediaShares = (plans: GamePlan[]) => {
    if (!plans || plans.length === 0) {
      // If no plans data, use the summary data from gamePlanData if available
      if (gamePlanData && gamePlanData.budgetByMediaType) {
        let tvBudget = 0;
        let digitalBudget = 0;
        let totalBudget = 0;
        
        // Calculate from budgetByMediaType
        Object.entries(gamePlanData.budgetByMediaType).forEach(([mediaType, budget]) => {
          const budgetValue = Number(budget) || 0;
          totalBudget += budgetValue;
          
          if (['TV', 'Radio', 'Print', 'OOH'].includes(mediaType)) {
            tvBudget += budgetValue;
          } else {
            digitalBudget += budgetValue;
          }
        });
        
        const tvShare = totalBudget > 0 ? (tvBudget / totalBudget) * 100 : 0;
        const digitalShare = totalBudget > 0 ? (digitalBudget / totalBudget) * 100 : 0;
        
        console.log(`Using summary data - TV Share: ${tvShare}%, Digital Share: ${digitalShare}%`);
        
        return { tvShare, digitalShare, tvBudget, digitalBudget };
      }
      
      return { tvShare: 0, digitalShare: 0, tvBudget: 0, digitalBudget: 0 };
    }
    
    // Debug: Log the first few plans to see their structure
    console.log('Sample game plans for media share calculation:', plans.slice(0, 3));
    
    let tvBudget = 0;
    let digitalBudget = 0;
    let totalBudget = 0;
    
    plans.forEach(plan => {
      // Get the media type name from the mediaSubType
      const mediaTypeName = plan.mediaSubType?.mediaType?.name || '';
                            
      // Calculate the total budget from quarterly budgets
      const budget = (plan.q1Budget || 0) + (plan.q2Budget || 0) + (plan.q3Budget || 0) + (plan.q4Budget || 0);
      
      // Debug: Log each plan's media type and budget
      console.log(`Plan: ${plan.id}, Media Type: ${mediaTypeName}, Budget: ${budget}`);
      
      totalBudget += budget;
      
      // Check if the media type is traditional (TV) or digital
      if (['TV', 'Radio', 'Print', 'OOH'].includes(mediaTypeName)) {
        tvBudget += budget;
        console.log(`Added ${budget} to TV budget (${mediaTypeName})`);
      } else if (mediaTypeName) {
        // Only count as digital if we have a valid media type
        digitalBudget += budget;
        console.log(`Added ${budget} to Digital budget (${mediaTypeName})`);
      }
    });
    
    // If we couldn't categorize any budget, use a default split as fallback
    if (tvBudget === 0 && digitalBudget === 0 && totalBudget > 0) {
      // Fallback to default values based on industry averages
      tvBudget = totalBudget * 0.3;  // 30% TV
      digitalBudget = totalBudget * 0.7;  // 70% Digital
      console.log('Using fallback values for TV/Digital split');
    }
    
    // Calculate percentages
    const tvShare = totalBudget > 0 ? (tvBudget / totalBudget) * 100 : 0;
    const digitalShare = totalBudget > 0 ? (digitalBudget / totalBudget) * 100 : 0;
    
    // Debug: Log the calculated values
    console.log(`TV Budget: ${tvBudget}, Digital Budget: ${digitalBudget}, Total: ${totalBudget}`);
    console.log(`TV Share: ${tvShare}%, Digital Share: ${digitalShare}%`);
    
    return {
      tvShare,
      digitalShare,
      tvBudget,
      digitalBudget
    };
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
    setSelectedCountries(['India']); // Keep India selected by default
    setSelectedSubRegions([]);
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
      
      // Log the filter being applied
      console.log('Applying media type filter:', selectedMediaTypes);
      console.log('Filtered budget by media type:', filteredBudgetByMediaType);
      
      // Also need to filter categories by media type
      // This is crucial for the campaign distribution chart to respond to media type filter
      if (gamePlans && gamePlans.length > 0) {
        const filteredPlans = applyAllFilters(gamePlans);
        
        // Recalculate budget by category based on filtered plans
        const recalculatedBudgetByCategory: Record<string, number> = {};
        
        filteredPlans.forEach(plan => {
          const categoryName = plan.category?.name || 'Unknown';
          // Calculate the total budget from quarterly budgets
          const budget = (plan.q1Budget || 0) + (plan.q2Budget || 0) + (plan.q3Budget || 0) + (plan.q4Budget || 0);
          
          if (!recalculatedBudgetByCategory[categoryName]) {
            recalculatedBudgetByCategory[categoryName] = 0;
          }
          
          recalculatedBudgetByCategory[categoryName] += budget;
        });
        
        console.log('Recalculated budget by category:', recalculatedBudgetByCategory);
        filtered.budgetByCategory = recalculatedBudgetByCategory;
      }
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
  }, [gamePlanData, selectedMediaTypes, selectedCountries, selectedSubRegions, selectedPMTypes, selectedCategories]);

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="border-b border-gray-200 px-6 py-6 bg-white shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Media Intelligence Dashboard</h1>
        <p className="text-gray-600 mt-2 text-lg">Comprehensive analytics and insights for global media operations</p>
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
            
            {/* Sub Region Filter */}
            {mediaSufficiencyReachData && (
              <div className="p-4">
                <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-700 mb-2`}>Sub Region</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {['ASEAN', 'India'].map(subRegion => (
                    <div key={subRegion} className="flex items-center">
                      <input
                        id={`subregion-${subRegion}`}
                        type="checkbox"
                        checked={selectedSubRegions.includes(subRegion)}
                        onChange={() => toggleSubRegion(subRegion)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`subregion-${subRegion}`} 
                        className={`${sidebarExpanded ? 'block' : 'hidden'} ml-2 text-sm text-gray-700`}
                      >
                        {subRegion}
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
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${activeTab === 'overview' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('gameplans')}
                className={`${activeTab === 'gameplans' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Game Plans
              </button>
              <button
                onClick={() => setActiveTab('sufficiency')}
                className={`${activeTab === 'sufficiency' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Sufficiency
              </button>
            </nav>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          ) : filteredData ? (
            activeTab === 'overview' ? (
            <>
              {/* Calculate media shares from filtered game plans */}
              {(() => {
                // Get the filtered game plans
                const filteredPlans = gamePlans ? applyAllFilters(gamePlans) : [];
                
                // Debug log to check filtered plans
                console.log(`Number of filtered plans: ${filteredPlans.length}`);
                if (filteredPlans.length > 0) {
                  console.log('First few filtered plans:', filteredPlans.slice(0, 3));
                }
                
                // Calculate media shares directly from the budgetByMediaType in gamePlanData
                let tvBudget = 0;
                let digitalBudget = 0;
                let totalBudget = 0;
                
                // Use the filtered data's budgetByMediaType if available
                if (filteredData && filteredData.budgetByMediaType) {
                  Object.entries(filteredData.budgetByMediaType).forEach(([mediaType, budget]) => {
                    const budgetValue = Number(budget) || 0;
                    totalBudget += budgetValue;
                    
                    if (['TV', 'Radio', 'Print', 'OOH'].includes(mediaType)) {
                      tvBudget += budgetValue;
                    } else {
                      digitalBudget += budgetValue;
                    }
                  });
                }
                
                // Calculate percentages
                const tvShare = totalBudget > 0 ? (tvBudget / totalBudget) * 100 : 0;
                const digitalShare = totalBudget > 0 ? (digitalBudget / totalBudget) * 100 : 0;
                
                // Debug log the calculated values
                console.log(`Top Cards - TV Budget: ${tvBudget}, Digital Budget: ${digitalBudget}, Total: ${totalBudget}`);
                console.log(`Top Cards - TV Share: ${tvShare}%, Digital Share: ${digitalShare}%`);
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Campaigns Card */}
                    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Campaigns</div>
                        <div className="text-2xl font-semibold text-gray-800">{filteredData.summary.campaignCount}</div>
                      </div>
                      <div className="text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Total Budget Card */}
                    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Total Budget</div>
                        <div className="text-2xl font-semibold text-gray-800">€ {filteredData.summary.totalBudget.toLocaleString()}</div>
                      </div>
                      <div className="text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* TV Share Card */}
                    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">TV Share</div>
                        <div className="text-2xl font-semibold text-blue-500">
                          {/* Make sure we always display a valid number */}
                          {isNaN(tvShare) ? '0' : Math.round(tvShare)}%
                        </div>
                      </div>
                      <div className="text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Digital Share Card */}
                    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Digital Share</div>
                        <div className="text-2xl font-semibold text-purple-600">
                          {/* Make sure we always display a valid number */}
                          {isNaN(digitalShare) ? '0' : Math.round(digitalShare)}%
                        </div>
                      </div>
                      <div className="text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
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
            ) : activeTab === 'gameplans' ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Campaign Calendar</h2>
                
                {/* Top Cards - Single Line */}
                <div className="flex gap-4 mb-6">
                  {/* WIP Total Card */}
                  <div className="bg-blue-800 text-white p-3 rounded-md flex flex-row items-center justify-center gap-3 flex-1">
                    <div className="text-2xl font-bold">€ {applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.q1Budget + plan.q2Budget + plan.q3Budget + plan.q4Budget), 0).toLocaleString()}</div>
                    <div className="text-sm font-medium">WIP Total</div>
                  </div>
                  
                  {/* Q1 Card */}
                  <div className="bg-blue-700 text-white p-3 rounded-md flex flex-row items-center justify-center gap-2 flex-1">
                    <div className="text-2xl font-bold">{Math.round(applyAllFilters(gamePlans).reduce((acc, plan) => acc + plan.q1Budget, 0) / applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.q1Budget + plan.q2Budget + plan.q3Budget + plan.q4Budget), 0) * 100 || 0)}%</div>
                    <div className="text-sm font-medium">Q1</div>
                  </div>
                  
                  {/* Q2 Card */}
                  <div className="bg-blue-600 text-white p-3 rounded-md flex flex-row items-center justify-center gap-2 flex-1">
                    <div className="text-2xl font-bold">{Math.round(applyAllFilters(gamePlans).reduce((acc, plan) => acc + plan.q2Budget, 0) / applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.q1Budget + plan.q2Budget + plan.q3Budget + plan.q4Budget), 0) * 100 || 0)}%</div>
                    <div className="text-sm font-medium">Q2</div>
                  </div>
                  
                  {/* Q3 Card */}
                  <div className="bg-blue-500 text-white p-3 rounded-md flex flex-row items-center justify-center gap-2 flex-1">
                    <div className="text-2xl font-bold">{Math.round(applyAllFilters(gamePlans).reduce((acc, plan) => acc + plan.q3Budget, 0) / applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.q1Budget + plan.q2Budget + plan.q3Budget + plan.q4Budget), 0) * 100 || 0)}%</div>
                    <div className="text-sm font-medium">Q3</div>
                  </div>
                  
                  {/* Q4 Card */}
                  <div className="bg-blue-400 text-white p-3 rounded-md flex flex-row items-center justify-center gap-2 flex-1">
                    <div className="text-2xl font-bold">{Math.round(applyAllFilters(gamePlans).reduce((acc, plan) => acc + plan.q4Budget, 0) / applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.q1Budget + plan.q2Budget + plan.q3Budget + plan.q4Budget), 0) * 100 || 0)}%</div>
                    <div className="text-sm font-medium">Q4</div>
                  </div>
                </div>
                
                {/* Campaign Table */}
                {applyAllFilters(gamePlans).length > 0 ? (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[0.5fr_0.8fr_0.6fr_8fr] bg-gray-50 border-b sticky top-0 z-10">
                      <div className="py-2 px-3 font-semibold">Country</div>
                      <div className="py-2 px-3 font-semibold">Campaign</div>
                      <div className="py-2 px-3 font-semibold">Budget</div>
                      <div className="py-2 px-3 font-semibold">Timeline</div>
                    </div>
                    {/* Month markers with week subdivisions */}
                    <div className="grid grid-cols-[0.5fr_0.8fr_0.6fr_8fr] border-b">
                      <div className="col-span-3"></div>
                      <div className="py-1 px-3">
                        <div className="grid grid-cols-12 gap-0">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                            <div key={month} className="border-r border-gray-200 last:border-r-0">
                              <div className="text-xs text-gray-600 font-medium text-center py-1 bg-gray-50">{month}</div>
                              <div className="grid grid-cols-4 gap-0">
                                {['W1', 'W2', 'W3', 'W4'].map((week) => (
                                  <div key={week} className="text-xs text-gray-400 text-center py-1 border-r border-gray-100 last:border-r-0">
                                    {week}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Campaign Rows - Grouped by campaign */}
                    {(() => {
                      // Group campaigns by unique combination of campaign name and country only
                      const groupedCampaigns = applyAllFilters(gamePlans).reduce((acc: { [key: string]: GamePlan[] }, plan) => {
                        const key = `${plan.campaign?.name || 'Unknown'}-${plan.country?.name || 'Unknown'}`;
                        if (!acc[key]) {
                          acc[key] = [];
                        }
                        acc[key].push(plan);
                        return acc;
                      }, {});

                      return Object.entries(groupedCampaigns).map(([key, plans]) => {
                        // Use the first plan for display info (they should all have same campaign/country)
                        const firstPlan = plans[0];
                        
                        // Calculate total budget for all bursts in this campaign
                        const totalBudget = plans.reduce((sum, plan) => 
                          sum + (plan.q1Budget + plan.q2Budget + plan.q3Budget + plan.q4Budget), 0);
                        
                        // Get unique media types for this campaign
                        const mediaTypes = [...new Set(plans.map(plan => plan.mediaSubType?.mediaType?.name).filter(Boolean))];
                        const mediaTypeDisplay = mediaTypes.join(', ') || 'Unknown';
                        
                        // Function to get color based on media type
                        const getColorForMediaType = (mediaTypeName: string) => {
                          if (['TV', 'Radio'].includes(mediaTypeName)) {
                            return 'bg-blue-600';
                          } else if (['Print', 'OOH'].includes(mediaTypeName)) {
                            return 'bg-green-500';
                          } else if (mediaTypeName.includes('Digital')) {
                            return 'bg-purple-500';
                          } else if (mediaTypeName.includes('Social')) {
                            return 'bg-pink-500';
                          }
                          return 'bg-gray-200';
                        };
                        
                        return (
                          <div key={key} className="grid grid-cols-[0.5fr_0.8fr_0.6fr_8fr] border-b hover:bg-gray-50">
                            <div className="py-2 px-3">{firstPlan.country?.name || 'Unknown'}</div>
                            <div className="py-2 px-3 font-medium">{firstPlan.campaign?.name || 'Unnamed Campaign'}</div>
                            <div className="py-2 px-3">€ {totalBudget.toLocaleString()}</div>
                            
                            {/* Multiple horizontal bars for campaign bursts */}
                            <div className="py-2 px-3 relative" style={{ minHeight: '40px' }}>
                              <div className="h-4 bg-gray-100 w-full rounded-md relative" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(100%/48 - 1px), rgba(0,0,0,0.03) calc(100%/48 - 1px), rgba(0,0,0,0.03) calc(100%/48))' }}>
                                {/* Render a bar for each burst/plan */}
                                {plans.map((plan, index) => {
                                  // Skip if no valid dates
                                  if (!plan.startDate || !plan.endDate) return null;
                                  
                                  const startDate = new Date(plan.startDate);
                                  const endDate = new Date(plan.endDate);
                                  
                                  // Skip if invalid dates
                                  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
                                  
                                  // Calculate more precise position based on full date
                                  const yearStart = new Date(startDate.getFullYear(), 0, 1);
                                  const yearEnd = new Date(startDate.getFullYear(), 11, 31);
                                  const yearDuration = yearEnd.getTime() - yearStart.getTime();
                                  
                                  // Calculate position as percentage of year
                                  const startPosition = (startDate.getTime() - yearStart.getTime()) / yearDuration;
                                  const endPosition = (endDate.getTime() - yearStart.getTime()) / yearDuration;
                                  
                                  // Calculate budget for this burst
                                  const burstBudget = plan.q1Budget + plan.q2Budget + plan.q3Budget + plan.q4Budget;
                                  
                                  // Get color for this specific burst based on its media type
                                  const burstMediaType = plan.mediaSubType?.mediaType?.name || '';
                                  const burstColor = getColorForMediaType(burstMediaType);
                                  
                                  return (
                                    <div 
                                      key={plan.id}
                                      className={`absolute top-0 h-4 ${burstColor} rounded-md border border-white/30`}
                                      title={`${burstMediaType} - Burst ${plan.burst || index + 1}: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} | Budget: €${burstBudget.toLocaleString()} | Media: ${burstMediaType}`}
                                      style={{
                                        left: `${startPosition * 100}%`,
                                        width: `${(endPosition - startPosition) * 100}%`,
                                        opacity: 0.8 + (index * 0.05) // Slight opacity variation for overlapping bursts
                                      }}
                                    ></div>
                                  );
                                })}
                                
                                {/* Week dividers - 48 weeks in a year (4 weeks × 12 months) */}
                                {Array.from({ length: 48 }).map((_, i) => {
                                  const isMonthBoundary = i % 4 === 0;
                                  return (
                                    <div 
                                      key={i} 
                                      className={`absolute top-0 h-6 border-l ${isMonthBoundary ? 'border-gray-400' : 'border-gray-200'}`} 
                                      style={{ left: `${(i / 48) * 100}%` }}
                                    >
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8 bg-white rounded-lg shadow">
                    No campaigns match the selected filters.
                  </div>
                )}
              </div>
            ) : (
              // Sufficiency Tab Content
              <div>
                <h2 className="text-xl font-semibold mb-6">Media Sufficiency Analysis</h2>
                
                {isLoadingReach ? (
                  <div className="flex items-center justify-center h-64">
                    <Spinner />
                  </div>
                ) : mediaSufficiencyReachData ? (
                  <>
                    {/* WOA Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg shadow p-4">
                        <div className="text-sm text-blue-600 mb-1">WOA(PM & FF)</div>
                        <div className="text-2xl font-semibold text-blue-800">{mediaSufficiencyReachData.summary.woaPmFf || 0}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg shadow p-4">
                        <div className="text-sm text-green-600 mb-1">WOA(Influencers Amplification)</div>
                        <div className="text-2xl font-semibold text-green-800">{mediaSufficiencyReachData.summary.woaInfluencersAmplification || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg shadow p-4">
                        <div className="text-sm text-purple-600 mb-1">WOA(Open TV)</div>
                        <div className="text-2xl font-semibold text-purple-800">{mediaSufficiencyReachData.summary.woaOpenTv || 0}</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg shadow p-4">
                        <div className="text-sm text-orange-600 mb-1">WOA(Paid TV)</div>
                        <div className="text-2xl font-semibold text-orange-800">{mediaSufficiencyReachData.summary.woaPaidTv || 0}</div>
                      </div>
                    </div>

                    {/* Main Layout - Left and Right Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                      {/* Left Section - Reach Charts */}
                      <div className="space-y-6">
                        {/* Combined Reach Chart */}
                        <div className="bg-white rounded-lg shadow p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Combined Reach by Campaign</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={mediaSufficiencyReachData.combinedReachData.slice(0, 8)}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="campaign" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  fontSize={12}
                                />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                  formatter={(value, name) => [`${value}%`, name]}
                                  labelFormatter={(label) => `Campaign: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="currentReach" fill="#1F4388" name="Current Reach" />
                                <Line 
                                  type="monotone" 
                                  dataKey="idealReach" 
                                  stroke="#ff6b6b" 
                                  strokeWidth={3}
                                  name="Ideal Reach"
                                  dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 5 }}
                                  activeDot={{ r: 7 }}
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Digital Reach Chart */}
                        <div className="bg-white rounded-lg shadow p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Digital Reach by Campaign</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={mediaSufficiencyReachData.digitalReachData.slice(0, 8)}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="campaign" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  fontSize={12}
                                />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                  formatter={(value, name) => [`${value}%`, name]}
                                  labelFormatter={(label) => `Campaign: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="currentReach" fill="#5E9FE0" name="Current Reach" />
                                <Line 
                                  type="monotone" 
                                  dataKey="idealReach" 
                                  stroke="#ff6b6b" 
                                  strokeWidth={3}
                                  name="Ideal Reach"
                                  dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 5 }}
                                  activeDot={{ r: 7 }}
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* TV Reach Chart */}
                        <div className="bg-white rounded-lg shadow p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">TV Reach by Campaign</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={mediaSufficiencyReachData.tvReachData.slice(0, 8)}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="campaign" 
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  fontSize={12}
                                />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                  formatter={(value, name) => [`${value}%`, name]}
                                  labelFormatter={(label) => `Campaign: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="currentReach" fill="#3E7DCD" name="Current Reach" />
                                <Line 
                                  type="monotone" 
                                  dataKey="idealReach" 
                                  stroke="#ff6b6b" 
                                  strokeWidth={3}
                                  name="Ideal Reach"
                                  dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 5 }}
                                  activeDot={{ r: 7 }}
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Data Tables */}
                      <div className="space-y-6">
                        {/* Combined Reach Table */}
                        <div className="bg-white rounded-lg shadow p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Combined Reach Analysis</h3>
                          <div className="h-64 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reach Abs</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {mediaSufficiencyReachData.combinedReachData.slice(0, 8).map((item, index) => {
                                  const gap = item.idealReach - item.currentReach;
                                  const checkStatus = Math.abs(gap) <= 4 ? 'Good' : gap > 4 ? 'Under' : 'Over';
                                  const checkClass = checkStatus === 'Good' ? 'bg-green-100 text-green-800' : 
                                                   checkStatus === 'Under' ? 'bg-red-100 text-red-800' : 
                                                   'bg-yellow-100 text-yellow-800';
                                  
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-2 py-2 text-xs text-gray-900 truncate max-w-[100px]" title={item.campaign}>
                                        {item.campaign}
                                      </td>
                                      <td className="px-2 py-2 text-xs">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${checkClass}`}>
                                          {checkStatus}
                                        </span>
                                      </td>
                                      <td className="px-2 py-2 text-xs text-gray-500">{item.idealReach.toFixed(1)}%</td>
                                      <td className="px-2 py-2 text-xs text-gray-900" title={`Reach Abs: ${item.reachAbs?.toLocaleString()}`}>
                                        {item.reachAbs ? item.reachAbs.toLocaleString() : 'N/A'}
                                      </td>
                                      <td className="px-2 py-2 text-xs text-gray-500">
                                        {item.potential ? item.potential.toLocaleString() : 'N/A'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Digital Reach Table */}
                        <div className="bg-white rounded-lg shadow p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Digital Reach Analysis</h3>
                          <div className="h-64 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reach Abs</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {mediaSufficiencyReachData.digitalReachData.slice(0, 8).map((item, index) => {
                                  const gap = item.idealReach - item.currentReach;
                                  const checkStatus = Math.abs(gap) <= 4 ? 'Good' : gap > 4 ? 'Under' : 'Over';
                                  const checkClass = checkStatus === 'Good' ? 'bg-green-100 text-green-800' : 
                                                   checkStatus === 'Under' ? 'bg-red-100 text-red-800' : 
                                                   'bg-yellow-100 text-yellow-800';
                                  
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-2 py-2 text-xs text-gray-900 truncate max-w-[100px]" title={item.campaign}>
                                        {item.campaign}
                                      </td>
                                      <td className="px-2 py-2 text-xs">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${checkClass}`}>
                                          {checkStatus}
                                        </span>
                                      </td>
                                      <td className="px-2 py-2 text-xs text-gray-500">{item.idealReach.toFixed(1)}%</td>
                                      <td className="px-2 py-2 text-xs text-gray-900" title={`Reach Abs: ${item.reachAbs?.toLocaleString()}`}>
                                        {item.reachAbs ? item.reachAbs.toLocaleString() : 'N/A'}
                                      </td>
                                      <td className="px-2 py-2 text-xs text-gray-500">
                                        {item.potential ? item.potential.toLocaleString() : 'N/A'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* TV Reach Table */}
                        <div className="bg-white rounded-lg shadow p-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">TV Reach Analysis</h3>
                          <div className="h-64 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reach Abs</th>
                                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {mediaSufficiencyReachData.tvReachData.slice(0, 8).map((item, index) => {
                                  const gap = item.idealReach - item.currentReach;
                                  const checkStatus = Math.abs(gap) <= 4 ? 'Good' : gap > 4 ? 'Under' : 'Over';
                                  const checkClass = checkStatus === 'Good' ? 'bg-green-100 text-green-800' : 
                                                   checkStatus === 'Under' ? 'bg-red-100 text-red-800' : 
                                                   'bg-yellow-100 text-yellow-800';
                                  
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-2 py-2 text-xs text-gray-900 truncate max-w-[100px]" title={item.campaign}>
                                        {item.campaign}
                                      </td>
                                      <td className="px-2 py-2 text-xs">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${checkClass}`}>
                                          {checkStatus}
                                        </span>
                                      </td>
                                      <td className="px-2 py-2 text-xs text-gray-500">{item.idealReach.toFixed(1)}%</td>
                                      <td className="px-2 py-2 text-xs text-gray-900" title={`Reach Abs: ${item.reachAbs?.toLocaleString()}`}>
                                        {item.reachAbs ? item.reachAbs.toLocaleString() : 'N/A'}
                                      </td>
                                      <td className="px-2 py-2 text-xs text-gray-500">
                                        {item.potential ? item.potential.toLocaleString() : 'N/A'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>



                  </>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center text-gray-500">
                      <p className="mb-2">No media sufficiency data available.</p>
                      <p className="text-sm">Upload reach planning data to see reach analysis charts.</p>
                    </div>
                  </div>
                )}
              </div>
            )
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
