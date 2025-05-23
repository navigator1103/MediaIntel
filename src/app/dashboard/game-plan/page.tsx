'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Spinner } from '@/components/ui/spinner';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

// Color palette for charts
const COLORS = ['#1F4388', '#2A5CAA', '#3E7DCD', '#5E9FE0', '#7FBCE6', '#A0D8EC', '#C1E4F0', '#E2F0F6'];

// Blue color palette specifically for the Media Share pie chart
const BLUE_COLORS = ['#1F4388', '#2A5CAA', '#3E7DCD', '#5E9FE0', '#7FBCE6', '#A0D8EC', '#C1E4F0', '#E2F0F6'];

// Function to generate a consistent blue shade based on campaign name
const getConsistentColor = (campaignName: string) => {
  // Use a simple hash function to generate a consistent color for each campaign name
  let hash = 0;
  for (let i = 0; i < campaignName.length; i++) {
    hash = campaignName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Professional blue shades palette
  const blueShades = [
    '#1F4388', // Dark Blue
    '#2A5CAA', // Medium Dark Blue
    '#3E7DCD', // Medium Blue
    '#5E9FE0', // Blue
    '#7FBCE6', // Light Blue
    '#A0D8EC', // Lighter Blue
    '#C1E4F0', // Very Light Blue
    '#D6EBF5', // Pale Blue
    '#4682B4', // Steel Blue
    '#6495ED'  // Cornflower Blue
  ];
  
  // Pick a color from the palette based on the hash
  return blueShades[Math.abs(hash) % blueShades.length];
};

// Types for our data
interface Campaign {
  id: number;
  name: string;
  year: number;
  businessUnitId: number | null;
  businessUnit?: {
    id: number;
    name: string;
  };
  range?: {
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
    };
  };
  country: {
    id: number;
    name: string;
    subRegion?: {
      id: number;
      name: string;
    };
  };
  mediaItems: Array<{
    id: number;
    totalBudget: number;
    q1Budget: number | null;
    q2Budget: number | null;
    q3Budget: number | null;
    q4Budget: number | null;
    startDate: string;
    endDate: string;
    mediaSubtype: {
      id: number;
      name: string;
      mediaType: {
        id: number;
        name: string;
      };
    };
  }>;
}

interface Category {
  id: number;
  name: string;
}

interface Country {
  id: number;
  name: string;
  subRegionId: number;
  subRegion: {
    id: number;
    name: string;
  };
}

interface SubRegion {
  id: number;
  name: string;
}

interface BusinessUnit {
  id: number;
  name: string;
}

interface MediaType {
  id: number;
  name: string;
}

interface QuarterlyDataRow {
  country: string;
  campaign: string;
  category: string;
  totalBudget: number;
  q1Budget: number;
  q1: string;
  q1Percent: number;
  q2Budget: number;
  q2: string;
  q2Percent: number;
  q3Budget: number;
  q3: string;
  q3Percent: number;
  q4Budget: number;
  q4: string;
  q4Percent: number;
  mediaTypes: string[];
  isTotal?: boolean;
}

interface DashboardData {
  totalBudget: number;
  mediaShareData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  campaignDistributionData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  quarterlyData: Array<{
    quarter: string;
    value: number;
  }>;
  totalCampaigns: number;
  isFiltered?: boolean; // Flag to track if the data has been filtered
}

interface FilterState {
  category?: string;
  country?: string;
  subRegion?: string;
  businessUnit?: string;
  mediaType?: string;
}

interface MediaItem {
  id: number;
  type: string;
  value: number;
}

interface Campaign {
  id: number;
  year: number;
  businessUnitId?: number;
  country?: {
    id: number;
    name: string;
  };
  range?: {
    id: number;
    category?: {
      id: number;
      name: string;
    };
  };
  mediaItems: MediaItem[];
}

