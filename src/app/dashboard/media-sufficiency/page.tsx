'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart, LabelList
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
  accessibleCountries?: string[] | null;  // Countries the user has access to
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
    reachAbs?: number;
    potential?: number;
  }>;
  digitalReachData: Array<{
    campaign: string;
    country: string;
    category: string;
    currentReach: number;
    idealReach: number;
    gap: number;
    reachAbs?: number;
    potential?: number;
  }>;
  combinedReachData: Array<{
    campaign: string;
    country: string;
    category: string;
    currentReach: number;
    idealReach: number;
    gap: number;
    reachAbs?: number;
    potential?: number;
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
    rangeId?: number;
    range?: {
      id: number;
      name: string;
    };
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
  businessUnitId?: number;
  businessUnit?: {
    id: number;
    name: string;
  };
  category_id?: number;
  category?: {
    id: number;
    name: string;
    businessUnit?: {
      id: number;
      name: string;
    };
  };
  range_id?: number;
  range?: {
    id: number;
    name: string;
  };
  campaignArchetypeId?: number;
  campaignArchetype?: {
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
  janBudget?: number;
  febBudget?: number;
  marBudget?: number;
  aprBudget?: number;
  mayBudget?: number;
  junBudget?: number;
  julBudget?: number;
  augBudget?: number;
  sepBudget?: number;
  octBudget?: number;
  novBudget?: number;
  decBudget?: number;
  startDate?: string;
  endDate?: string;
  burst?: string;
}

export default function MediaSufficiencyDashboard() {
  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  
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
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRanges, setSelectedRanges] = useState<string[]>([]);
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState<string[]>([]);
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
  
  // State for campaigns list sorting
  const [campaignSortField, setCampaignSortField] = useState('totalBudget');
  const [campaignSortDirection, setCampaignSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedGamePlanCampaigns, setExpandedGamePlanCampaigns] = useState<Set<string>>(new Set());
  
  // State for all available filter options (from database)
  const [allCountries, setAllCountries] = useState<string[]>([]);
  const [allMediaTypes, setAllMediaTypes] = useState<string[]>([]);
  const [allBusinessUnits, setAllBusinessUnits] = useState<Array<{name: string, categories: Array<{id: number, name: string}>}>>([]);
  const [allRanges, setAllRanges] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  
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
      const response = await axios.get('/api/dashboard/media-sufficiency-reach', {
        headers: getAuthHeaders()
      });
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
        
        // Fetch aggregated dashboard data first
        const dashboardResponse = await axios.get('/api/dashboard/media-sufficiency', {
          headers: getAuthHeaders()
        });
        
        // Add lastUpdate field if not present
        if (dashboardResponse.data && dashboardResponse.data.summary && !dashboardResponse.data.summary.lastUpdate) {
          dashboardResponse.data.summary.lastUpdate = new Date().toISOString();
        }
        
        setGamePlanData(dashboardResponse.data);
        setFilteredData(dashboardResponse.data); // Initialize filtered data with all data
        
        // Countries will be extracted from actual game plans data
        // This happens after game plans are fetched (see below)
        // This ensures we only show countries that have actual data
        
        // Fetch other filter options (media types, business units, etc.)
        const headers = getAuthHeaders();
        
        // Note: Filter options are now extracted from actual game plans data
        // This ensures users only see filters for data that actually exists
        // Commenting out old API calls that fetched ALL possible values
        
        /* OLD CODE - Replaced with dynamic extraction from game plans
        // Fetch all media types
        const mediaTypesResponse = await axios.get('/api/media-types', { headers });
        const mediaTypes = mediaTypesResponse.data.map((mt: any) => mt.name).sort();
        setAllMediaTypes(mediaTypes);
        
        // Fetch all ranges
        const rangesResponse = await axios.get('/api/ranges', { headers });
        const ranges = rangesResponse.data.map((r: any) => r.name).sort();
        setAllRanges(ranges);
        
        // Fetch all business units with their categories
        const businessUnitsResponse = await axios.get('/api/business-units', { headers });
        const businessUnits = businessUnitsResponse.data;
        setAllBusinessUnits(businessUnits);
        
        // Extract all unique categories from business units
        const allCats = new Set<string>();
        businessUnits.forEach((bu: any) => {
          bu.categories.forEach((cat: any) => {
            allCats.add(cat.name);
          });
        });
        const categories = Array.from(allCats).sort();
        setAllCategories(categories);
        setFilteredCategories(categories); // Initially show all categories
        */
        
        try {
          // Fetch raw game plans data for the Campaign by Quarter table
          const gamePlansResponse = await axios.get('/api/admin/media-sufficiency/game-plans', {
            headers: getAuthHeaders()
          });
          
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
          
          // Extract unique filter options from actual game plans data
          // This ensures we only show filters for data that exists
          
          // Extract unique countries from game plans
          const uniqueCountries = Array.from(new Set(
            gamePlansWithDates
              .filter((plan: GamePlan) => plan.country?.name)
              .map((plan: GamePlan) => plan.country!.name)
          )).sort();
          
          // Extract unique media types from game plans
          const uniqueMediaTypes = Array.from(new Set(
            gamePlansWithDates
              .filter((plan: GamePlan) => plan.mediaSubType?.mediaType?.name)
              .map((plan: GamePlan) => plan.mediaSubType!.mediaType!.name)
          )).sort();
          
          // Extract unique ranges from game plans (through campaign)
          const uniqueRanges = Array.from(new Set(
            gamePlansWithDates
              .filter((plan: GamePlan) => plan.campaign?.range?.name)
              .map((plan: GamePlan) => plan.campaign!.range!.name)
          )).sort();
          
          // Extract unique categories from game plans
          const uniqueCategories = Array.from(new Set(
            gamePlansWithDates
              .filter((plan: GamePlan) => plan.category?.name)
              .map((plan: GamePlan) => plan.category!.name)
          )).sort();
          
          // Extract unique business units from game plans
          const uniqueBusinessUnits = new Map<string, Set<string>>();
          gamePlansWithDates.forEach((plan: GamePlan) => {
            const buName = plan.category?.businessUnit?.name || plan.businessUnit?.name;
            const categoryName = plan.category?.name;
            
            if (buName) {
              if (!uniqueBusinessUnits.has(buName)) {
                uniqueBusinessUnits.set(buName, new Set());
              }
              if (categoryName) {
                uniqueBusinessUnits.get(buName)!.add(categoryName);
              }
            }
          });
          
          // Convert business units map to array format
          const businessUnitsArray = Array.from(uniqueBusinessUnits.entries()).map(([name, categories]) => ({
            name,
            categories: Array.from(categories).map((catName, idx) => ({ id: idx, name: catName }))
          })).sort((a, b) => a.name.localeCompare(b.name));
          
          // Extract unique last update options from game plans
          const uniqueLastUpdates = Array.from(new Set(
            gamePlansWithDates
              .filter((plan: GamePlan) => plan.lastUpdate?.name)
              .map((plan: GamePlan) => plan.lastUpdate!.name)
          )).sort();
          
          // Set all filter options based on actual data
          setAllCountries(uniqueCountries);
          setAllMediaTypes(uniqueMediaTypes);
          setAllRanges(uniqueRanges);
          setAllCategories(uniqueCategories);
          setAllBusinessUnits(businessUnitsArray);
          
          // Set available update options
          const updateOptions = uniqueLastUpdates.map((name, index) => ({
            id: index + 1,
            name: String(name)
          }));
          setAvailableUpdateOptions(updateOptions);
          
          // Select the first financial cycle by default if none selected
          if (selectedLastUpdates.length === 0 && updateOptions.length > 0) {
            // Sort to get the most recent year (e.g., ABP2026 before ABP2025)
            const sortedOptions = [...updateOptions].sort((a, b) => {
              const yearA = parseInt(a.name.match(/\d{4}/)?.[0] || '0');
              const yearB = parseInt(b.name.match(/\d{4}/)?.[0] || '0');
              return yearB - yearA; // Descending order
            });
            if (sortedOptions[0]) {
              setSelectedLastUpdates([sortedOptions[0].name]);
            }
          }
          
          console.log('Filter options extracted from game plans:', {
            countries: uniqueCountries.length,
            mediaTypes: uniqueMediaTypes.length,
            ranges: uniqueRanges.length,
            categories: uniqueCategories.length,
            businessUnits: businessUnitsArray.length,
            lastUpdates: uniqueLastUpdates.length
          });
          
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

  // Handle range selection
  const toggleRange = (range: string) => {
    setSelectedRanges(prev => 
      prev.includes(range) 
        ? prev.filter(r => r !== range) 
        : [...prev, range]
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
    
    // Apply Business Unit filter
    if (selectedBusinessUnits.length > 0) {
      filteredPlans = filteredPlans.filter(plan => {
        // Check if the plan's category belongs to the selected business units
        const categoryBU = plan.category?.businessUnit?.name;
        const directBU = plan.businessUnit?.name;
        return (categoryBU && selectedBusinessUnits.includes(categoryBU)) ||
               (directBU && selectedBusinessUnits.includes(directBU));
      });
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.category?.name && selectedCategories.includes(plan.category.name)
      );
    }
    
    // Apply range filter (through campaign)
    if (selectedRanges.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.campaign?.range?.name && selectedRanges.includes(plan.campaign.range.name)
      );
    }
    
    // Apply Last Update filter
    if (selectedLastUpdates.length > 0) {
      filteredPlans = filteredPlans.filter(plan => 
        plan.lastUpdate?.name && selectedLastUpdates.includes(plan.lastUpdate.name)
      );
    }
    
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
          
          if (['TV', 'Radio', 'Print', 'OOH', 'Traditional'].includes(mediaType)) {
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
      if (['TV', 'Radio', 'Print', 'OOH', 'Traditional'].includes(mediaTypeName)) {
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
    setSelectedCountries([]);
    setSelectedRanges([]);
    setSelectedBusinessUnits([]);
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
    if (!gamePlanData || !gamePlans) return;
    
    // Start with all data
    let filtered = { ...gamePlanData };
    
    // Check if any filters are active
    const hasActiveFilters = selectedMediaTypes.length > 0 || selectedCountries.length > 0 || 
                            selectedBusinessUnits.length > 0 || selectedCategories.length > 0 ||
                            selectedLastUpdates.length > 0;
    
    if (hasActiveFilters) {
      // Apply all filters to get filtered game plans
      const filteredPlans = applyAllFilters(gamePlans);
      
      // Recalculate all aggregations from filtered plans
      const recalculatedBudgetByMediaType: Record<string, number> = {};
      const recalculatedBudgetByCountry: Record<string, number> = {};
      const recalculatedBudgetByCategory: Record<string, number> = {};
      const recalculatedBudgetByQuarter = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
      let totalFilteredBudget = 0;
      
      filteredPlans.forEach(plan => {
        const budget = plan.totalBudget || 0;
        totalFilteredBudget += budget;
        
        // Aggregate by media type
        if (plan.mediaSubType?.mediaType?.name) {
          const mediaTypeName = plan.mediaSubType.mediaType.name;
          recalculatedBudgetByMediaType[mediaTypeName] = (recalculatedBudgetByMediaType[mediaTypeName] || 0) + budget;
        }
        
        // Aggregate by country
        if (plan.country?.name) {
          const countryName = plan.country.name;
          recalculatedBudgetByCountry[countryName] = (recalculatedBudgetByCountry[countryName] || 0) + budget;
        }
        
        // Aggregate by category
        if (plan.category?.name) {
          const categoryName = plan.category.name;
          recalculatedBudgetByCategory[categoryName] = (recalculatedBudgetByCategory[categoryName] || 0) + budget;
        }
        
        // Aggregate by quarter (assuming Jan-Mar = Q1, Apr-Jun = Q2, Jul-Sep = Q3, Oct-Dec = Q4)
        recalculatedBudgetByQuarter.Q1 += (plan.janBudget || 0) + (plan.febBudget || 0) + (plan.marBudget || 0);
        recalculatedBudgetByQuarter.Q2 += (plan.aprBudget || 0) + (plan.mayBudget || 0) + (plan.junBudget || 0);
        recalculatedBudgetByQuarter.Q3 += (plan.julBudget || 0) + (plan.augBudget || 0) + (plan.sepBudget || 0);
        recalculatedBudgetByQuarter.Q4 += (plan.octBudget || 0) + (plan.novBudget || 0) + (plan.decBudget || 0);
      });
      
      // Update filtered data with recalculated values
      filtered.budgetByMediaType = recalculatedBudgetByMediaType;
      filtered.budgetByCountry = recalculatedBudgetByCountry;
      filtered.budgetByCategory = recalculatedBudgetByCategory;
      filtered.budgetByQuarter = recalculatedBudgetByQuarter;
      
      // Update summary
      filtered.summary = {
        ...filtered.summary,
        totalBudget: totalFilteredBudget,
        campaignCount: filteredPlans.length,
        mediaTypeCount: Object.keys(recalculatedBudgetByMediaType).length,
        countryCount: Object.keys(recalculatedBudgetByCountry).length,
        gamePlanCount: filteredPlans.length
      };
      
      // Log the filter being applied
      console.log('Active filters:', {
        mediaTypes: selectedMediaTypes,
        countries: selectedCountries,
        businessUnits: selectedBusinessUnits,
        categories: selectedCategories
      });
      console.log('Recalculated budgets:', {
        byMediaType: recalculatedBudgetByMediaType,
        total: totalFilteredBudget
      });
    } else {
      // No filters active, use original data
      filtered = { ...gamePlanData };
    }
    
    // Calculate category percentages based on filtered data
    const categoryBudget = filtered.budgetByCategory || {};
    const totalCategoryBudget = Object.values(categoryBudget).reduce((sum, budget) => sum + (budget as number), 0);
    const filteredBudgetByCategoryPercentage: Record<string, number> = {};
    
    Object.entries(categoryBudget).forEach(([category, budget]) => {
      filteredBudgetByCategoryPercentage[category] = totalCategoryBudget > 0 
        ? ((budget as number) / totalCategoryBudget) * 100 
        : 0;
    });
    
    filtered.budgetByCategoryPercentage = filteredBudgetByCategoryPercentage;
    
    // Update campaign distribution data
    const distributionData = Object.entries(filteredBudgetByCategoryPercentage)
      .map(([name, percentage], index) => {
        // Ensure percentage is a valid number and cap it at 100%
        const validPercentage = Math.min(Number(percentage) || 0, 100);
        
        return {
          name,
          value: validPercentage,
          absoluteBudget: categoryBudget[name],
          color: COLORS[index % COLORS.length]
        };
      })
      .sort((a, b) => b.value - a.value);
    
    setCampaignDistributionData(distributionData);
    
    // Update filtered data
    setFilteredData(filtered);
    
  // We need to include all filter dependencies from the beginning to avoid React errors
  }, [gamePlanData, gamePlans, selectedMediaTypes, selectedCountries, selectedBusinessUnits, selectedCategories, selectedLastUpdates]);
  
  // Update filtered categories when business units change
  useEffect(() => {
    if (selectedBusinessUnits.length === 0) {
      // Show all categories if no business unit is selected
      setFilteredCategories(allCategories);
    } else {
      // Filter categories based on selected business units
      const relevantCategories = new Set<string>();
      allBusinessUnits.forEach(bu => {
        if (selectedBusinessUnits.includes(bu.name)) {
          bu.categories.forEach(cat => {
            relevantCategories.add(cat.name);
          });
        }
      });
      setFilteredCategories(Array.from(relevantCategories).sort());
      
      // Remove any selected categories that are no longer relevant
      setSelectedCategories(prev => 
        prev.filter(cat => relevantCategories.has(cat))
      );
    }
  }, [selectedBusinessUnits, allBusinessUnits, allCategories]);

  // Get user data for navigation
  const getUserData = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          return JSON.parse(user);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
    return null;
  };

  const userData = getUserData();
  const userRole = userData?.role;
  const canAccessAdmin = userRole && ['admin', 'super_admin'].includes(userRole);

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="border-b border-gray-200 px-6 py-6 bg-white shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Intelligence Dashboard</h1>
            <p className="text-gray-600 mt-2 text-lg">Comprehensive analytics and insights for global media operations</p>
          </div>
          {canAccessAdmin && (
            <div>
              <button
                onClick={() => window.location.href = '/admin'}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center"
              >
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </button>
            </div>
          )}
        </div>
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
            {/* Filters reordered: Financial Cycle, Business Unit, Country, Category, then others */}
            
            {/* Last Update / Financial Cycle Filter */}
            {availableUpdateOptions.length > 0 && (
              <div className={`p-4 ${sidebarExpanded ? 'block' : 'hidden'}`}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Financial Cycle</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableUpdateOptions.map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`lastupdate-${option.id}`}
                        checked={selectedLastUpdates.includes(option.name)}
                        onChange={() => toggleLastUpdate(option.name)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`lastupdate-${option.id}`} className="ml-2 text-sm text-gray-700">
                        {option.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Business Unit Filter */}
            {allBusinessUnits.length > 0 && (
              <div className="p-4">
                <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-700 mb-2`}>Business Unit</h3>
                <div className="space-y-2">
                  {allBusinessUnits.map((bu) => (
                    <div key={bu.name} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`bu-${bu.name}`}
                        checked={selectedBusinessUnits.includes(bu.name)}
                        onChange={() => {
                          if (selectedBusinessUnits.includes(bu.name)) {
                            setSelectedBusinessUnits(prev => prev.filter(b => b !== bu.name));
                          } else {
                            setSelectedBusinessUnits(prev => [...prev, bu.name]);
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`bu-${bu.name}`} className={`ml-2 text-sm text-gray-700 ${sidebarExpanded ? 'block' : 'hidden'}`}>
                        {bu.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Country Filter */}
            {allCountries.length > 0 && (
              <div className="p-4">
                <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-700 mb-2`}>Country</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {allCountries.map(country => (
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
            
            {/* Category Filter */}
            {filteredCategories.length > 0 && (
              <div className={`p-4 ${sidebarExpanded ? 'block' : 'hidden'}`}>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Category 
                  {selectedBusinessUnits.length > 0 && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({selectedBusinessUnits.join(', ')})
                    </span>
                  )}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredCategories.map((category) => (
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
            
            {/* Media Type Filter */}
            {allMediaTypes.length > 0 && (
              <div className="p-4">
                <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-700 mb-2`}>Media Type</h3>
                <div className="space-y-2">
                  {allMediaTypes.map(mediaType => (
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
            
            {/* Range Filter */}
            {allRanges.length > 0 && (
              <div className="p-4">
                <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-700 mb-2`}>Range</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {allRanges.map(range => (
                    <div key={range} className="flex items-center">
                      <input
                        id={`range-${range}`}
                        type="checkbox"
                        checked={selectedRanges.includes(range)}
                        onChange={() => toggleRange(range)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label 
                        htmlFor={`range-${range}`} 
                        className={`${sidebarExpanded ? 'block' : 'hidden'} ml-2 text-sm text-gray-700`}
                      >
                        {range}
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
                Budget Overview
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

          {/* Tab Content */}
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
                    
                    if (['TV', 'Radio', 'Print', 'OOH', 'Traditional'].includes(mediaType)) {
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
                    {/* Total Working Media Card */}
                    <div className="rounded-lg shadow-lg p-4 flex items-center justify-between transform hover:scale-105 transition-transform duration-200" style={{ backgroundColor: '#1F4388' }}>
                      <div>
                        <div className="text-sm text-white/70 mb-1 font-medium">Total Working Media</div>
                        <div className="text-2xl font-bold text-white">€ {filteredData.summary.totalBudget.toLocaleString()}</div>
                      </div>
                      <div className="text-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Number of Campaigns Card */}
                    <div className="rounded-lg shadow-lg p-4 flex items-center justify-between transform hover:scale-105 transition-transform duration-200" style={{ backgroundColor: '#2A5599' }}>
                      <div>
                        <div className="text-sm text-white/70 mb-1 font-medium">Number of Campaigns</div>
                        <div className="text-2xl font-bold text-white">{filteredData.summary.campaignCount}</div>
                      </div>
                      <div className="text-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* TV Share Card */}
                    <div className="rounded-lg shadow-lg p-4 flex items-center justify-between transform hover:scale-105 transition-transform duration-200" style={{ backgroundColor: '#3666AA' }}>
                      <div>
                        <div className="text-sm text-white/70 mb-1 font-medium">TV Share</div>
                        <div className="text-2xl font-bold text-white">
                          {/* Make sure we always display a valid number */}
                          {isNaN(tvShare) ? '0' : Math.round(tvShare)}%
                        </div>
                      </div>
                      <div className="text-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Digital Share Card */}
                    <div className="rounded-lg shadow-lg p-4 flex items-center justify-between transform hover:scale-105 transition-transform duration-200" style={{ backgroundColor: '#4777BB' }}>
                      <div>
                        <div className="text-sm text-white/70 mb-1 font-medium">Digital Share</div>
                        <div className="text-2xl font-bold text-white">
                          {/* Make sure we always display a valid number */}
                          {isNaN(digitalShare) ? '0' : Math.round(digitalShare)}%
                        </div>
                      </div>
                      <div className="text-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Top Row: Two Charts on Left + Campaign by Quarter on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Side: Two Charts Stacked - 50% width */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Category Budget Allocation Chart */}
                  <div className="bg-white rounded-lg shadow p-4" ref={campaignChartRef}>
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">Category Budget Allocation</h2>
                    <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-200 to-transparent rounded-full"></div>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[220px]">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={campaignDistributionData}
                          margin={{ top: 15, right: 10, left: 10, bottom: 20 }}
                          onClick={handleCampaignBarClick}
                          className="cursor-pointer"
                          barGap={2}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            width={35}
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
                          <Bar 
                            dataKey="value" 
                            name="Budget %" 
                            radius={[6, 6, 0, 0]}
                            isAnimationActive={false}
                            onClick={(data) => handleCampaignBarClick(data)}
                            barSize={60}
                          >
                            <LabelList 
                              dataKey="value" 
                              position="top"
                              formatter={(value) => `${Math.round(value)}%`}
                              style={{ fill: '#374151', fontSize: '10px', fontWeight: '600' }}
                            />
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
                  
                  {/* Country Performance by Sub-Media Type */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="mb-3">
                      <h2 className="text-sm font-semibold text-gray-800 mb-2">Country Budget by Quarter</h2>
                      <div className="h-1 bg-gradient-to-r from-green-400 via-green-200 to-transparent rounded-full"></div>
                    </div>
                    {isLoading ? (
                      <div className="flex justify-center items-center h-[250px]">
                        <Spinner />
                      </div>
                    ) : gamePlans.length === 0 ? (
                      <div className="flex justify-center items-center h-[200px] text-gray-500">
                        <div className="text-center">
                          <p className="text-xs mb-1">No country data available.</p>
                          <p className="text-xs">Upload game plans to see breakdown.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto" style={{ maxHeight: '250px' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q3</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q4</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              // Get unique countries from filtered plans
                              let filteredPlans = [...gamePlans];
                              
                              // Apply filters
                              if (selectedMediaTypes.length > 0) {
                                filteredPlans = filteredPlans.filter(plan => 
                                  plan.mediaSubType?.mediaType && 
                                  selectedMediaTypes.includes(plan.mediaSubType.mediaType.name)
                                );
                              }
                              
                              if (selectedCountries.length > 0) {
                                filteredPlans = filteredPlans.filter(plan => 
                                  plan.country && 
                                  plan.country.name && 
                                  selectedCountries.includes(plan.country.name)
                                );
                              }
                              
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
                                .map(plan => plan.country!.name)))
                                .slice(0, 5); // Limit to top 5 countries for compact view
                              
                              // Process each country
                              return filteredCountries.map(country => {
                                // Get all game plans for this country
                                const countryPlans = filteredPlans.filter(plan => 
                                  plan.country && 
                                  plan.country.name && 
                                  plan.country.name.toLowerCase() === country.toLowerCase()
                                );
                                
                                // Calculate total budget for this country
                                const countryTotalBudget = countryPlans.reduce((sum, plan) => sum + (Number(plan.totalBudget) || 0), 0);
                                
                                // Calculate quarterly budgets from monthly budgets for this country
                                const countryQ1Budget = countryPlans.reduce((sum, plan) => 
                                  sum + (Number(plan.janBudget) || 0) + (Number(plan.febBudget) || 0) + (Number(plan.marBudget) || 0), 0);
                                const countryQ2Budget = countryPlans.reduce((sum, plan) => 
                                  sum + (Number(plan.aprBudget) || 0) + (Number(plan.mayBudget) || 0) + (Number(plan.junBudget) || 0), 0);
                                const countryQ3Budget = countryPlans.reduce((sum, plan) => 
                                  sum + (Number(plan.julBudget) || 0) + (Number(plan.augBudget) || 0) + (Number(plan.sepBudget) || 0), 0);
                                const countryQ4Budget = countryPlans.reduce((sum, plan) => 
                                  sum + (Number(plan.octBudget) || 0) + (Number(plan.novBudget) || 0) + (Number(plan.decBudget) || 0), 0);
                                
                                // Calculate quarterly percentages
                                const q1Percentage = countryTotalBudget > 0 ? Math.round((countryQ1Budget / countryTotalBudget) * 100) : 0;
                                const q2Percentage = countryTotalBudget > 0 ? Math.round((countryQ2Budget / countryTotalBudget) * 100) : 0;
                                const q3Percentage = countryTotalBudget > 0 ? Math.round((countryQ3Budget / countryTotalBudget) * 100) : 0;
                                const q4Percentage = countryTotalBudget > 0 ? Math.round((countryQ4Budget / countryTotalBudget) * 100) : 0;
                                
                                // Check if this country is expanded
                                const isExpanded = expandedCountries.includes(country);
                                
                                // Get categories for this country if expanded
                                const categoryBreakdown = isExpanded ? (() => {
                                  const categoryData: Record<string, {
                                    q1: number;
                                    q2: number;
                                    q3: number;
                                    q4: number;
                                    total: number;
                                  }> = {};
                                  
                                  countryPlans.forEach(plan => {
                                    const categoryName = plan.category?.name || 'Uncategorized';
                                    if (!categoryData[categoryName]) {
                                      categoryData[categoryName] = { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 };
                                    }
                                    categoryData[categoryName].total += Number(plan.totalBudget) || 0;
                                    categoryData[categoryName].q1 += (Number(plan.janBudget) || 0) + (Number(plan.febBudget) || 0) + (Number(plan.marBudget) || 0);
                                    categoryData[categoryName].q2 += (Number(plan.aprBudget) || 0) + (Number(plan.mayBudget) || 0) + (Number(plan.junBudget) || 0);
                                    categoryData[categoryName].q3 += (Number(plan.julBudget) || 0) + (Number(plan.augBudget) || 0) + (Number(plan.sepBudget) || 0);
                                    categoryData[categoryName].q4 += (Number(plan.octBudget) || 0) + (Number(plan.novBudget) || 0) + (Number(plan.decBudget) || 0);
                                  });
                                  
                                  return Object.entries(categoryData).map(([name, data]) => ({
                                    name,
                                    ...data,
                                    q1Pct: data.total > 0 ? Math.round((data.q1 / data.total) * 100) : 0,
                                    q2Pct: data.total > 0 ? Math.round((data.q2 / data.total) * 100) : 0,
                                    q3Pct: data.total > 0 ? Math.round((data.q3 / data.total) * 100) : 0,
                                    q4Pct: data.total > 0 ? Math.round((data.q4 / data.total) * 100) : 0
                                  })).sort((a, b) => b.total - a.total);
                                })() : [];
                                
                                // Function to get cell color based on percentage (same as Campaign by Quarter)
                                const getQuarterCellColor = (percentage: number) => {
                                  if (percentage === 0) return '#FFFFFF';
                                  if (percentage < 20) return '#F8FBFF';
                                  if (percentage < 40) return '#EBF3FF';
                                  if (percentage < 60) return '#D6E8FF';
                                  if (percentage < 80) return '#C2DDFF';
                                  if (percentage < 90) return '#A8CCFF';
                                  return '#8FB9FF'; // 90-100%
                                };
                                
                                const rows = [];
                                
                                // Country row
                                rows.push(
                                  <tr 
                                    key={`country-${country}`} 
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => toggleCountryExpansion(country)}
                                  >
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                      <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>
                                      {country}
                                    </td>
                                    <td 
                                      className="px-3 py-2 whitespace-nowrap text-sm font-medium text-center"
                                      style={{ 
                                        backgroundColor: getQuarterCellColor(q1Percentage),
                                        color: '#1F4388'
                                      }}
                                    >
                                      {q1Percentage}%
                                    </td>
                                    <td 
                                      className="px-3 py-2 whitespace-nowrap text-sm font-medium text-center"
                                      style={{ 
                                        backgroundColor: getQuarterCellColor(q2Percentage),
                                        color: '#1F4388'
                                      }}
                                    >
                                      {q2Percentage}%
                                    </td>
                                    <td 
                                      className="px-3 py-2 whitespace-nowrap text-sm font-medium text-center"
                                      style={{ 
                                        backgroundColor: getQuarterCellColor(q3Percentage),
                                        color: '#1F4388'
                                      }}
                                    >
                                      {q3Percentage}%
                                    </td>
                                    <td 
                                      className="px-3 py-2 whitespace-nowrap text-sm font-medium text-center"
                                      style={{ 
                                        backgroundColor: getQuarterCellColor(q4Percentage),
                                        color: '#1F4388'
                                      }}
                                    >
                                      {q4Percentage}%
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-semibold">€{countryTotalBudget.toLocaleString()}</td>
                                  </tr>
                                );
                                
                                // Category rows (only if expanded)
                                if (isExpanded) {
                                  categoryBreakdown.forEach(category => {
                                    rows.push(
                                      <tr key={`${country}-${category.name}`} className="bg-gray-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 pl-10">
                                          {category.name}
                                        </td>
                                        <td 
                                          className="px-3 py-2 whitespace-nowrap text-sm text-center"
                                          style={{ 
                                            backgroundColor: getQuarterCellColor(category.q1Pct),
                                            color: '#1F4388'
                                          }}
                                        >
                                          {category.q1Pct}%
                                        </td>
                                        <td 
                                          className="px-3 py-2 whitespace-nowrap text-sm text-center"
                                          style={{ 
                                            backgroundColor: getQuarterCellColor(category.q2Pct),
                                            color: '#1F4388'
                                          }}
                                        >
                                          {category.q2Pct}%
                                        </td>
                                        <td 
                                          className="px-3 py-2 whitespace-nowrap text-sm text-center"
                                          style={{ 
                                            backgroundColor: getQuarterCellColor(category.q3Pct),
                                            color: '#1F4388'
                                          }}
                                        >
                                          {category.q3Pct}%
                                        </td>
                                        <td 
                                          className="px-3 py-2 whitespace-nowrap text-sm text-center"
                                          style={{ 
                                            backgroundColor: getQuarterCellColor(category.q4Pct),
                                            color: '#1F4388'
                                          }}
                                        >
                                          {category.q4Pct}%
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">€{category.total.toLocaleString()}</td>
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
                </div>
                
                {/* Campaign by Quarter Table - 50% width */}
                <div className="lg:col-span-1 bg-white rounded-lg shadow pt-4 px-4 pb-1">
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">Campaign by Quarter</h2>
                    <div className="h-1 bg-gradient-to-r from-purple-400 via-purple-200 to-transparent rounded-full"></div>
                  </div>
                <div>
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
                  ) : (() => {
                    const handleSort = (field: string) => {
                      if (campaignSortField === field) {
                        setCampaignSortDirection(campaignSortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setCampaignSortField(field);
                        setCampaignSortDirection('desc');
                      }
                    };
                    
                    // Filter and sort campaigns
                    let filteredPlans = [...gamePlans];
                    
                    // Apply filters
                    if (selectedCountries.length > 0) {
                      filteredPlans = filteredPlans.filter(plan => 
                        plan.country && plan.country.name && selectedCountries.includes(plan.country.name)
                      );
                    }
                    if (selectedCategories.length > 0) {
                      filteredPlans = filteredPlans.filter(plan => 
                        plan.category && plan.category.name && selectedCategories.includes(plan.category.name)
                      );
                    }
                    
                    // Sort campaigns
                    const sortedPlans = filteredPlans.sort((a, b) => {
                      let aVal, bVal;
                      
                      if (campaignSortField === 'country') {
                        aVal = a.country?.name || '';
                        bVal = b.country?.name || '';
                      } else if (campaignSortField === 'campaign') {
                        aVal = a.campaign?.name || '';
                        bVal = b.campaign?.name || '';
                      } else if (campaignSortField === 'totalBudget') {
                        aVal = a.totalBudget || 0;
                        bVal = b.totalBudget || 0;
                      } else if (campaignSortField === 'q1') {
                        aVal = (a.janBudget || 0) + (a.febBudget || 0) + (a.marBudget || 0);
                        bVal = (b.janBudget || 0) + (b.febBudget || 0) + (b.marBudget || 0);
                      } else if (campaignSortField === 'q2') {
                        aVal = (a.aprBudget || 0) + (a.mayBudget || 0) + (a.junBudget || 0);
                        bVal = (b.aprBudget || 0) + (b.mayBudget || 0) + (b.junBudget || 0);
                      } else if (campaignSortField === 'q3') {
                        aVal = (a.julBudget || 0) + (a.augBudget || 0) + (a.sepBudget || 0);
                        bVal = (b.julBudget || 0) + (b.augBudget || 0) + (b.sepBudget || 0);
                      } else if (campaignSortField === 'q4') {
                        aVal = (a.octBudget || 0) + (a.novBudget || 0) + (a.decBudget || 0);
                        bVal = (b.octBudget || 0) + (b.novBudget || 0) + (b.decBudget || 0);
                      } else {
                        aVal = 0;
                        bVal = 0;
                      }
                      
                      if (campaignSortDirection === 'asc') {
                        return aVal > bVal ? 1 : -1;
                      }
                      return aVal < bVal ? 1 : -1;
                    });
                    
                    // Find min and max budget values for color scaling
                    const budgetValues = sortedPlans.map(p => p.totalBudget || 0);
                    const maxBudget = Math.max(...budgetValues, 1);
                    const minBudget = Math.min(...budgetValues, 0);
                    
                    // Function to get background color based on budget value
                    const getBudgetColor = (value: number) => {
                      const ratio = (value - minBudget) / (maxBudget - minBudget);
                      // Use Nivea blue shades from light to dark
                      if (ratio < 0.2) return '#E6F0FF';
                      if (ratio < 0.4) return '#B3D1FF';
                      if (ratio < 0.6) return '#6699DD';
                      if (ratio < 0.8) return '#4477BB';
                      return '#1F4388';
                    };
                    
                    // Function to get text color based on background
                    const getTextColor = (value: number) => {
                      const ratio = (value - minBudget) / (maxBudget - minBudget);
                      return ratio > 0.5 ? 'white' : '#1F4388';
                    };
                    
                    return (
                      <div className="overflow-x-auto" style={{ maxHeight: '420px' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th 
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('country')}
                              >
                                Country {campaignSortField === 'country' && (campaignSortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                              <th 
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('campaign')}
                              >
                                Campaign {campaignSortField === 'campaign' && (campaignSortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                              <th 
                                className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('totalBudget')}
                              >
                                Total {campaignSortField === 'totalBudget' && (campaignSortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                              <th 
                                className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('q1')}
                              >
                                Q1 % {campaignSortField === 'q1' && (campaignSortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                              <th 
                                className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('q2')}
                              >
                                Q2 % {campaignSortField === 'q2' && (campaignSortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                              <th 
                                className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('q3')}
                              >
                                Q3 % {campaignSortField === 'q3' && (campaignSortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                              <th 
                                className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('q4')}
                              >
                                Q4 % {campaignSortField === 'q4' && (campaignSortDirection === 'asc' ? '▲' : '▼')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortedPlans.slice(0, 20).map((plan, index) => {
                              // Calculate quarterly budgets from monthly data
                              const q1Budget = (plan.janBudget || 0) + (plan.febBudget || 0) + (plan.marBudget || 0);
                              const q2Budget = (plan.aprBudget || 0) + (plan.mayBudget || 0) + (plan.junBudget || 0);
                              const q3Budget = (plan.julBudget || 0) + (plan.augBudget || 0) + (plan.sepBudget || 0);
                              const q4Budget = (plan.octBudget || 0) + (plan.novBudget || 0) + (plan.decBudget || 0);
                              
                              // Calculate percentages
                              const q1Pct = plan.totalBudget > 0 ? Math.round((q1Budget / plan.totalBudget) * 100) : 0;
                              const q2Pct = plan.totalBudget > 0 ? Math.round((q2Budget / plan.totalBudget) * 100) : 0;
                              const q3Pct = plan.totalBudget > 0 ? Math.round((q3Budget / plan.totalBudget) * 100) : 0;
                              const q4Pct = plan.totalBudget > 0 ? Math.round((q4Budget / plan.totalBudget) * 100) : 0;
                              
                              // Function to get cell color based on percentage (0-100)
                              const getQuarterCellColor = (percentage: number) => {
                                // Use lighter Nivea blue shades for subtle coloring
                                if (percentage === 0) return '#FFFFFF';
                                if (percentage < 20) return '#F8FBFF';
                                if (percentage < 40) return '#EBF3FF';
                                if (percentage < 60) return '#D6E8FF';
                                if (percentage < 80) return '#C2DDFF';
                                if (percentage < 90) return '#A8CCFF';
                                return '#8FB9FF'; // 90-100%
                              };
                              
                              // Function to get text color - always dark blue for readability
                              const getQuarterTextColor = (percentage: number) => {
                                return '#1F4388';
                              };
                              
                              return (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {plan.country?.name || 'N/A'}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {plan.campaign?.name || 'N/A'}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900 text-right font-semibold">
                                    €{(plan.totalBudget || 0).toLocaleString()}
                                  </td>
                                  <td 
                                    className="px-4 py-2 text-sm text-center font-medium"
                                    style={{ 
                                      backgroundColor: getQuarterCellColor(q1Pct),
                                      color: getQuarterTextColor(q1Pct)
                                    }}
                                  >
                                    {q1Pct}%
                                  </td>
                                  <td 
                                    className="px-4 py-2 text-sm text-center font-medium"
                                    style={{ 
                                      backgroundColor: getQuarterCellColor(q2Pct),
                                      color: getQuarterTextColor(q2Pct)
                                    }}
                                  >
                                    {q2Pct}%
                                  </td>
                                  <td 
                                    className="px-4 py-2 text-sm text-center font-medium"
                                    style={{ 
                                      backgroundColor: getQuarterCellColor(q3Pct),
                                      color: getQuarterTextColor(q3Pct)
                                    }}
                                  >
                                    {q3Pct}%
                                  </td>
                                  <td 
                                    className="px-4 py-2 text-sm text-center font-medium"
                                    style={{ 
                                      backgroundColor: getQuarterCellColor(q4Pct),
                                      color: getQuarterTextColor(q4Pct)
                                    }}
                                  >
                                    {q4Pct}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Additional Charts - Vertical Stack */}
              <div className="space-y-6 mb-6">
                
                {/* Media Sub-Type vs Total WM */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">Media Sub-Type vs Total WM</h2>
                    <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-200 to-transparent rounded-full"></div>
                  </div>
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
                    <div className="overflow-x-auto" style={{ maxHeight: '350px' }}>
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
                              
                              // Return table headers for each sub-media type plus Total
                              return [
                                ...subMediaTypes.map(subMediaType => (
                                  <th 
                                    key={`header-${subMediaType}`}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                  >
                                    {subMediaType}
                                  </th>
                                )),
                                <th 
                                  key="header-total"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-bold"
                                >
                                  Total %
                                </th>
                              ];
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
                            
                            // The financial cycle filter is already applied to filteredPlans through selectedLastUpdates
                            // Calculate total budget for each country (already filtered by financial cycle)
                            const countryTotalBudgets: Record<string, number> = {};
                            countries.forEach(country => {
                              countryTotalBudgets[country] = filteredPlans
                                .filter(plan => plan.country && plan.country.name === country)
                                .reduce((sum, plan) => sum + (Number(plan.totalBudget) || 0), 0);
                            });
                            
                            // Calculate budget for each country and sub-media type (already filtered by financial cycle)
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
                            
                            // Generate table rows with totals
                            return countries.map(country => {
                              // Calculate the total percentage for this country
                              const rowTotal = subMediaTypes.reduce(
                                (sum, subMediaType) => sum + countryPerformance[country][subMediaType], 
                                0
                              );
                              
                              return (
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
                                  <td 
                                    className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                                      Math.abs(rowTotal - 100) < 0.5 ? 'text-green-600' : 'text-red-600'
                                    }`}
                                  >
                                    {rowTotal.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                  </div>
                </div>
                
                {/* Digital Sub-Type vs Total DWM */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">Digital Sub-Type vs Total DWM</h2>
                    <div className="h-1 bg-gradient-to-r from-teal-400 via-teal-200 to-transparent rounded-full"></div>
                  </div>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <Spinner />
                    </div>
                  ) : gamePlans.length === 0 ? (
                    <div className="flex justify-center items-center h-[200px] text-gray-500">
                      <div className="text-center">
                        <p className="mb-2">No digital media data available.</p>
                        <p className="text-sm">Upload game plans with digital media details to see sub-type breakdown.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto" style={{ maxHeight: '280px' }}>
                      <table className="min-w-full divide-y divide-gray-200">
                        {(() => {
                          // Filter game plans for selected financial cycle and digital media type only
                          let filteredPlans = [...gamePlans];
                          
                          // Apply last update (financial cycle) filter
                          if (selectedLastUpdates.length > 0) {
                            filteredPlans = filteredPlans.filter(plan => 
                              plan.lastUpdate && selectedLastUpdates.includes(plan.lastUpdate.name)
                            );
                          }
                          
                          // Filter for digital media type only
                          filteredPlans = filteredPlans.filter(plan => 
                            plan.mediaSubType?.mediaType?.name?.toLowerCase() === 'digital'
                          );
                          
                          // Apply country filter
                          if (selectedCountries.length > 0) {
                            filteredPlans = filteredPlans.filter(plan => 
                              plan.country && 
                              plan.country.name && 
                              selectedCountries.includes(plan.country.name)
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
                          
                          // Get unique digital sub-types
                          const digitalSubTypes = Array.from(new Set(
                            filteredPlans
                              .filter(plan => plan.mediaSubType?.name)
                              .map(plan => plan.mediaSubType!.name)
                          )).sort();
                          
                          // Get unique countries
                          const countries = Array.from(new Set(
                            filteredPlans
                              .filter(plan => plan.country?.name)
                              .map(plan => plan.country!.name)
                          )).sort();
                          
                          // Calculate digital budget by country and sub-type
                          const countryDigitalData: Record<string, {
                            totalDigital: number;
                            bySubType: Record<string, number>;
                            byQuarter: {
                              q1: Record<string, number>;
                              q2: Record<string, number>;
                              q3: Record<string, number>;
                              q4: Record<string, number>;
                            };
                          }> = {};
                          
                          countries.forEach(country => {
                            countryDigitalData[country] = {
                              totalDigital: 0,
                              bySubType: {},
                              byQuarter: {
                                q1: {},
                                q2: {},
                                q3: {},
                                q4: {}
                              }
                            };
                            
                            digitalSubTypes.forEach(subType => {
                              countryDigitalData[country].bySubType[subType] = 0;
                              countryDigitalData[country].byQuarter.q1[subType] = 0;
                              countryDigitalData[country].byQuarter.q2[subType] = 0;
                              countryDigitalData[country].byQuarter.q3[subType] = 0;
                              countryDigitalData[country].byQuarter.q4[subType] = 0;
                            });
                          });
                          
                          // Calculate budgets
                          filteredPlans.forEach(plan => {
                            const country = plan.country?.name;
                            const subType = plan.mediaSubType?.name;
                            
                            if (!country || !subType) return;
                            
                            const budget = plan.totalBudget || 0;
                            const q1Budget = (plan.janBudget || 0) + (plan.febBudget || 0) + (plan.marBudget || 0);
                            const q2Budget = (plan.aprBudget || 0) + (plan.mayBudget || 0) + (plan.junBudget || 0);
                            const q3Budget = (plan.julBudget || 0) + (plan.augBudget || 0) + (plan.sepBudget || 0);
                            const q4Budget = (plan.octBudget || 0) + (plan.novBudget || 0) + (plan.decBudget || 0);
                            
                            countryDigitalData[country].totalDigital += budget;
                            countryDigitalData[country].bySubType[subType] += budget;
                            countryDigitalData[country].byQuarter.q1[subType] += q1Budget;
                            countryDigitalData[country].byQuarter.q2[subType] += q2Budget;
                            countryDigitalData[country].byQuarter.q3[subType] += q3Budget;
                            countryDigitalData[country].byQuarter.q4[subType] += q4Budget;
                          });
                          
                          // Function to get cell color based on percentage
                          const getQuarterCellColor = (percentage: number) => {
                            if (percentage === 0) return '#FFFFFF';
                            if (percentage < 20) return '#F8FBFF';
                            if (percentage < 40) return '#EBF3FF';
                            if (percentage < 60) return '#D6E8FF';
                            if (percentage < 80) return '#C2DDFF';
                            if (percentage < 90) return '#A8CCFF';
                            return '#8FB9FF'; // 90-100%
                          };
                          
                          if (digitalSubTypes.length === 0 || countries.length === 0) {
                            return (
                              <tbody className="bg-white">
                                <tr>
                                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                                    No digital media data available for the selected filters.
                                  </td>
                                </tr>
                              </tbody>
                            );
                          }
                          
                          return (
                            <>
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total DWM</th>
                                  {digitalSubTypes.map(subType => (
                                    <th key={subType} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      {subType}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {countries.map((country, countryIndex) => {
                                  const countryData = countryDigitalData[country];
                                  const totalDigital = countryData.totalDigital;
                                  
                                  if (totalDigital === 0) return null;
                                  
                                  return (
                                    <tr key={country} className={countryIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                        {country}
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                        € {totalDigital.toLocaleString()}
                                      </td>
                                      {digitalSubTypes.map(subType => {
                                        const subTypeBudget = countryData.bySubType[subType];
                                        const percentage = totalDigital > 0 ? (subTypeBudget / totalDigital) * 100 : 0;
                                        
                                        return (
                                          <td 
                                            key={subType} 
                                            className="px-3 py-2 whitespace-nowrap text-xs text-gray-900"
                                            style={{ backgroundColor: getQuarterCellColor(percentage) }}
                                          >
                                            {percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                                
                                {/* Total Row */}
                                {countries.length > 0 && (() => {
                                  const totalOverall = countries.reduce((sum, country) => 
                                    sum + countryDigitalData[country].totalDigital, 0
                                  );
                                  
                                  const totalBySubType: Record<string, number> = {};
                                  digitalSubTypes.forEach(subType => {
                                    totalBySubType[subType] = countries.reduce((sum, country) => 
                                      sum + countryDigitalData[country].bySubType[subType], 0
                                    );
                                  });
                                  
                                  return (
                                    <tr className="bg-gray-100 font-semibold">
                                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                        Total
                                      </td>
                                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                        € {totalOverall.toLocaleString()}
                                      </td>
                                      {digitalSubTypes.map(subType => {
                                        const percentage = totalOverall > 0 ? (totalBySubType[subType] / totalOverall) * 100 : 0;
                                        return (
                                          <td key={subType} className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                            {percentage > 0 ? `${percentage.toFixed(1)}%` : '-'}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })()}
                              </tbody>
                            </>
                          );
                        })()}
                      </table>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bottom: Budget Allocation by Campaign Archetype */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-gray-800 mb-2">Budget Allocation by Campaign Archetype</h2>
                  <div className="h-1 bg-gradient-to-r from-indigo-400 via-indigo-200 to-transparent rounded-full"></div>
                </div>
                <div>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-[200px]">
                      <Spinner />
                    </div>
                  ) : gamePlans.length === 0 ? (
                    <div className="flex justify-center items-center h-[200px] text-gray-500">
                      <div className="text-center">
                        <p className="mb-2">No campaign archetype data available.</p>
                        <p className="text-sm">Campaign archetypes will be displayed when available in game plans.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto" style={{ maxHeight: '350px' }}>
                      <table className="min-w-full divide-y divide-gray-200">
                        {(() => {
                          // Filter game plans based on selected filters
                          let filteredPlans = [...gamePlans];
                          
                          // Apply last update (financial cycle) filter
                          if (selectedLastUpdates.length > 0) {
                            filteredPlans = filteredPlans.filter(plan => 
                              plan.lastUpdate && selectedLastUpdates.includes(plan.lastUpdate.name)
                            );
                          }
                          
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
                          
                          // Apply category filter
                          if (selectedCategories.length > 0) {
                            filteredPlans = filteredPlans.filter(plan => 
                              plan.category && 
                              plan.category.name && 
                              selectedCategories.includes(plan.category.name)
                            );
                          }
                          
                          // Calculate budget by campaign archetype
                          const archetypeData: Record<string, {
                            total: number;
                            byCountry: Record<string, number>;
                            byQuarter: { q1: number; q2: number; q3: number; q4: number };
                          }> = {};
                          
                          let totalBudgetOverall = 0;
                          
                          filteredPlans.forEach(plan => {
                            const archetypeName = plan.campaignArchetype?.name || 'Unassigned';
                            const countryName = plan.country?.name || 'Unknown';
                            const budget = plan.totalBudget || 0;
                            
                            totalBudgetOverall += budget;
                            
                            if (!archetypeData[archetypeName]) {
                              archetypeData[archetypeName] = {
                                total: 0,
                                byCountry: {},
                                byQuarter: { q1: 0, q2: 0, q3: 0, q4: 0 }
                              };
                            }
                            
                            archetypeData[archetypeName].total += budget;
                            archetypeData[archetypeName].byCountry[countryName] = 
                              (archetypeData[archetypeName].byCountry[countryName] || 0) + budget;
                            
                            // Add quarterly budgets
                            archetypeData[archetypeName].byQuarter.q1 += 
                              (plan.janBudget || 0) + (plan.febBudget || 0) + (plan.marBudget || 0);
                            archetypeData[archetypeName].byQuarter.q2 += 
                              (plan.aprBudget || 0) + (plan.mayBudget || 0) + (plan.junBudget || 0);
                            archetypeData[archetypeName].byQuarter.q3 += 
                              (plan.julBudget || 0) + (plan.augBudget || 0) + (plan.sepBudget || 0);
                            archetypeData[archetypeName].byQuarter.q4 += 
                              (plan.octBudget || 0) + (plan.novBudget || 0) + (plan.decBudget || 0);
                          });
                          
                          // Sort archetypes by total budget
                          const sortedArchetypes = Object.entries(archetypeData)
                            .sort((a, b) => b[1].total - a[1].total);
                          
                          // Function to get cell color based on percentage
                          const getPercentageCellColor = (percentage: number) => {
                            if (percentage === 0) return '#FFFFFF';
                            if (percentage < 10) return '#F8FBFF';
                            if (percentage < 20) return '#EBF3FF';
                            if (percentage < 30) return '#D6E8FF';
                            if (percentage < 40) return '#C2DDFF';
                            if (percentage < 50) return '#A8CCFF';
                            return '#8FB9FF'; // 50%+
                          };
                          
                          if (sortedArchetypes.length === 0) {
                            return (
                              <tbody className="bg-white">
                                <tr>
                                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                    No campaign archetype data available for the selected filters.
                                  </td>
                                </tr>
                              </tbody>
                            );
                          }
                          
                          return (
                            <>
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign Archetype</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Budget</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1 %</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2 %</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q3 %</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q4 %</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sortedArchetypes.map(([archetype, data], index) => {
                                  const percentageOfTotal = totalBudgetOverall > 0 
                                    ? (data.total / totalBudgetOverall) * 100 
                                    : 0;
                                  
                                  const q1Percentage = data.total > 0 
                                    ? (data.byQuarter.q1 / data.total) * 100 
                                    : 0;
                                  const q2Percentage = data.total > 0 
                                    ? (data.byQuarter.q2 / data.total) * 100 
                                    : 0;
                                  const q3Percentage = data.total > 0 
                                    ? (data.byQuarter.q3 / data.total) * 100 
                                    : 0;
                                  const q4Percentage = data.total > 0 
                                    ? (data.byQuarter.q4 / data.total) * 100 
                                    : 0;
                                  
                                  return (
                                    <tr key={archetype} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                        {archetype}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                                        € {data.total.toLocaleString()}
                                      </td>
                                      <td 
                                        className="px-4 py-2 whitespace-nowrap text-xs text-gray-900"
                                        style={{ backgroundColor: getPercentageCellColor(percentageOfTotal) }}
                                      >
                                        {percentageOfTotal.toFixed(1)}%
                                      </td>
                                      <td 
                                        className="px-4 py-2 whitespace-nowrap text-xs text-gray-900"
                                        style={{ backgroundColor: getPercentageCellColor(q1Percentage) }}
                                      >
                                        {q1Percentage > 0 ? `${q1Percentage.toFixed(1)}%` : '-'}
                                      </td>
                                      <td 
                                        className="px-4 py-2 whitespace-nowrap text-xs text-gray-900"
                                        style={{ backgroundColor: getPercentageCellColor(q2Percentage) }}
                                      >
                                        {q2Percentage > 0 ? `${q2Percentage.toFixed(1)}%` : '-'}
                                      </td>
                                      <td 
                                        className="px-4 py-2 whitespace-nowrap text-xs text-gray-900"
                                        style={{ backgroundColor: getPercentageCellColor(q3Percentage) }}
                                      >
                                        {q3Percentage > 0 ? `${q3Percentage.toFixed(1)}%` : '-'}
                                      </td>
                                      <td 
                                        className="px-4 py-2 whitespace-nowrap text-xs text-gray-900"
                                        style={{ backgroundColor: getPercentageCellColor(q4Percentage) }}
                                      >
                                        {q4Percentage > 0 ? `${q4Percentage.toFixed(1)}%` : '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                                
                                {/* Total Row */}
                                <tr className="bg-gray-100 font-semibold">
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                                    Total
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                                    € {totalBudgetOverall.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                                    100.0%
                                  </td>
                                  <td colSpan={4} className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                    -
                                  </td>
                                </tr>
                              </tbody>
                            </>
                          );
                        })()}
                      </table>
                    </div>
                  )}
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
                    <div className="text-xl font-bold">€ {applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.totalBudget || 0), 0).toLocaleString()}</div>
                    <div className="text-xs font-medium">Total Budget</div>
                  </div>
                  
                  {/* Q1 Card */}
                  <div className="bg-blue-700 text-white p-2 rounded-md flex flex-row items-center justify-center gap-2 flex-1">
                    <div className="text-lg font-bold">
                      {(() => {
                        // Calculate Q1 budget based on campaigns running in Q1 (Jan-Mar)
                        const q1Total = applyAllFilters(gamePlans).reduce((acc, plan) => {
                          if (!plan.startDate || !plan.endDate) return acc;
                          const start = new Date(plan.startDate);
                          const end = new Date(plan.endDate);
                          // Check if campaign runs in Q1 (Jan 1 - Mar 31)
                          const q1Start = new Date(start.getFullYear(), 0, 1);
                          const q1End = new Date(start.getFullYear(), 2, 31);
                          if (end >= q1Start && start <= q1End) {
                            // Campaign runs in Q1, add its budget (proportionally if it spans multiple quarters)
                            return acc + (plan.totalBudget || 0);
                          }
                          return acc;
                        }, 0);
                        const totalBudget = applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.totalBudget || 0), 0);
                        return totalBudget > 0 ? Math.round((q1Total / totalBudget) * 100) : 0;
                      })()}%
                    </div>
                    <div className="text-xs font-medium">Q1</div>
                  </div>
                  
                  {/* Q2 Card */}
                  <div className="bg-blue-600 text-white p-2 rounded-md flex flex-row items-center justify-center gap-2 flex-1">
                    <div className="text-lg font-bold">
                      {(() => {
                        // Calculate Q2 budget based on campaigns running in Q2 (Apr-Jun)
                        const q2Total = applyAllFilters(gamePlans).reduce((acc, plan) => {
                          if (!plan.startDate || !plan.endDate) return acc;
                          const start = new Date(plan.startDate);
                          const end = new Date(plan.endDate);
                          // Check if campaign runs in Q2 (Apr 1 - Jun 30)
                          const q2Start = new Date(start.getFullYear(), 3, 1);
                          const q2End = new Date(start.getFullYear(), 5, 30);
                          if (end >= q2Start && start <= q2End) {
                            // Campaign runs in Q2, add its budget
                            return acc + (plan.totalBudget || 0);
                          }
                          return acc;
                        }, 0);
                        const totalBudget = applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.totalBudget || 0), 0);
                        return totalBudget > 0 ? Math.round((q2Total / totalBudget) * 100) : 0;
                      })()}%
                    </div>
                    <div className="text-xs font-medium">Q2</div>
                  </div>
                  
                  {/* Q3 Card */}
                  <div className="bg-blue-500 text-white p-2 rounded-md flex flex-row items-center justify-center gap-2 flex-1">
                    <div className="text-lg font-bold">
                      {(() => {
                        // Calculate Q3 budget based on campaigns running in Q3 (Jul-Sep)
                        const q3Total = applyAllFilters(gamePlans).reduce((acc, plan) => {
                          if (!plan.startDate || !plan.endDate) return acc;
                          const start = new Date(plan.startDate);
                          const end = new Date(plan.endDate);
                          // Check if campaign runs in Q3 (Jul 1 - Sep 30)
                          const q3Start = new Date(start.getFullYear(), 6, 1);
                          const q3End = new Date(start.getFullYear(), 8, 30);
                          if (end >= q3Start && start <= q3End) {
                            // Campaign runs in Q3, add its budget
                            return acc + (plan.totalBudget || 0);
                          }
                          return acc;
                        }, 0);
                        const totalBudget = applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.totalBudget || 0), 0);
                        return totalBudget > 0 ? Math.round((q3Total / totalBudget) * 100) : 0;
                      })()}%
                    </div>
                    <div className="text-xs font-medium">Q3</div>
                  </div>
                  
                  {/* Q4 Card */}
                  <div className="bg-blue-400 text-white p-2 rounded-md flex flex-row items-center justify-center gap-2 flex-1">
                    <div className="text-lg font-bold">
                      {(() => {
                        // Calculate Q4 budget based on campaigns running in Q4 (Oct-Dec)
                        const q4Total = applyAllFilters(gamePlans).reduce((acc, plan) => {
                          if (!plan.startDate || !plan.endDate) return acc;
                          const start = new Date(plan.startDate);
                          const end = new Date(plan.endDate);
                          // Check if campaign runs in Q4 (Oct 1 - Dec 31)
                          const q4Start = new Date(start.getFullYear(), 9, 1);
                          const q4End = new Date(start.getFullYear(), 11, 31);
                          if (end >= q4Start && start <= q4End) {
                            // Campaign runs in Q4, add its budget
                            return acc + (plan.totalBudget || 0);
                          }
                          return acc;
                        }, 0);
                        const totalBudget = applyAllFilters(gamePlans).reduce((acc, plan) => acc + (plan.totalBudget || 0), 0);
                        return totalBudget > 0 ? Math.round((q4Total / totalBudget) * 100) : 0;
                      })()}%
                    </div>
                    <div className="text-xs font-medium">Q4</div>
                  </div>
                </div>
                
                {/* Campaign Table */}
                {applyAllFilters(gamePlans).length > 0 ? (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[0.5fr_0.8fr_0.6fr_8fr] bg-gray-50 border-b sticky top-0 z-10">
                      <div className="py-1.5 px-3 text-xs font-semibold text-gray-700">Country</div>
                      <div className="py-1.5 px-3 text-xs font-semibold text-gray-700">Campaign</div>
                      <div className="py-1.5 px-3 text-xs font-semibold text-gray-700">Budget</div>
                      <div className="py-1.5 px-3 text-xs font-semibold text-gray-700">Timeline</div>
                    </div>
                    {/* Month markers with week subdivisions */}
                    <div className="grid grid-cols-[0.5fr_0.8fr_0.6fr_8fr] border-b">
                      <div className="col-span-3"></div>
                      <div className="py-1 px-3">
                        <div className="grid grid-cols-12 gap-0">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                            <div key={month} className="border-r border-gray-200 last:border-r-0">
                              <div className="text-[10px] text-gray-600 font-medium text-center py-0.5 bg-gray-50">{month}</div>
                              <div className="grid grid-cols-4 gap-0">
                                {['W1', 'W2', 'W3', 'W4'].map((week) => (
                                  <div key={week} className="text-[9px] text-gray-400 text-center py-0.5 border-r border-gray-100 last:border-r-0">
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
                        
                        // Calculate total budget for all bursts in this campaign using totalBudget field
                        const totalBudget = plans.reduce((sum, plan) => 
                          sum + (plan.totalBudget || 0), 0);
                        
                        // Get unique media types for this campaign
                        const mediaTypes = [...new Set(plans.map(plan => plan.mediaSubType?.mediaType?.name).filter(Boolean))];
                        const mediaTypeDisplay = mediaTypes.join(', ') || 'Unknown';
                        
                        // Function to get color based on category
                        const getColorForCategory = (categoryName: string) => {
                          const colors = [
                            'bg-blue-600',
                            'bg-green-600',
                            'bg-purple-600',
                            'bg-pink-600',
                            'bg-yellow-600',
                            'bg-indigo-600',
                            'bg-red-600',
                            'bg-teal-600'
                          ];
                          
                          // Create a simple hash based on category name to consistently assign colors
                          let hash = 0;
                          for (let i = 0; i < categoryName.length; i++) {
                            hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
                          }
                          return colors[Math.abs(hash) % colors.length];
                        };
                        
                        const isExpanded = expandedGamePlanCampaigns.has(key);
                        const toggleExpanded = () => {
                          const newExpanded = new Set(expandedGamePlanCampaigns);
                          if (isExpanded) {
                            newExpanded.delete(key);
                          } else {
                            newExpanded.add(key);
                          }
                          setExpandedGamePlanCampaigns(newExpanded);
                        };
                        
                        return (
                          <React.Fragment key={key}>
                            <div className="grid grid-cols-[0.5fr_0.8fr_0.6fr_8fr] border-b hover:bg-gray-50">
                              <div className="py-1.5 px-3 text-xs text-gray-600">{firstPlan.country?.name || 'Unknown'}</div>
                              <div className="py-1.5 px-3 text-xs font-medium text-gray-800 flex items-center">
                                <button
                                  onClick={toggleExpanded}
                                  className="mr-1 text-gray-400 hover:text-gray-600"
                                >
                                  {isExpanded ? '▼' : '▶'}
                                </button>
                                {firstPlan.campaign?.name || 'Unnamed Campaign'}
                              </div>
                              <div className="py-1.5 px-3 text-xs text-gray-700">€ {totalBudget.toLocaleString()}</div>
                            
                            {/* Multiple horizontal bars for campaign bursts */}
                            <div className="py-1.5 px-3 relative" style={{ minHeight: '40px' }}>
                              <div className="h-5 bg-gray-100 w-full rounded-sm relative" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(100%/48 - 1px), rgba(0,0,0,0.03) calc(100%/48 - 1px), rgba(0,0,0,0.03) calc(100%/48))' }}>
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
                                  const burstBudget = plan.totalBudget || 0;
                                  
                                  // Get color for this specific burst based on its category
                                  const burstCategory = plan.category?.name || 'Unknown';
                                  const burstColor = getColorForCategory(burstCategory);
                                  const burstMediaType = plan.mediaSubType?.mediaType?.name || '';
                                  
                                  return (
                                    <div 
                                      key={plan.id}
                                      className={`absolute top-0 h-5 ${burstColor} rounded-sm border border-white/30`}
                                      title={`${burstCategory} - Burst ${plan.burst || index + 1}: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} | Budget: €${burstBudget.toLocaleString()} | Media: ${burstMediaType}`}
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
                                      className={`absolute top-0 h-5 border-l ${isMonthBoundary ? 'border-gray-400' : 'border-gray-200'}`} 
                                      style={{ left: `${(i / 48) * 100}%` }}
                                    >
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded section showing media subtypes */}
                          {isExpanded && (
                            <div className="bg-gray-50 border-b">
                              {(() => {
                                // Group plans by media subtype and keep individual plan data
                                const bySubType: Record<string, GamePlan[]> = {};
                                plans.forEach(plan => {
                                  const subTypeName = plan.mediaSubType?.name || 'Unknown';
                                  if (!bySubType[subTypeName]) {
                                    bySubType[subTypeName] = [];
                                  }
                                  bySubType[subTypeName].push(plan);
                                });
                                
                                return Object.entries(bySubType).map(([subType, subTypePlans]) => {
                                  const totalSubTypeBudget = subTypePlans.reduce((sum, p) => sum + (p.totalBudget || 0), 0);
                                  const mediaTypeName = subTypePlans[0]?.mediaSubType?.mediaType?.name || 'Unknown';
                                  
                                  return (
                                    <div key={subType} className="grid grid-cols-[0.5fr_0.8fr_0.6fr_8fr] py-1 text-xs">
                                      <div className="text-gray-500"></div>
                                      <div className="text-gray-600 pl-8">↳ {subType}</div>
                                      <div className="text-gray-600 px-3">€ {totalSubTypeBudget.toLocaleString()}</div>
                                      
                                      {/* Timeline bars for this subtype */}
                                      <div className="px-3 relative" style={{ minHeight: '25px' }}>
                                        <div className="h-3 bg-gray-50 w-full rounded-sm relative" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(100%/48 - 1px), rgba(0,0,0,0.02) calc(100%/48 - 1px), rgba(0,0,0,0.02) calc(100%/48))' }}>
                                          {subTypePlans.map((plan, index) => {
                                            if (!plan.startDate || !plan.endDate) return null;
                                            
                                            const startDate = new Date(plan.startDate);
                                            const endDate = new Date(plan.endDate);
                                            
                                            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
                                            
                                            // Ensure we handle dates that might span across years
                                            const year = startDate.getFullYear();
                                            const yearStart = new Date(year, 0, 1);
                                            const yearEnd = new Date(year, 11, 31, 23, 59, 59);
                                            const yearDuration = yearEnd.getTime() - yearStart.getTime();
                                            
                                            // Calculate positions more precisely
                                            const startPosition = Math.max(0, Math.min(1, (startDate.getTime() - yearStart.getTime()) / yearDuration));
                                            const endPosition = Math.max(0, Math.min(1, (endDate.getTime() - yearStart.getTime()) / yearDuration));
                                            
                                            // Ensure minimum width for visibility
                                            const width = Math.max(0.5, (endPosition - startPosition) * 100);
                                            
                                            const burstBudget = plan.totalBudget || 0;
                                            const categoryName = plan.category?.name || 'Unknown';
                                            const burstColor = getColorForCategory(categoryName);
                                            
                                            // Add burst number to distinguish multiple bursts
                                            const burstNum = plan.burst || index + 1;
                                            
                                            return (
                                              <div 
                                                key={`${plan.id}-${index}`}
                                                className={`absolute top-0 h-3 ${burstColor} rounded-sm border border-white/50`}
                                                title={`${subType} - Burst ${burstNum}: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} | Budget: €${burstBudget.toLocaleString()} | Duration: ${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`}
                                                style={{
                                                  left: `${startPosition * 100}%`,
                                                  width: `${width}%`,
                                                  zIndex: index + 1,
                                                  opacity: 0.7 + (index * 0.1) // Vary opacity for multiple bursts
                                                }}
                                              ></div>
                                            );
                                          })}
                                          
                                          {/* Lighter week dividers for subtype rows */}
                                          {Array.from({ length: 48 }).map((_, i) => {
                                            const isMonthBoundary = i % 4 === 0;
                                            return (
                                              <div 
                                                key={i} 
                                                className={`absolute top-0 h-3 border-l ${isMonthBoundary ? 'border-gray-300' : 'border-gray-200'} opacity-50`} 
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
                          )}
                          </React.Fragment>
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
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg shadow p-4">
                        <div className="text-sm text-blue-600 mb-1">Campaigns</div>
                        <div className="text-2xl font-semibold text-blue-800">{mediaSufficiencyReachData.summary.campaigns || 0}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg shadow p-4">
                        <div className="text-sm text-green-600 mb-1">Weeks On Air (WOA)</div>
                        <div className="text-2xl font-semibold text-green-800">{mediaSufficiencyReachData.summary.totalWoa || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg shadow p-4">
                        <div className="text-sm text-purple-600 mb-1">Weeks Off Air</div>
                        <div className="text-2xl font-semibold text-purple-800">{mediaSufficiencyReachData.summary.totalWoff || 0}</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg shadow p-4">
                        <div className="text-sm text-orange-600 mb-1">Total Weeks</div>
                        <div className="text-2xl font-semibold text-orange-800">{mediaSufficiencyReachData.summary.totalWeeks || 0}</div>
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
