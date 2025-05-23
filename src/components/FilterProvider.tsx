'use client';

import { ReactNode, useState } from 'react';
import { FilterContext } from './UserNavigation';

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider = ({ children }: FilterProviderProps) => {
  // State for filters - default to Nivea brand (ID 1)
  const [selectedBrand, setSelectedBrand] = useState<string | null>('1');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  // Use March 2025 as the default month since that's where we have data
  const getDefaultMonth = () => {
    return '2025-03';
  };
  
  const [selectedMonth, setSelectedMonth] = useState<string>(getDefaultMonth());
  
  // Log the initial filter state
  console.log('Initial filter state:', { selectedBrand: 'Nivea (ID: 1)', selectedMonth: getDefaultMonth() });

  return (
    <FilterContext.Provider 
      value={{
        selectedBrand,
        setSelectedBrand,
        selectedPlatform,
        setSelectedPlatform,
        selectedCountry,
        setSelectedCountry,
        selectedMonth,
        setSelectedMonth
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export default FilterProvider;
