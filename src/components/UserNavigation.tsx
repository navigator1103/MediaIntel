'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { handleLogout } from '@/lib/auth';

// Define the filter context type
export interface FilterContextType {
  selectedBrand: string | null;
  setSelectedBrand: (brand: string | null) => void;
  selectedPlatform: string | null;
  setSelectedPlatform: (platform: string | null) => void;
  selectedCountry: string | null;
  setSelectedCountry: (country: string | null) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

// Create the filter context with default values
export const FilterContext = createContext<FilterContextType>({
  selectedBrand: null,
  setSelectedBrand: () => {},
  selectedPlatform: null,
  setSelectedPlatform: () => {},
  selectedCountry: null,
  setSelectedCountry: () => {},
  selectedMonth: '',
  setSelectedMonth: () => {}
});

interface NavItem {
  name: string;
  href: string;
  icon: (active: boolean) => React.ReactElement;
}

interface FilterOption {
  id: string | number;
  name: string;
  value: string;
}

const UserNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [userData, setUserData] = useState({
    name: 'User',
    brand: 'Loading...',
    country: 'Loading...'
  });
  
  // Track if component is mounted to prevent state updates after unmounting
  const [isMounted, setIsMounted] = useState(false);
  
  // Get filter state and setters from context
  const { 
    selectedBrand, setSelectedBrand,
    selectedPlatform, setSelectedPlatform,
    selectedCountry, setSelectedCountry,
    selectedMonth, setSelectedMonth
  } = useContext(FilterContext);
  
  // Filter options
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  
  const [platforms, setPlatforms] = useState<FilterOption[]>([
    { id: 'meta', name: 'Meta', value: 'Meta' },
    { id: 'google-ads', name: 'Google Ads', value: 'Google Ads' },
    { id: 'tiktok', name: 'TikTok', value: 'TikTok' },
    { id: 'dv360', name: 'DV360', value: 'DV360' }
  ]);
  
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  // Fetch countries and brands from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch countries
        setLoadingCountries(true);
        const countriesResponse = await fetch('/api/countries');
        if (!countriesResponse.ok) {
          throw new Error('Failed to fetch countries');
        }
        
        const countriesData = await countriesResponse.json();
        // Map the countries data to the format expected by the component
        const formattedCountries = countriesData.map((country: any) => ({
          id: country.id,
          name: country.name,
          value: country.id.toString()
        }));
        
        setCountries(formattedCountries);
        
        // Fetch brands
        setLoadingBrands(true);
        const brandsResponse = await fetch('/api/brands');
        if (!brandsResponse.ok) {
          throw new Error('Failed to fetch brands');
        }
        
        const brandsData = await brandsResponse.json();
        // Map the brands data to the format expected by the component
        const formattedBrands = brandsData.map((brand: any) => ({
          id: brand.id,
          name: brand.name,
          value: brand.id.toString()
        }));
        
