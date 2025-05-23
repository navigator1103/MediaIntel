'use client';

import { useState, useEffect, useContext } from 'react';
import { FilterContext } from './UserNavigation';

interface FilterOption {
  id: string | number;
  name: string;
  value: string;
}

const TaxonomySidebar = () => {
  const { 
    selectedBrand, setSelectedBrand,
    selectedCountry, setSelectedCountry,
    selectedPlatform, setSelectedPlatform
  } = useContext(FilterContext);

  // Filter options
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [platforms, setPlatforms] = useState<FilterOption[]>([
    { id: 'meta', name: 'Meta', value: 'Meta' },
    { id: 'google-dv360', name: 'Google DV360', value: 'Google DV360' },
    { id: 'tiktok', name: 'TikTok', value: 'TikTok' },
    { id: 'amazon', name: 'Amazon', value: 'Amazon' },
    { id: 'pinterest', name: 'Pinterest', value: 'Pinterest' }
  ]);
  const [loading, setLoading] = useState(true);
  
  // Fetch brands from API
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands');
        if (!response.ok) {
          throw new Error('Failed to fetch brands');
        }
        
        const brandsData = await response.json();
        // Map the brands data to the format expected by the component
        const formattedBrands = brandsData.map((brand: any) => ({
          id: brand.id,
          name: brand.name,
          value: brand.id.toString()
        }));
        
        setBrands(formattedBrands);
      } catch (error) {
        console.error('Error fetching brands:', error);
        // Fallback to default brands if API fails
        setBrands([
          { id: 1, name: 'Nivea', value: '1' },
          { id: 2, name: 'Eucerin', value: '2' },
          { id: 3, name: 'Labello', value: '3' }
        ]);
      }
    };
    
    fetchBrands();
  }, []);
  
  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
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
        setLoading(false);
      }
    };
    
    fetchCountries();
  }, []);

  // Handle filter selection
  const handleFilterSelect = (type: 'brand' | 'country' | 'platform', value: string) => {
    let updatedValue;
    
    // Toggle selection based on filter type using context state
    switch (type) {
      case 'brand':
        // If "all" is selected, set to null (show all brands)
        if (value === 'all') {
          updatedValue = null;
          setSelectedBrand(updatedValue);
        } else {
          updatedValue = selectedBrand === value ? null : value;
          setSelectedBrand(updatedValue);
        }
        console.log(`Brand filter changed to: ${updatedValue || 'all'}`);
        break;
      case 'country':
        // If "all" is selected, set to null (show all countries)
        if (value === 'all') {
          updatedValue = null;
          setSelectedCountry(updatedValue);
        } else {
          updatedValue = selectedCountry === value ? null : value;
          setSelectedCountry(updatedValue);
        }
        console.log(`Country filter changed to: ${updatedValue || 'all'}`);
        break;
      case 'platform':
        // If "all" is selected, set to null (show all platforms)
        if (value === 'all') {
          updatedValue = null;
          setSelectedPlatform(updatedValue);
        } else {
          updatedValue = selectedPlatform === value ? null : value;
          setSelectedPlatform(updatedValue);
        }
        console.log(`Platform filter changed to: ${updatedValue || 'all'}`);
        break;
    }
  };
  
  // Check if a filter option is active
  const isFilterActive = (type: 'brand' | 'country' | 'platform', value: string) => {
    switch (type) {
      case 'brand':
        return selectedBrand === value;
      case 'country':
        return selectedCountry === value;
      case 'platform':
        return selectedPlatform === value;
      default:
        return false;
    }
  };

  // Sidebar expanded state (for responsive design)
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`${expanded ? 'w-64' : 'w-20'} transition-width duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-screen font-quicksand`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className={`${expanded ? 'flex' : 'hidden'} items-center`}>
          <span className="text-xl font-bold text-indigo-600 font-quicksand">Filters</span>
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
              key="all-brands"
              onClick={() => handleFilterSelect('brand', 'all')}
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
                key={brand.id}
                onClick={() => handleFilterSelect('brand', brand.value)}
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
              key="all-countries"
              onClick={() => handleFilterSelect('country', 'all')}
              className={`${
                selectedCountry === null
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
            >
              <svg className={`${selectedCountry === null ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <span className={`${expanded ? 'block' : 'hidden'} truncate font-medium`}>All Countries</span>
            </button>
            
            {/* Individual country options */}
            {countries.map((country) => (
              <button
                key={country.id}
                onClick={() => handleFilterSelect('country', country.value)}
                className={`${
                  isFilterActive('country', country.value)
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
              >
                <svg className={`${isFilterActive('country', country.value) ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span className={`${expanded ? 'block' : 'hidden'} truncate`}>{country.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
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
              key="all-platforms"
              onClick={() => handleFilterSelect('platform', 'all')}
              className={`${
                selectedPlatform === null
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
              } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
            >
              <svg className={`${selectedPlatform === null ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className={`${expanded ? 'block' : 'hidden'} truncate font-medium`}>All Platforms</span>
            </button>
            
            {/* Individual platform options */}
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handleFilterSelect('platform', platform.value)}
                className={`${
                  isFilterActive('platform', platform.value)
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                } group flex items-center w-full px-3 py-2 text-sm font-medium border-l-4 font-quicksand`}
              >
                <svg className={`${isFilterActive('platform', platform.value) ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className={`${expanded ? 'block' : 'hidden'} truncate`}>{platform.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default TaxonomySidebar;