function GamePlanDashboard() {
  // Filter state
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedSubRegions, setSelectedSubRegions] = useState<number[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBusinessUnits, setSelectedBusinessUnits] = useState<number[]>([]);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedCountries, setExpandedCountries] = useState<string[]>([]);
  
  // API data
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [subRegions, setSubRegions] = useState<SubRegion[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeMonths, setActiveMonths] = useState<string[][]>(Array(12).fill([]));
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [subRegionsList, setSubRegionsList] = useState<SubRegion[]>([]);
  const [businessUnitsList, setBusinessUnitsList] = useState<BusinessUnit[]>([]);
  const [mediaTypesList, setMediaTypesList] = useState<MediaType[]>([]);
  
  // Filtered data based on selections
  const [filteredCampaignData, setFilteredCampaignData] = useState<Campaign[]>([]);
  const [filteredQuarterlyData, setFilteredQuarterlyData] = useState<QuarterlyDataRow[]>([]);
  const [filteredShareData, setFilteredShareData] = useState<any[]>([]);
  const [filteredCountryQuarterData, setFilteredCountryQuarterData] = useState<any[]>([]);
  const [subMediaTypeData, setSubMediaTypeData] = useState<any[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  
  // Refs for charts to handle click outside
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  
  // Ref to track if data has been filtered already to prevent infinite loops
  const isDataFiltered = useRef<boolean>(false);
  
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('year', selectedYear);
        if (selectedCountry !== 'all') {
          params.append('country', selectedCountry);
        }
        
        // Fetch data from API endpoint
        const response = await fetch(`/api/game-plan?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        
        setCampaigns(data.campaigns);
        setCategoriesList(data.categories);
        setCountriesList(data.countries);
        setSubRegionsList(data.subRegions);
        setBusinessUnitsList(data.businessUnits || []);
        setMediaTypesList(data.mediaTypes);
        setDashboardData(data.dashboardData);
        
        // Initialize filtered data
        if (data.dashboardData) {
          setFilteredCampaignData(data.dashboardData.campaignDistributionData);
          setFilteredShareData(data.dashboardData.mediaShareData);
          
          // Create quarterly data table from campaigns
          const quarterlyTableData = data.campaigns.map((campaign: Campaign) => {
            // Calculate total budget for this campaign
            const totalBudget = campaign.mediaItems.reduce(
              (sum: number, item: any) => sum + (item.totalBudget || 0), 0
            );
            
            // Calculate quarterly budgets
            const q1Budget = campaign.mediaItems.reduce(
              (sum: number, item: any) => sum + (item.q1Budget || 0), 0
            );
            const q2Budget = campaign.mediaItems.reduce(
              (sum: number, item: any) => sum + (item.q2Budget || 0), 0
            );
            const q3Budget = campaign.mediaItems.reduce(
              (sum: number, item: any) => sum + (item.q3Budget || 0), 0
            );
            const q4Budget = campaign.mediaItems.reduce(
              (sum: number, item: any) => sum + (item.q4Budget || 0), 0
            );
            
            // Calculate percentages
            const q1Percent = totalBudget > 0 ? Math.round((q1Budget / totalBudget) * 100) : 0;
            const q2Percent = totalBudget > 0 ? Math.round((q2Budget / totalBudget) * 100) : 0;
            const q3Percent = totalBudget > 0 ? Math.round((q3Budget / totalBudget) * 100) : 0;
            const q4Percent = totalBudget > 0 ? Math.round((q4Budget / totalBudget) * 100) : 0;
            
            return {
              country: campaign.country.name,
              campaign: campaign.name,
              category: campaign.range?.category?.name || 'Uncategorized',
              q1: q1Budget > 0 ? `€ ${q1Budget.toLocaleString()}` : '',
              q1Percent,
              q2: q2Budget > 0 ? `${q2Percent}%` : '',
              q3: q3Budget > 0 ? `${q3Percent}%` : '',
              q4: q4Budget > 0 ? `${q4Percent}%` : ''
            };
          });
          
          setFilteredQuarterlyData(quarterlyTableData);
          
          // Create country quarter data by aggregating campaigns by country
          const countryQuarterData = Object.values(
            data.campaigns.reduce((acc: any, campaign: Campaign) => {
              const countryName = campaign.country.name;
              if (!acc[countryName]) {
                acc[countryName] = {
                  country: countryName,
                  q1: 0,
                  q2: 0,
                  q3: 0,
                  q4: 0,
                  total: 0
                };
              }
              
              // Sum up budgets for each quarter
              campaign.mediaItems.forEach((item: any) => {
                acc[countryName].q1 += item.q1Budget || 0;
                acc[countryName].q2 += item.q2Budget || 0;
                acc[countryName].q3 += item.q3Budget || 0;
                acc[countryName].q4 += item.q4Budget || 0;
                acc[countryName].total += item.totalBudget || 0;
              });
              
              return acc;
            }, {})
          ).map((item: any) => ({
            ...item,
            q1: item.q1 > 0 ? `€ ${item.q1.toLocaleString()}` : '-',
            q2: item.q2 > 0 ? `€ ${item.q2.toLocaleString()}` : '-',
            q3: item.q3 > 0 ? `€ ${item.q3.toLocaleString()}` : '-',
            q4: item.q4 > 0 ? `€ ${item.q4.toLocaleString()}` : '-',
          }));
          
          setFilteredCountryQuarterData(countryQuarterData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedYear, selectedCountry]);
  
  // Filter handlers
  const toggleSubRegion = (id: number) => {
    setSelectedSubRegions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    // Clear category filter if it's set
    if (activeFilters.category) {
      setActiveFilters(prev => ({ ...prev, category: undefined }));
    }
  };
  
  const toggleCountry = (id: number) => {
    setSelectedCountries(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    // Clear category filter if it's set
    if (activeFilters.category) {
      setActiveFilters(prev => ({ ...prev, category: undefined }));
    }
  };
  
  const toggleCategory = (id: number) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    
    // Update active filter to match if only one category is selected
    const updatedCategories = selectedCategories.includes(id) 
      ? selectedCategories.filter(item => item !== id) 
      : [...selectedCategories, id];
    
    if (updatedCategories.length === 1) {
      const categoryName = categoriesList.find(cat => cat.id === updatedCategories[0])?.name;
      if (categoryName) {
        setActiveFilters(prev => ({ ...prev, category: categoryName }));
      }
    } else if (updatedCategories.length === 0) {
      // Clear category filter if no categories are selected
      setActiveFilters(prev => ({ ...prev, category: undefined }));
    }
  };
  
  const toggleBusinessUnit = (id: number) => {
    setSelectedBusinessUnits(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Update sub-media type data
  useEffect(() => {
    if (campaigns.length > 0) {
      // Define the sub-media types we want to track
      const subMediaTypes = ['PM & FF', 'Open TV', 'Paid TV', 'Influencers', 'Influencer Amplification', 'Influencer Organic'];
      const countrySubMediaMap = new Map();
      
      // Initialize the map with countries
      filteredCampaigns.forEach(campaign => {
        const countryName = campaign.country.name;
        
        if (!countrySubMediaMap.has(countryName)) {
          const initialSubMediaData: { [key: string]: number } = {};
          subMediaTypes.forEach(type => {
            initialSubMediaData[type] = 0;
          });
          
          countrySubMediaMap.set(countryName, {
            country: countryName,
            ...initialSubMediaData,
            total: 0
          });
        }
      });
      
      // Process campaign data to populate sub-media type values
      filteredCampaigns.forEach(campaign => {
        const countryName = campaign.country.name;
        const countryData = countrySubMediaMap.get(countryName);
        
        campaign.mediaItems.forEach(item => {
          // Map media subtypes to our defined categories
          const subtypeName = item.mediaSubtype.name;
          let mappedType = '';
          
          if (subtypeName.includes('TV') && subtypeName.includes('Open')) {
            mappedType = 'Open TV';
          } else if (subtypeName.includes('TV') && subtypeName.includes('Paid')) {
            mappedType = 'Paid TV';
          } else if (subtypeName.includes('PM') || subtypeName.includes('FF')) {
            mappedType = 'PM & FF';
          } else if (subtypeName.includes('Influencer') && subtypeName.includes('Amplification')) {
            mappedType = 'Influencer Amplification';
          } else if (subtypeName.includes('Influencer') && subtypeName.includes('Organic')) {
            mappedType = 'Influencer Organic';
          } else if (subtypeName.includes('Influencer')) {
            mappedType = 'Influencers';
          } else {
            // Skip items that don't match our categories
            return;
          }
          
          // Add the budget to the appropriate category
          if (subMediaTypes.includes(mappedType)) {
            countryData[mappedType] += item.totalBudget || 0;
            countryData.total += item.totalBudget || 0;
          }
        });
      });
      
      // Convert percentages and format the data
      const newSubMediaTypeData = Array.from(countrySubMediaMap.values())
        .filter(item => item.total > 0) // Only include countries with data
        .map(item => {
          const result: { [key: string]: string | number } = { country: item.country };
          
          // Calculate percentages for each sub-media type
          subMediaTypes.forEach(type => {
            const percentage = item.total > 0 ? (item[type] / item.total) * 100 : 0;
            result[type] = percentage.toFixed(1) + '%';
          });
          
          return result;
        });
      
      setSubMediaTypeData(newSubMediaTypeData);
    }
  }, [filteredCampaigns]);

  // Apply filters to data
  const applyFilters = () => {
    if (!dashboardData) return;
    
    console.log('Applying filters:', { 
      activeFilters, 
      selectedCategories, 
      selectedCountries, 
      selectedSubRegions, 
      selectedBusinessUnits
    });
    
    // Start with all campaigns
    let updatedFilteredCampaigns = [...campaigns];
    
    // Apply sidebar filters first
    if (selectedBusinessUnits.length > 0) {
      updatedFilteredCampaigns = updatedFilteredCampaigns.filter(campaign => 
        campaign.businessUnitId && selectedBusinessUnits.includes(campaign.businessUnitId)
      );
    }

    if (selectedSubRegions.length > 0) {
      // Get countries in the selected subregions
      const countryIds = countriesList
        .filter(country => country.subRegion && selectedSubRegions.includes(country.subRegion.id))
        .map(country => country.id);
      
      // Filter campaigns by countries in the selected subregions
      updatedFilteredCampaigns = updatedFilteredCampaigns.filter(campaign => 
        campaign.country && countryIds.includes(campaign.country.id)
      );
    }
    
    if (selectedCountries.length > 0) {
      // Filter campaigns by country
      updatedFilteredCampaigns = updatedFilteredCampaigns.filter(campaign => 
        campaign.country && selectedCountries.includes(campaign.country.id)
      );
    }
    
    if (activeFilters.category) {
      updatedFilteredCampaigns = updatedFilteredCampaigns.filter(campaign => 
        campaign.range?.category?.name === activeFilters.category
      );
    }
    
    if (activeFilters.mediaType) {
      updatedFilteredCampaigns = updatedFilteredCampaigns.filter(campaign => 
        campaign.mediaItems.some(item => 
          item.mediaSubtype.mediaType.name === activeFilters.mediaType
        )
      );
    }
    
    // Update the filteredCampaigns state
    setFilteredCampaigns(updatedFilteredCampaigns);
    
    console.log('Filtered campaigns:', updatedFilteredCampaigns.length);
    
    // Now generate the data for charts and tables based on filtered campaigns
    
    // 1. Media share data (pie chart)
    const mediaTypeMap = new Map();
    let totalBudgetSum = 0;
    
    updatedFilteredCampaigns.forEach(campaign => {
      campaign.mediaItems.forEach(item => {
        const mediaTypeName = item.mediaSubtype.mediaType.name;
        const budget = item.totalBudget || 0;
        totalBudgetSum += budget;
        
        if (mediaTypeMap.has(mediaTypeName)) {
          mediaTypeMap.set(mediaTypeName, mediaTypeMap.get(mediaTypeName) + budget);
        } else {
          mediaTypeMap.set(mediaTypeName, budget);
        }
      });
    });
    
    // Calculate percentages for each media type based on total budget
    const newShareData = Array.from(mediaTypeMap.entries()).map(([name, value], index) => ({
      name,
      value,
      percentage: totalBudgetSum > 0 ? (value / totalBudgetSum) * 100 : 0,
      color: BLUE_COLORS[index % BLUE_COLORS.length] // Always use blue colors for media share
    }));
    
    // 2. Campaign distribution data (bar chart)
    const categoryMap = new Map();
    
    updatedFilteredCampaigns.forEach(campaign => {
      const categoryName = campaign.range?.category?.name || 'Uncategorized';
      const budget = campaign.mediaItems.reduce((sum, item) => sum + (item.totalBudget || 0), 0);
      
      if (categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, categoryMap.get(categoryName) + budget);
      } else {
        categoryMap.set(categoryName, budget);
      }
    });
    
    const newCampaignData = Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
    
    // 3. Quarterly data for the table
    const campaignQuarterlyData = updatedFilteredCampaigns.map(campaign => {
      // Calculate total budget for this campaign
      const totalBudget = campaign.mediaItems.reduce(
        (sum, item) => sum + (item.totalBudget || 0), 0
      );
      
      // Calculate quarterly budgets
      const q1Budget = campaign.mediaItems.reduce(
        (sum, item) => sum + (item.q1Budget || 0), 0
      );
      const q2Budget = campaign.mediaItems.reduce(
        (sum, item) => sum + (item.q2Budget || 0), 0
      );
      const q3Budget = campaign.mediaItems.reduce(
        (sum, item) => sum + (item.q3Budget || 0), 0
      );
      const q4Budget = campaign.mediaItems.reduce(
        (sum, item) => sum + (item.q4Budget || 0), 0
      );
      
      // Calculate percentages
      const q1Percent = totalBudget > 0 ? Math.round((q1Budget / totalBudget) * 100) : 0;
      const q2Percent = totalBudget > 0 ? Math.round((q2Budget / totalBudget) * 100) : 0;
      const q3Percent = totalBudget > 0 ? Math.round((q3Budget / totalBudget) * 100) : 0;
      const q4Percent = totalBudget > 0 ? Math.round((q4Budget / totalBudget) * 100) : 0;
      
      return {
        country: campaign.country.name,
        campaign: campaign.name,
        category: campaign.range.category.name,
        totalBudget: totalBudget,
        q1Budget: q1Budget,
        q1: q1Budget > 0 ? `€ ${q1Budget.toLocaleString()}` : '-',
        q1Percent,
        q2Budget: q2Budget,
        q2: q2Budget > 0 ? `€ ${q2Budget.toLocaleString()}` : '-',
        q2Percent,
        q3Budget: q3Budget,
        q3: q3Budget > 0 ? `€ ${q3Budget.toLocaleString()}` : '-',
        q3Percent,
        q4Budget: q4Budget,
        q4: q4Budget > 0 ? `€ ${q4Budget.toLocaleString()}` : '-',
        q4Percent,
        mediaTypes: [...new Set(campaign.mediaItems.map(item => item.mediaSubtype.mediaType.name))]
      };
    });
    
    // Calculate totals for all campaigns
    const totalRow: QuarterlyDataRow = {
      country: 'Total',
      campaign: '',
      category: '',
      totalBudget: 0,
      q1Budget: 0,
      q1: '',
      q1Percent: 0,
      q2Budget: 0,
      q2: '',
      q2Percent: 0,
      q3Budget: 0,
      q3: '',
      q3Percent: 0,
      q4Budget: 0,
      q4: '',
      q4Percent: 0,
      mediaTypes: [],
      isTotal: true
    };
    
    // Sum up all values for the total row
    campaignQuarterlyData.forEach(row => {
      totalRow.totalBudget += row.totalBudget;
      totalRow.q1Budget += row.q1Budget;
      totalRow.q2Budget += row.q2Budget;
      totalRow.q3Budget += row.q3Budget;
      totalRow.q4Budget += row.q4Budget;
    });
    
    // Format the total values
    totalRow.q1 = totalRow.q1Budget > 0 ? `€ ${totalRow.q1Budget.toLocaleString()}` : '-';
    totalRow.q2 = totalRow.q2Budget > 0 ? `€ ${totalRow.q2Budget.toLocaleString()}` : '-';
    totalRow.q3 = totalRow.q3Budget > 0 ? `€ ${totalRow.q3Budget.toLocaleString()}` : '-';
    totalRow.q4 = totalRow.q4Budget > 0 ? `€ ${totalRow.q4Budget.toLocaleString()}` : '-';
    
    // Calculate percentages for totals
    if (totalRow.totalBudget > 0) {
      totalRow.q1Percent = Math.round((totalRow.q1Budget / totalRow.totalBudget) * 100);
      totalRow.q2Percent = Math.round((totalRow.q2Budget / totalRow.totalBudget) * 100);
      totalRow.q3Percent = Math.round((totalRow.q3Budget / totalRow.totalBudget) * 100);
      totalRow.q4Percent = Math.round((totalRow.q4Budget / totalRow.totalBudget) * 100);
    }
    
    // Add total row to the data
    const newQuarterlyData: QuarterlyDataRow[] = [...campaignQuarterlyData, totalRow];
    
    // 4. Country quarterly data with nested categories
    const countryQuarterMap = new Map();
    const countryCategoryMap = new Map();
    
    updatedFilteredCampaigns.forEach(campaign => {
      const countryName = campaign.country.name;
      const categoryName = campaign.range?.category?.name || 'Uncategorized';
      
      // Initialize country data if not exists
      if (!countryQuarterMap.has(countryName)) {
        countryQuarterMap.set(countryName, {
          country: countryName,
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          total: 0,
          categories: []
        });
      }
      
      // Initialize category data for this country if not exists
      const countryKey = `${countryName}-${categoryName}`;
      if (!countryCategoryMap.has(countryKey)) {
        countryCategoryMap.set(countryKey, {
          country: countryName,
          category: categoryName,
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
          total: 0
        });
        
        // Add to country's categories array
        countryQuarterMap.get(countryName).categories.push(categoryName);
      }
      
      const countryData = countryQuarterMap.get(countryName);
      const categoryData = countryCategoryMap.get(countryKey);
      
      campaign.mediaItems.forEach(item => {
        // Update country totals
        countryData.q1 += item.q1Budget || 0;
        countryData.q2 += item.q2Budget || 0;
        countryData.q3 += item.q3Budget || 0;
        countryData.q4 += item.q4Budget || 0;
        countryData.total += item.totalBudget || 0;
        
        // Update category totals
        categoryData.q1 += item.q1Budget || 0;
        categoryData.q2 += item.q2Budget || 0;
        categoryData.q3 += item.q3Budget || 0;
        categoryData.q4 += item.q4Budget || 0;
        categoryData.total += item.totalBudget || 0;
      });
    });
    
    // Format country data
    const newCountryQuarterData = Array.from(countryQuarterMap.values()).map(item => ({
      ...item,
      q1: item.q1 > 0 ? `€ ${item.q1.toLocaleString()}` : '-',
      q2: item.q2 > 0 ? `€ ${item.q2.toLocaleString()}` : '-',
      q3: item.q3 > 0 ? `€ ${item.q3.toLocaleString()}` : '-',
      q4: item.q4 > 0 ? `€ ${item.q4.toLocaleString()}` : '-',
      // Get category data for this country
      categoryData: item.categories.map((categoryName: string) => {
        const categoryData: { q1: number; q2: number; q3: number; q4: number } = countryCategoryMap.get(`${item.country}-${categoryName}`) || { q1: 0, q2: 0, q3: 0, q4: 0 };
        return {
          category: categoryName,
          q1: categoryData.q1 > 0 ? `€ ${categoryData.q1.toLocaleString()}` : '-',
          q2: categoryData.q2 > 0 ? `€ ${categoryData.q2.toLocaleString()}` : '-',
          q3: categoryData.q3 > 0 ? `€ ${categoryData.q3.toLocaleString()}` : '-',
          q4: categoryData.q4 > 0 ? `€ ${categoryData.q4.toLocaleString()}` : '-',
        };
      })
    }));
    
    // 5. Sub-media type data by country
    // Define the sub-media types we want to track
    const subMediaTypes = ['PM & FF', 'Open TV', 'Paid TV', 'Influencers', 'Influencer Amplification', 'Influencer Organic'];
    const countrySubMediaMap = new Map();
    
    // Initialize the map with countries
    filteredCampaigns.forEach(campaign => {
      const countryName = campaign.country.name;
      
      if (!countrySubMediaMap.has(countryName)) {
        const initialSubMediaData: { [key: string]: number } = {};
        subMediaTypes.forEach(type => {
          initialSubMediaData[type] = 0;
        });
        
        countrySubMediaMap.set(countryName, {
          country: countryName,
          ...initialSubMediaData,
          total: 0
        });
      }
    });
    
    // Process campaign data to populate sub-media type values
    filteredCampaigns.forEach(campaign => {
      const countryName = campaign.country.name;
      const countryData = countrySubMediaMap.get(countryName);
      
      campaign.mediaItems.forEach(item => {
        // Map media subtypes to our defined categories
        // This is a simplification - in a real app, you'd have proper mapping from your data
        const subtypeName = item.mediaSubtype.name;
        let mappedType = '';
        
        if (subtypeName.includes('TV') && subtypeName.includes('Open')) {
          mappedType = 'Open TV';
        } else if (subtypeName.includes('TV') && subtypeName.includes('Paid')) {
          mappedType = 'Paid TV';
        } else if (subtypeName.includes('PM') || subtypeName.includes('FF')) {
          mappedType = 'PM & FF';
        } else if (subtypeName.includes('Influencer') && subtypeName.includes('Amplification')) {
          mappedType = 'Influencer Amplification';
        } else if (subtypeName.includes('Influencer') && subtypeName.includes('Organic')) {
          mappedType = 'Influencer Organic';
        } else if (subtypeName.includes('Influencer')) {
          mappedType = 'Influencers';
        } else {
          // Skip items that don't match our categories
          return;
        }
        
        // Add the budget to the appropriate category
        if (subMediaTypes.includes(mappedType)) {
          countryData[mappedType] += item.totalBudget || 0;
          countryData.total += item.totalBudget || 0;
        }
      });
    });
    
    // Convert percentages and format the data
    const newSubMediaTypeData = Array.from(countrySubMediaMap.values())
      .filter(item => item.total > 0) // Only include countries with data
      .map(item => {
        const result: { country: string; [key: string]: string | number } = { country: item.country };
        
        // Calculate percentages for each sub-media type
        subMediaTypes.forEach(type => {
          const percentage = item.total > 0 ? (item[type] / item.total) * 100 : 0;
          result[type] = percentage.toFixed(1) + '%';
        });
        
        return result;
      });
    
    // Update dashboard data
    setFilteredCampaignData(newCampaignData);
    
    // Make sure the total row is included in the filtered data
    // This ensures the total row is always visible in the table
    if (newQuarterlyData.length > 0) {
      // Check if the total row is already in the data
      const hasTotalRow = newQuarterlyData.some(row => row.isTotal);
      if (!hasTotalRow) {
        console.log('Adding missing total row to quarterly data');
        // If no total row exists, add it
        newQuarterlyData.push(totalRow);
      }
    }
    
    setFilteredQuarterlyData(newQuarterlyData);
    setFilteredCountryQuarterData(newCountryQuarterData);
    setFilteredShareData(newShareData);
    
    // Update dashboard metrics
    if (dashboardData) {
      setDashboardData({
        ...dashboardData,
        totalBudget: totalBudgetSum,
        totalCampaigns: filteredCampaigns.length,
        mediaShareData: newShareData,
        campaignDistributionData: newCampaignData,
        isFiltered: true // Add a flag to indicate this data has been filtered
      });
    }
    
    // Set filtered data (removed duplicated state updates)
    setFilteredCampaignData(newCampaignData);
    setFilteredQuarterlyData(newQuarterlyData);
    setFilteredCountryQuarterData(newCountryQuarterData);
    setFilteredShareData(activeFilters.mediaType ? newShareData : (dashboardData?.mediaShareData || []));
    setSubMediaTypeData(newSubMediaTypeData);
  };
  
  // Handle chart element click
  const handleCampaignBarClick = (data: any) => {
    console.log('Campaign bar clicked:', data);
    // Toggle filter - if already selected, clear the filter
    if (activeFilters.category === data.name) {
      // Clear the category filter
      setActiveFilters(prev => ({ ...prev, category: undefined }));
      
      // Also clear the category from sidebar selection
      const categoryId = categoriesList.find(cat => cat.name === data.name)?.id;
      if (categoryId) {
        setSelectedCategories(prev => prev.filter(id => id !== categoryId));
      }
    } else {
      // Set the category filter
      setActiveFilters(prev => ({ ...prev, category: data.name }));
      
      // Also update the sidebar checkboxes to match
      const categoryId = categoriesList.find(cat => cat.name === data.name)?.id;
      if (categoryId && !selectedCategories.includes(categoryId)) {
        setSelectedCategories(prev => [...prev, categoryId]);
      }
    }
  };
  
  const handleMediaShareClick = (data: any) => {
    console.log('Media share clicked:', data);
    // Toggle filter - if already selected, clear the filter
    if (activeFilters.mediaType === data.name) {
      setActiveFilters(prev => ({ ...prev, mediaType: undefined }));
    } else {
      setActiveFilters(prev => ({ ...prev, mediaType: data.name }));
    }
  };
  
  // Handle click on bar chart
  const handleBarChartClick = (data: any) => {
    console.log('Bar chart click event:', data);
    if (data && data.activePayload && data.activePayload.length > 0) {
      // Get the category name from the clicked bar
      const categoryName = data.activePayload[0].payload.name;
      console.log('Clicked on category:', categoryName);
      
      // If we're already filtering by this category, clear the filter
      if (activeFilters.category === categoryName) {
        setActiveFilters(prev => ({ ...prev, category: undefined }));
      } else {
        // Otherwise, set the filter to this category
        setActiveFilters(prev => ({ ...prev, category: categoryName }));
      }
    } else {
      // Clicking on empty area of chart clears the filter
      if (activeFilters.category) {
        // Clear the category filter
        setActiveFilters(prev => ({ ...prev, category: undefined }));
        
        // Also clear any category selections in the sidebar that match the active filter
        if (activeFilters.category) {
          const categoryId = categoriesList.find(cat => cat.name === activeFilters.category)?.id;
          if (categoryId) {
            setSelectedCategories(prev => prev.filter(id => id !== categoryId));
          }
        }
      }
    }
  };
  
  // Handle click on pie chart
  const handlePieChartClick = (data: any) => {
    console.log('Pie chart click event:', data);
    if (data && data.activePayload && data.activePayload.length > 0) {
      handleMediaShareClick(data.activePayload[0].payload);
    } else {
      // Clicking on empty area of chart clears the filter
      if (activeFilters.mediaType) {
        setActiveFilters(prev => ({ ...prev, mediaType: undefined }));
      }
    }
  };
  
  // Clear all active filters
  const clearAllFilters = () => {
    setActiveFilters({});
    setSelectedCategories([]);
    setSelectedCountries([]);
    setSelectedSubRegions([]);
    setSelectedBusinessUnits([]);
    
    // Reset filtered campaigns to all campaigns
    setFilteredCampaigns([...campaigns]);
    
    // Apply filters to reset the dashboard data
    applyFilters();
  };
  
  // Handle click outside charts to clear filters
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if we're clicking on a chart element or control
      const isChartElement = (event.target as HTMLElement).closest('svg') !== null;
      const isFilterControl = (
        (event.target as HTMLElement).closest('.filter-badge') !== null ||
        (event.target as HTMLElement).closest('.filter-controls') !== null ||
        (event.target as HTMLElement).closest('button') !== null ||
        (event.target as HTMLElement).closest('select') !== null
      );
      
      // Check if click is inside the bar chart container
      const isInsideBarChart = barChartRef.current && barChartRef.current.contains(event.target as Node);
      
      // If we're not clicking on a chart element, control, or inside the bar chart container, and we have active filters
      if (!isChartElement && !isFilterControl && !isInsideBarChart && Object.keys(activeFilters).length > 0) {
        console.log('Click outside detected, clearing filters');
        setActiveFilters({});
        
        // Reset filtered campaigns to all campaigns to ensure totals are updated correctly
        setFilteredCampaigns([...campaigns]);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilters]);
  
  // Single consolidated useEffect to handle all filter changes
  useEffect(() => {
    // Only apply filters if we have data to work with
    if (dashboardData && campaigns.length > 0) {
      console.log('Filters changed:', {
        subRegions: selectedSubRegions,
        countries: selectedCountries,
        categories: selectedCategories,
        businessUnits: selectedBusinessUnits,
        year: selectedYear,
        activeFilters
      });
      
      // Apply the filters
      applyFilters();
    }
  }, [selectedSubRegions, selectedCountries, selectedCategories, selectedBusinessUnits, selectedYear, activeFilters, campaigns.length]);
  
  // Separate useEffect for initial data load only
  useEffect(() => {
    // This will only run when dashboardData is first loaded
    if (dashboardData && campaigns.length > 0 && !isDataFiltered.current) {
      isDataFiltered.current = true;
      applyFilters();
    }
  }, [dashboardData]);

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Top Navigation */}
      <Navigation />
      
      {/* Dashboard Tabs */}
      <div className="border-b border-gray-200 flex items-center justify-between px-4 py-2 mt-16">
        <div className="flex space-x-8">
          <Link href="/dashboard" className="px-1 py-4 text-sm font-medium text-gray-500 hover:text-indigo-500">
            Overview
          </Link>
          <Link href="/dashboard/game-plan" className="px-1 py-4 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">
            Game Plan
          </Link>

          <Link href="/dashboard/media-similarity" className="px-1 py-4 text-sm font-medium text-gray-500 hover:text-indigo-500">
            Similarity
          </Link>
        </div>
        {/* Year selector moved to header */}
      </div>
      
      <div className="flex flex-1 overflow-hidden"> {/* Main container for sidebar and content */}
        {/* Left Sidebar Filters */}
        <div className={`${sidebarExpanded ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 p-4 flex flex-col h-[calc(100vh-112px)]`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`${sidebarExpanded ? 'block' : 'hidden'} text-lg font-semibold text-gray-800`}>Filters</h2>
            <button 
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              {sidebarExpanded ? (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="overflow-y-auto flex-grow">
            {/* Business Unit Filter */}
            <div className="mb-6">
              <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-500 mb-2`}>Business Unit</h3>
              <div className="space-y-1">
                {businessUnitsList.map(bu => (
                  <div key={bu.id} className="flex items-center">
                    <input
                      id={`bu-${bu.id}`}
                      type="checkbox"
                      checked={selectedBusinessUnits.includes(bu.id)}
                      onChange={() => toggleBusinessUnit(bu.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label 
                      htmlFor={`bu-${bu.id}`} 
                      className={`${sidebarExpanded ? 'block' : 'hidden'} ml-2 text-sm text-gray-700`}
                    >
                      {bu.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub Region Filter */}
            <div className="mb-6">
              <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-500 mb-2`}>Sub Region</h3>
              <div className="space-y-1">
                {subRegionsList.map(subRegion => (
                  <div key={subRegion.id} className="flex items-center">
                    <input
                      id={`subregion-${subRegion.id}`}
                      type="checkbox"
                      checked={selectedSubRegions.includes(subRegion.id)}
                      onChange={() => toggleSubRegion(subRegion.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label 
                      htmlFor={`subregion-${subRegion.id}`} 
                      className={`${sidebarExpanded ? 'block' : 'hidden'} ml-2 text-sm text-gray-700`}
                    >
                      {subRegion.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Country Filter */}
            <div className="mb-6">
              <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-500 mb-2`}>Country</h3>
              <div className="space-y-1">
                {countriesList.map(country => (
                  <div key={country.id} className="flex items-center">
                    <input
                      id={`country-${country.id}`}
                      type="checkbox"
                      checked={selectedCountries.includes(country.id)}
                      onChange={() => toggleCountry(country.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label 
                      htmlFor={`country-${country.id}`} 
                      className={`${sidebarExpanded ? 'block' : 'hidden'} ml-2 text-sm text-gray-700`}
                    >
                      {country.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="mb-6">
              <h3 className={`${sidebarExpanded ? 'block' : 'hidden'} text-sm font-medium text-gray-500 mb-2`}>Category</h3>
              <div className="space-y-1">
                {categoriesList.map(category => (
                  <div key={category.id} className="flex items-center">
                    <input
                      id={`category-${category.id}`}
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label 
                      htmlFor={`category-${category.id}`} 
                      className={`${sidebarExpanded ? 'block' : 'hidden'} ml-2 text-sm text-gray-700`}
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Game Plan Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm"
            >
              <option value="2025">FY 2025</option>
              <option value="2024">FY 2024</option>
            </select>
          </div>
        </div>
        <div className="p-8 mt-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-medium text-gray-700 mb-4">Campaign Calendar</h2>
          
          {/* Budget Summary Graph */}
          {!isLoading && filteredCampaigns.length > 0 && (
            <div className="mb-6">
              {(() => {
                // Calculate total budget and quarterly percentages
                let totalBudget = 0;
                let q1Total = 0;
                let q2Total = 0;
                let q3Total = 0;
                let q4Total = 0;
                
                filteredCampaigns.forEach(campaign => {
                  campaign.mediaItems.forEach(item => {
                    totalBudget += item.totalBudget || 0;
                    q1Total += item.q1Budget || 0;
                    q2Total += item.q2Budget || 0;
                    q3Total += item.q3Budget || 0;
                    q4Total += item.q4Budget || 0;
                  });
                });
                
                const q1Percent = totalBudget > 0 ? Math.round((q1Total / totalBudget) * 100) : 0;
                const q2Percent = totalBudget > 0 ? Math.round((q2Total / totalBudget) * 100) : 0;
                const q3Percent = totalBudget > 0 ? Math.round((q3Total / totalBudget) * 100) : 0;
                const q4Percent = totalBudget > 0 ? Math.round((q4Total / totalBudget) * 100) : 0;
                
                // Count unique countries
                const uniqueCountries = new Set(filteredCampaigns.map(c => c.country.id)).size;
                
                return (
                  <div className="grid grid-cols-6 text-white text-center">
                    <div className="bg-[#1F4388] p-3">
                      <div className="text-2xl font-bold">{uniqueCountries}</div>
                      <div className="text-sm">Countries</div>
                    </div>
                    <div className="bg-[#2A5CAA] p-3">
                      <div className="text-2xl font-bold">€ {totalBudget.toLocaleString()}</div>
                      <div className="text-sm">WM Total</div>
                    </div>
                    <div className="bg-[#3E7DCD] p-3">
                      <div className="text-2xl font-bold">{q1Percent}%</div>
                      <div className="text-sm">Q1</div>
                    </div>
                    <div className="bg-[#5E9FE0] p-3">
                      <div className="text-2xl font-bold">{q2Percent}%</div>
                      <div className="text-sm">Q2</div>
                    </div>
                    <div className="bg-[#7FBCE6] p-3">
                      <div className="text-2xl font-bold">{q3Percent}%</div>
                      <div className="text-sm">Q3</div>
                    </div>
                    <div className="bg-[#A0D8EC] p-3">
                      <div className="text-2xl font-bold">{q4Percent}%</div>
                      <div className="text-sm">Q4</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-40">Country</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-40 bg-gray-50 z-10 w-64">Campaign</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[26rem] bg-gray-50 z-10 w-32">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[34rem] bg-gray-50 z-10 w-32">Budget</th>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                      <th key={month} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Group campaigns by country */}
                  {Object.entries(filteredCampaigns.reduce((acc: Record<string, Campaign[]>, campaign) => {
                    const countryName = campaign.country.name;
                    if (!acc[countryName]) {
                      acc[countryName] = [];
                    }
                    acc[countryName].push(campaign);
                    return acc;
                  }, {})).map(([countryName, countryCampaigns]) => (
                    <React.Fragment key={countryName}>
                      {/* Country header row */}
                      <tr className="bg-blue-50">
                        <td 
                          colSpan={16} 
                          className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-blue-50"
                        >
                          {countryName}
                        </td>
                      </tr>
                      
                      {/* Campaign rows */}
                      {countryCampaigns.map((campaign) => {
                        // Calculate total budget
                        const totalBudget = campaign.mediaItems.reduce(
                          (sum, item) => sum + (item.totalBudget || 0), 0
                        );
                        
                        // Get all media items with their date ranges
                        // Check if startDate and endDate exist on the media items
                        const mediaItems = campaign.mediaItems
                          .filter(item => item.startDate && item.endDate) // Only use items with valid dates
                          .map(item => ({
                            startDate: new Date(item.startDate as string),
                            endDate: new Date(item.endDate as string),
                            budget: item.totalBudget || 0
                          }));
                        
                        // Create a map of months (0-11) to determine if the campaign is active in that month
                        const activeMonths: Record<number, number[]> = {};
                        const currentYear = new Date().getFullYear();
                        
                        // For each media item, mark all months between start and end date as active
                        mediaItems.forEach(item => {
                          const startMonth = item.startDate.getMonth();
                          const startYear = item.startDate.getFullYear();
                          const endMonth = item.endDate.getMonth();
                          const endYear = item.endDate.getFullYear();
                          
                          // Only process dates for the current year in the view
                          if (startYear <= currentYear && endYear >= currentYear) {
                            // Calculate effective start and end months within current year
                            const effectiveStartMonth = startYear < currentYear ? 0 : startMonth;
                            const effectiveEndMonth = endYear > currentYear ? 11 : endMonth;
                            
                            // Mark all months in the range as active
                            for (let month = effectiveStartMonth; month <= effectiveEndMonth; month++) {
                              if (!activeMonths[month]) {
                                activeMonths[month] = [];
                              }
                              activeMonths[month].push(item.budget);
                            }
                          }
                        });
                        
                        // For backward compatibility, also check quarterly budgets
                        const hasQ1Budget = campaign.mediaItems.some(item => item.q1Budget && item.q1Budget > 0);
                        const hasQ2Budget = campaign.mediaItems.some(item => item.q2Budget && item.q2Budget > 0);
                        const hasQ3Budget = campaign.mediaItems.some(item => item.q3Budget && item.q3Budget > 0);
                        const hasQ4Budget = campaign.mediaItems.some(item => item.q4Budget && item.q4Budget > 0);
                        
                        // If we have quarterly data but no specific date ranges, use quarters
                        if (Object.keys(activeMonths).length === 0) {
                          if (hasQ1Budget) {
                            [0, 1, 2].forEach(month => { activeMonths[month] = [1]; });
                          }
                          if (hasQ2Budget) {
                            [3, 4, 5].forEach(month => { activeMonths[month] = [1]; });
                          }
                          if (hasQ3Budget) {
                            [6, 7, 8].forEach(month => { activeMonths[month] = [1]; });
                          }
                          if (hasQ4Budget) {
                            [9, 10, 11].forEach(month => { activeMonths[month] = [1]; });
                          }
                        }
                        
                        return (
                          <tr key={campaign.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {countryName}
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-40 bg-white">
                              {campaign.name}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 sticky left-[26rem] bg-white">
                              {campaign.range?.category?.name || 'Uncategorized'}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 sticky left-[34rem] bg-white">
                              € {totalBudget.toLocaleString()}
                            </td>
                            
                            {/* Get a consistent color for this campaign */}
                            {(() => {
                              const campaignName = campaign.name;
                              const bgColor = getConsistentColor(campaignName);
                              // Calculate a slightly darker color for the border
                              const borderColor = bgColor;
                              
                              return (
                                <>
                                  {/* Generate cells for all 12 months */}
                                  {Array.from({ length: 12 }, (_, monthIndex) => {
                                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                    const isActive = activeMonths[monthIndex] && activeMonths[monthIndex].length > 0;
                                    
                                    // Calculate opacity based on budget amount for this month
                                    // Higher budget = more opacity
                                    let opacity = 1;
                                    if (isActive) {
                                      const totalBudgetForMonth = activeMonths[monthIndex].reduce((sum: number, budget: number) => sum + budget, 0);
                                      // Normalize opacity between 0.6 and 1 based on budget
                                      // Ensure we don't divide by zero and handle NaN cases
                                      const budgetFactor = totalBudget > 0 ? totalBudgetForMonth / (totalBudget * 0.5) : 0.6;
                                      opacity = Math.min(1, Math.max(0.6, budgetFactor));
                                      // Ensure opacity is a valid number
                                      if (isNaN(opacity)) opacity = 0.8; // Default opacity if calculation fails
                                    }
                                    
                                    // Determine if this is the start or end of a burst
                                    const isPrevMonthActive = monthIndex > 0 && activeMonths[monthIndex - 1] && activeMonths[monthIndex - 1].length > 0;
                                    const isNextMonthActive = monthIndex < 11 && activeMonths[monthIndex + 1] && activeMonths[monthIndex + 1].length > 0;
                                    
                                    // Set border radius based on position in burst
                                    let borderRadius = '';
                                    if (isActive) {
                                      if (!isPrevMonthActive && !isNextMonthActive) {
                                        // Isolated month (single month burst)
                                        borderRadius = '4px';
                                      } else if (!isPrevMonthActive) {
                                        // Start of burst
                                        borderRadius = '4px 0 0 4px';
                                      } else if (!isNextMonthActive) {
                                        // End of burst
                                        borderRadius = '0 4px 4px 0';
                                      }
                                    }
                                    
                                    return (
                                      <td key={monthIndex} className="px-0 py-2 text-center">
                                        {isActive && (
                                          <div 
                                            className="h-6 mx-0 shadow-sm" 
                                            style={{ 
                                              backgroundColor: bgColor,
                                              opacity: opacity,
                                              borderRadius: borderRadius,
                                              borderWidth: '1px', 
                                              borderStyle: 'solid', 
                                              borderColor: 'rgba(0,0,0,0.2)',
                                              // Remove left border if connected to previous month
                                              borderLeftWidth: isPrevMonthActive ? '0' : '1px',
                                              // Add a small indicator if multiple media items in this month
                                              position: 'relative'
                                            }}
                                          >
                                            {/* Add small indicator for multiple bursts if needed */}
                                            {activeMonths[monthIndex].length > 1 && (
                                              <div 
                                                className="absolute top-0 right-0 w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}
                                                title={`${activeMonths[monthIndex].length} media items in ${monthNames[monthIndex]}`}
                                              />
                                            )}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}

                                </>
                              );
                            })()}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default GamePlanDashboard;