        setBrands(formattedBrands);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingCountries(false);
        setLoadingBrands(false);
      }
    };
    
    if (isMounted) {
      fetchData();
    }
  }, [isMounted]);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserData({
          name: user.name || 'User',
          brand: user.brand || 'Unknown Brand',
          country: user.country || 'Unknown Country'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    return () => {
      setIsMounted(false);
    };
  }, []);
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };
  
  const onLogout = () => {
    handleLogout(router);
  };
  
  // Handle filter selection
  const handleFilterSelect = (type: 'platform' | 'brand' | 'country', value: string, e?: React.MouseEvent) => {
    // Prevent default behavior if event is provided
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Extra safety measures to ensure no page refresh
      try {
        if (e.nativeEvent) {
          e.nativeEvent.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
          e.nativeEvent.stopPropagation();
        }
      } catch (err) {
        console.error('Error preventing event propagation:', err);
      }
    }
    
    if (!isMounted) return;
    
    // Toggle selection based on filter type using context state
    // This is now purely client-side with no page navigation
    switch (type) {
      case 'platform':
        // If "all" is selected, set to null (show all platforms)
        if (value === 'all') {
          setSelectedPlatform(null);
        } else {
          const newPlatformValue = selectedPlatform === value ? null : value;
          setSelectedPlatform(newPlatformValue);
        }
        break;
      case 'brand':
        // If "all" is selected, set to null (show all brands)
        if (value === 'all') {
          setSelectedBrand(null);
        } else {
          const newBrandValue = selectedBrand === value ? null : value;
          setSelectedBrand(newBrandValue);
        }
        break;
      case 'country':
        // If "all" is selected, set to null (show all countries)
        if (value === 'all') {
          setSelectedCountry(null);
        } else {
          const newCountryValue = selectedCountry === value ? null : value;
          setSelectedCountry(newCountryValue);
        }
        break;
    }
    
    // Log the filter state after change
    setTimeout(() => {
      console.log('Current filter state after filter change:', {
        type,
        value,
        month: selectedMonth,
        country: selectedCountry,
        brand: selectedBrand,
        platform: selectedPlatform
      });
    }, 100);
    
    // Prevent default page refresh behavior
    // This ensures the filter changes are applied without a page reload
    console.log(`Filter changed: ${type} = ${value}`);
    
    // Return false to prevent any default behavior
    return false;
  };
  
  // Check if a filter option is active
  const isFilterActive = (type: 'platform' | 'brand' | 'country', value: string) => {
    switch (type) {
      case 'platform':
        return selectedPlatform === value;
      case 'brand':
        return selectedBrand === value;
      case 'country':
        return selectedCountry === value;
      default:
        return false;
    }
  };
  
  // Navigation items - removed as they're now in the top menu
  const navigation: NavItem[] = [];
  
  return (
    <div className={`${expanded ? 'w-64' : 'w-20'} transition-width duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-screen font-quicksand`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className={`${expanded ? 'flex' : 'hidden'} items-center`}>
          <span className="text-xl font-bold text-indigo-600 font-quicksand">Beiersdorf Media Nebula</span>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          {expanded ? (
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {/* Main navigation - removed as it's now in the top menu */}
        
        {/* Platforms filter section */}
        <div className="mb-6">
          {expanded && (
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Platforms
            </h3>
          )}
          <nav className="space-y-1">
            {/* All Platforms option */}
            <button
              type="button"
              key="all-platforms"
              onClick={(e) => handleFilterSelect('platform', 'all', e)}
              className={`${
                selectedPlatform === null
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
            >
              <svg className={`${selectedPlatform === null ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className={`${expanded ? 'block' : 'hidden'} truncate font-medium`}>All Platforms</span>
            </button>
            
            {/* Individual platform options */}
            {platforms.map((platform) => (
              <button
                type="button"
                key={platform.id}
                onClick={(e) => handleFilterSelect('platform', platform.value, e)}
                className={`${
                  isFilterActive('platform', platform.value)
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
              >
                <svg className={`${isFilterActive('platform', platform.value) ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className={`${expanded ? 'block' : 'hidden'} truncate`}>{platform.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Brands filter section */}
        <div className="mb-6">
          {expanded && (
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Brands
            </h3>
          )}
          <nav className="space-y-1">
            {/* All Brands option */}
            <button
              type="button"
              key="all-brands"
              onClick={(e) => handleFilterSelect('brand', 'all', e)}
              className={`${
                selectedBrand === null
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
            >
              <svg className={`${selectedBrand === null ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className={`${expanded ? 'block' : 'hidden'} truncate font-medium`}>All Brands</span>
            </button>
            
            {/* Individual brand options */}
            {brands.map((brand) => (
              <button
                type="button"
                key={brand.id}
                onClick={(e) => handleFilterSelect('brand', brand.value, e)}
                className={`${
                  isFilterActive('brand', brand.value)
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
              >
                <svg className={`${isFilterActive('brand', brand.value) ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className={`${expanded ? 'block' : 'hidden'} truncate`}>{brand.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Month selector removed as it's now in the top menu */}
        
        {/* Countries filter section */}
        <div className="mb-6">
          {expanded && (
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Countries
            </h3>
          )}
          <nav className="space-y-1">
            {/* All Countries option */}
            <button
              type="button"
              key="all-countries"
              onClick={(e) => handleFilterSelect('country', 'all', e)}
              className={`${
                selectedCountry === null
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
            >
              <svg className={`${selectedCountry === null ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`${expanded ? 'block' : 'hidden'} truncate font-medium`}>All Countries</span>
            </button>
            
            {/* Individual country options */}
            {countries.map((country) => (
              <button
                type="button"
                key={country.id}
                onClick={(e) => handleFilterSelect('country', country.value, e)}
                className={`${
                  isFilterActive('country', country.value)
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
              >
                <svg className={`${isFilterActive('country', country.value) ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`${expanded ? 'block' : 'hidden'} truncate`}>{country.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className={`flex ${expanded ? 'items-center justify-between' : 'justify-center'} mb-4`}>
          <div className={`flex ${expanded ? 'items-center' : 'justify-center'}`}>
            <div className="flex-shrink-0">
              <img className="h-10 w-10 rounded-full" src={`https://ui-avatars.com/api/?name=${userData.name}&background=6366F1&color=fff`} alt={userData.name} />
            </div>
            {expanded && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 font-quicksand">{userData.name}</p>
                <p className="text-xs font-medium text-gray-500 font-quicksand">
                  {selectedBrand === '1' ? 'Nivea' : selectedBrand === '2' ? 'Eucerin' : 'All Brands'} - 
                  {selectedPlatform ? selectedPlatform : 'All Platforms'} - 
                  {selectedCountry === '1' ? 'UK' : 
                   selectedCountry === '2' ? 'France' : 
                   selectedCountry === '3' ? 'Germany' : 
                   selectedCountry === '4' ? 'Australia' : 
                   selectedCountry === '5' ? 'US' : 'All Countries'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className={`w-full flex ${expanded ? 'justify-between' : 'justify-center'} items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md`}
        >
          <span className={`${expanded ? 'block' : 'hidden'}`}>Logout</span>
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default UserNavigation;
