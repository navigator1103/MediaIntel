'use client';

import { useState, useEffect, useContext } from 'react';
import { FilterContext } from './UserNavigation';

interface FilterOption {
  id: string | number;
  name: string;
  value: string;
}

const FiveStarsSidebar = () => {
  const { 
    selectedBrand, setSelectedBrand,
    selectedCountry, setSelectedCountry
  } = useContext(FilterContext);

  // Filter options
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [countries, setCountries] = useState<FilterOption[]>([]);
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
          { id: 2, name: 'Eucerin', value: '2' }
          // Brand ABC has been removed as requested
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
  const handleFilterSelect = (type: 'brand' | 'country', value: string) => {
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
    }
  };
  
  // Check if a filter option is active
  const isFilterActive = (type: 'brand' | 'country', value: string) => {
    switch (type) {
      case 'brand':
        return selectedBrand === value;
      case 'country':
        return selectedCountry === value;
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`${expanded ? 'block' : 'hidden'} truncate font-medium`}>All Countries</span>
            </button>
            
            {/* Individual country options */}
            {loading ? (
              <div className="flex justify-center items-center h-12 py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              </div>
            ) : countries.length > 0 ? (
              countries.map((country) => (
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`${expanded ? 'block' : 'hidden'} truncate`}>{country.name}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                <span className={`${expanded ? 'block' : 'hidden'}`}>No countries available</span>
              </div>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default FiveStarsSidebar;
