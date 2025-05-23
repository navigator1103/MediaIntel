'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface FilterOption {
  id: string | number;
  name: string;
  value: string;
}

// Import React to fix JSX namespace error
import React from 'react';

interface FilterSection {
  title: string;
  type: 'platform' | 'brand' | 'country';
  options: FilterOption[];
  icon: (active: boolean) => React.ReactNode;
}

const LeftNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(true);
  
  // State for filter selections
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  // State for filter options
  const [platforms, setPlatforms] = useState<FilterOption[]>([
    { id: 'meta', name: 'Meta', value: 'Meta' },
    { id: 'google-ads', name: 'Google Ads', value: 'Google Ads' },
    { id: 'tiktok', name: 'TikTok', value: 'TikTok' },
    { id: 'dv360', name: 'DV360', value: 'DV360' }
  ]);
  
  const [brands, setBrands] = useState<FilterOption[]>([
    { id: 1, name: 'Nivea', value: '1' },
    { id: 2, name: 'Eucerin', value: '2' }
  ]);
  
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  
  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await fetch('/api/countries');
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        
        const countriesData = await response.json();
        // Map the countries data to the format expected by the component
        const formattedCountries = countriesData.map((country: any) => ({
          id: country.id,
          name: country.name,
          value: country.id.toString()
        }));
        
        setCountries(formattedCountries);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    
    fetchCountries();
  }, []);
  
  // Initialize filters from URL on component mount
  useEffect(() => {
    const platform = searchParams.get('platform');
    const brand = searchParams.get('brandId');
    const country = searchParams.get('countryId');
    
    if (platform) setSelectedPlatform(platform);
    if (brand) setSelectedBrand(brand);
    if (country) setSelectedCountry(country);
  }, [searchParams]);
  
  // Handle filter selection
  const handleFilterSelect = (type: 'platform' | 'brand' | 'country', value: string) => {
    // Create a new URLSearchParams object based on the current URL search parameters
    const params = new URLSearchParams(searchParams.toString());
    
    // Update the selected filter and URL parameter
    switch (type) {
      case 'platform':
        if (selectedPlatform === value) {
          setSelectedPlatform(null);
          params.delete('platform');
        } else {
          setSelectedPlatform(value);
          params.set('platform', value);
        }
        break;
      case 'brand':
        if (selectedBrand === value) {
          setSelectedBrand(null);
          params.delete('brandId');
        } else {
          setSelectedBrand(value);
          params.set('brandId', value);
        }
        break;
      case 'country':
        if (selectedCountry === value) {
          setSelectedCountry(null);
          params.delete('countryId');
        } else {
          setSelectedCountry(value);
          params.set('countryId', value);
        }
        break;
    }
    
    // Update the URL with the new search parameters
    router.push(`${pathname}?${params.toString()}`);
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
  
  // Define filter sections
  const filterSections: FilterSection[] = [
    {
      title: 'Platforms',
      type: 'platform',
      options: platforms,
      icon: (active) => (
        <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: 'Brands',
      type: 'brand',
      options: brands,
      icon: (active) => (
        <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: 'Countries',
      type: 'country',
      options: countries,
      icon: (active) => (
        <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`${expanded ? 'w-64' : 'w-20'} transition-width duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-screen font-quicksand`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className={`${expanded ? 'flex' : 'hidden'} items-center`}>
          <span className="text-xl font-bold text-indigo-600 font-quicksand">Golden Rules</span>
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
        {filterSections.map((section) => (
          <div key={section.title} className="mb-6">
            {expanded && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            )}
            <nav className="space-y-1">
              {section.type === 'country' && loadingCountries ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    {section.icon(false)}
                    <div className={`${expanded ? 'block' : 'hidden'}`}>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent inline-block mr-2"></div>
                      <span>Loading countries...</span>
                    </div>
                  </div>
                </div>
              ) : section.options.length > 0 ? (
                section.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleFilterSelect(section.type, option.value)}
                    className={`${
                      isFilterActive(section.type, option.value)
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                    } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
                  >
                    {section.icon(isFilterActive(section.type, option.value))}
                    <span className={`${expanded ? 'block' : 'hidden'} truncate`}>{option.name}</span>
                  </button>
                ))
              ) : section.type === 'country' && !loadingCountries ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    {section.icon(false)}
                    <span className={`${expanded ? 'block' : 'hidden'} truncate`}>No countries available</span>
                  </div>
                </div>
              ) : (
                section.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleFilterSelect(section.type, option.value)}
                    className={`${
                      isFilterActive(section.type, option.value)
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                    } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
                  >
                    {section.icon(isFilterActive(section.type, option.value))}
                    <span className={`${expanded ? 'block' : 'hidden'} truncate`}>{option.name}</span>
                  </button>
                ))
              )}
            </nav>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className={`flex ${expanded ? 'items-center' : 'justify-center'}`}>
          <div className="flex-shrink-0">
            <img className="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=User&background=6366F1&color=fff" alt="User" />
          </div>
          {expanded && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 font-quicksand">John Doe</p>
              <p className="text-xs font-medium text-gray-500 font-quicksand">
                {selectedBrand === '1' ? 'Nivea' : selectedBrand === '2' ? 'Eucerin' : 'All Brands'} - 
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
    </div>
  );
};

export default LeftNavigation;
