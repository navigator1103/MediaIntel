'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ChangeRequestList from '@/components/ChangeRequestList';

export default function AdminChangeRequestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get initial filters from URL
  const initialStatus = searchParams.get('status') || 'Submitted for Review';
  const initialTimeframe = searchParams.get('timeframe') || 'all';
  const initialBrandId = searchParams.get('brandId') || '';
  const initialCountryId = searchParams.get('countryId') || '';
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string | undefined>(initialStatus || undefined);
  const [timeframeFilter, setTimeframeFilter] = useState(initialTimeframe);
  const [brandFilter, setBrandFilter] = useState(initialBrandId);
  const [countryFilter, setCountryFilter] = useState(initialCountryId);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  const [countries, setCountries] = useState<{id: number, name: string}[]>([]);
  const [activeTab, setActiveTab] = useState(initialStatus === '' ? 'all' : 
    initialStatus === 'Approved' || initialStatus === 'Rejected' ? 'history' : 'pending');
  
  // Fetch brands and countries for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch brands
        const brandsResponse = await fetch('/api/brands');
        if (brandsResponse.ok) {
          const brandsData = await brandsResponse.json();
          setBrands(brandsData);
        }
        
        // Fetch countries
        const countriesResponse = await fetch('/api/countries');
        if (countriesResponse.ok) {
          const countriesData = await countriesResponse.json();
          setCountries(countriesData);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  // Update URL when filters change
  const updateFilters = (newStatus?: string, newTimeframe?: string, newBrandId?: string, newCountryId?: string) => {
    const status = newStatus !== undefined ? newStatus : statusFilter;
    const timeframe = newTimeframe || timeframeFilter;
    const brandId = newBrandId !== undefined ? newBrandId : brandFilter;
    const countryId = newCountryId !== undefined ? newCountryId : countryFilter;
    
    // Build query params
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (timeframe && timeframe !== 'all') params.set('timeframe', timeframe);
    if (brandId) params.set('brandId', brandId);
    if (countryId) params.set('countryId', countryId);
    
    // Update URL
    const newUrl = `/admin/change-requests${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl);
  };
  
  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Update status filter based on tab
    let newStatus;
    if (tab === 'pending') {
      newStatus = 'Submitted for Review';
    } else if (tab === 'history') {
      // For history tab, we'll show both approved and rejected by default
      // but we'll let the status filter handle the specific filtering
      newStatus = statusFilter === 'Submitted for Review' ? 'Approved' : statusFilter;
    } else { // 'all' tab
      newStatus = '';
    }
    
    setStatusFilter(newStatus || undefined);
    updateFilters(newStatus || undefined);
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Change Request Management</h1>
        <p className="mt-1 text-sm text-gray-500">Review, approve, or reject change requests and view historical data.</p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('pending')}
            className={`${activeTab === 'pending' ? 
              'border-indigo-500 text-indigo-600' : 
              'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`${activeTab === 'history' ? 
              'border-indigo-500 text-indigo-600' : 
              'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Request History
          </button>
          <button
            onClick={() => handleTabChange('all')}
            className={`${activeTab === 'all' ? 
              'border-indigo-500 text-indigo-600' : 
              'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            All Requests
          </button>
        </nav>
      </div>
      
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="statusFilter"
            name="statusFilter"
            value={statusFilter || ''}
            onChange={(e) => {
              const newStatus = e.target.value || undefined;
              setStatusFilter(newStatus);
              updateFilters(newStatus);
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={activeTab === 'pending'}
          >
            <option value="">All Statuses</option>
            <option value="Submitted for Review">Submitted for Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        
        {/* Timeframe Filter */}
        <div>
          <label htmlFor="timeframeFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Timeframe
          </label>
          <select
            id="timeframeFilter"
            name="timeframeFilter"
            value={timeframeFilter}
            onChange={(e) => {
              setTimeframeFilter(e.target.value);
              updateFilters(undefined, e.target.value);
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        
        {/* Brand Filter */}
        <div>
          <label htmlFor="brandFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <select
            id="brandFilter"
            name="brandFilter"
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              updateFilters(undefined, undefined, e.target.value);
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>
        
        {/* Country Filter */}
        <div>
          <label htmlFor="countryFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            id="countryFilter"
            name="countryFilter"
            value={countryFilter}
            onChange={(e) => {
              setCountryFilter(e.target.value);
              updateFilters(undefined, undefined, undefined, e.target.value);
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>{country.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Title based on active tab */}
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          {activeTab === 'pending' && 'Pending Change Requests'}
          {activeTab === 'history' && 'Change Request History'}
          {activeTab === 'all' && 'All Change Requests'}
        </h2>
      </div>
      
      {/* Change Request List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ChangeRequestList 
          statusFilter={statusFilter} 
          isAdmin={true} 
          brandId={brandFilter || undefined}
          countryId={countryFilter || undefined}
          timeframe={timeframeFilter !== 'all' ? timeframeFilter : undefined}
        />
      </div>
    </div>
  );
}
