'use client';

import { useState, useEffect, useContext } from 'react';
import { FilterContext } from '@/components/UserNavigation';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define the country interface
interface Country {
  id: number;
  name: string;
}

// Define the brand interface
interface Brand {
  id: number;
  name: string;
}

// Define the taxonomy score interface
interface TaxonomyScore {
  id: number;
  countryId: number;
  brandId?: number;
  platform?: string;
  month: string;
  l1Score: number;
  l2Score: number;
  l3Score: number;
  averageScore: number;
  country: Country;
  brand?: Brand;
}

const TaxonomyPage = () => {
  // Get filter state from context
  const { 
    selectedCountry, setSelectedCountry,
    selectedMonth, setSelectedMonth,
    selectedBrand, setSelectedBrand,
    selectedPlatform, setSelectedPlatform
  } = useContext(FilterContext);
  
  // State for data
  const [taxonomyScores, setTaxonomyScores] = useState<TaxonomyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch data
  const fetchTaxonomyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Always include month parameter - it's required for filtering
      if (selectedMonth) {
        params.append('month', selectedMonth);
        console.log('Adding month param:', selectedMonth);
      } else {
        // If no month is selected, use current month as fallback
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        params.append('month', currentMonth);
        console.log('No month selected, using current month:', currentMonth);
      }
      
      // Add country filter if selected
      if (selectedCountry) {
        params.append('countryId', selectedCountry);
        console.log('Adding country param:', selectedCountry);
      }
      
      // Add brand filter if selected
      if (selectedBrand) {
        params.append('brandId', selectedBrand);
        console.log('Adding brand param:', selectedBrand);
      }
      
      // Add platform filter if selected
      if (selectedPlatform) {
        params.append('platform', selectedPlatform);
        console.log('Adding platform param:', selectedPlatform);
      }
      
      console.log('Fetching taxonomy data with params:', params.toString());
      
      // Fetch taxonomy scores
      const response = await fetch(`/api/taxonomy?${params.toString()}`, {
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch taxonomy scores: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} taxonomy scores from API`);
      
      if (data.length === 0) {
        console.warn('No data found for the selected filters:', { 
          month: selectedMonth, 
          country: selectedCountry, 
          brand: selectedBrand, 
          platform: selectedPlatform 
        });
      }
      
      setTaxonomyScores(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching taxonomy data:', err);
      setTaxonomyScores([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    console.log('Filter changed - Month:', selectedMonth, 'Country:', selectedCountry, 'Brand:', selectedBrand, 'Platform:', selectedPlatform);
    
    // Only fetch data if we have a valid month
    if (selectedMonth) {
      console.log('Fetching data for month:', selectedMonth);
      fetchTaxonomyData();
    } else {
      console.warn('Not fetching data because month is not selected');
    }
  }, [selectedMonth, selectedCountry, selectedBrand, selectedPlatform]);

  // Set default month to current month on component mount
  useEffect(() => {
    // Only set a default month if none is selected
    if (!selectedMonth) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentMonth = `${year}-${month}`;
      console.log('Setting default month to:', currentMonth);
      setSelectedMonth(currentMonth);
    } else {
      console.log('Using existing month from context:', selectedMonth);
    }
  }, []);

  // Prepare chart data
  const prepareChartData = () => {
    // Determine the labels based on what's being filtered
    let labels = [];
    let labelField = '';
    
    if (selectedBrand && selectedPlatform && selectedCountry) {
      // If all three are selected, use country names as labels
      labels = taxonomyScores.map(score => score.country.name);
      labelField = 'country';
    } else if (selectedBrand && selectedPlatform) {
      // If brand and platform are selected, use country names
      labels = taxonomyScores.map(score => score.country.name);
      labelField = 'country';
    } else if (selectedBrand && selectedCountry) {
      // If brand and country are selected, use platform
      labels = taxonomyScores.map(score => score.platform || 'All Platforms');
      labelField = 'platform';
    } else if (selectedPlatform && selectedCountry) {
      // If platform and country are selected, use brand
      labels = taxonomyScores.map(score => score.brand ? score.brand.name : 'All Brands');
      labelField = 'brand';
    } else if (selectedBrand) {
      // If only brand is selected, use country
      labels = taxonomyScores.map(score => score.country.name);
      labelField = 'country';
    } else if (selectedPlatform) {
      // If only platform is selected, use country
      labels = taxonomyScores.map(score => score.country.name);
      labelField = 'country';
    } else if (selectedCountry) {
      // If only country is selected, use brand or platform
      labels = taxonomyScores.map(score => {
        const brandName = score.brand ? score.brand.name : 'All Brands';
        const platformName = score.platform || 'All Platforms';
        return `${brandName} - ${platformName}`;
      });
      labelField = 'brand-platform';
    } else {
      // If nothing is selected, use country
      labels = taxonomyScores.map(score => score.country.name);
      labelField = 'country';
    }
    
    // Make labels unique
    labels = [...new Set(labels)];
    
    // Prepare datasets
    const l1Data = labels.map(label => {
      const matchingScores = taxonomyScores.filter(score => {
        if (labelField === 'country') {
          return score.country.name === label;
        } else if (labelField === 'platform') {
          return score.platform === label || (label === 'All Platforms' && !score.platform);
        } else if (labelField === 'brand') {
          return score.brand && score.brand.name === label || (label === 'All Brands' && !score.brand);
        } else if (labelField === 'brand-platform') {
          const brandName = score.brand ? score.brand.name : 'All Brands';
          const platformName = score.platform || 'All Platforms';
          return `${brandName} - ${platformName}` === label;
        }
        return false;
      });
      
      // Calculate average L1 score for matching scores
      if (matchingScores.length > 0) {
        return matchingScores.reduce((sum, score) => sum + score.l1Score, 0) / matchingScores.length;
      }
      return 0;
    });
    
    const l2Data = labels.map(label => {
      const matchingScores = taxonomyScores.filter(score => {
        if (labelField === 'country') {
          return score.country.name === label;
        } else if (labelField === 'platform') {
          return score.platform === label || (label === 'All Platforms' && !score.platform);
        } else if (labelField === 'brand') {
          return score.brand && score.brand.name === label || (label === 'All Brands' && !score.brand);
        } else if (labelField === 'brand-platform') {
          const brandName = score.brand ? score.brand.name : 'All Brands';
          const platformName = score.platform || 'All Platforms';
          return `${brandName} - ${platformName}` === label;
        }
        return false;
      });
      
      // Calculate average L2 score for matching scores
      if (matchingScores.length > 0) {
        return matchingScores.reduce((sum, score) => sum + score.l2Score, 0) / matchingScores.length;
      }
      return 0;
    });
    
    const l3Data = labels.map(label => {
      const matchingScores = taxonomyScores.filter(score => {
        if (labelField === 'country') {
          return score.country.name === label;
        } else if (labelField === 'platform') {
          return score.platform === label || (label === 'All Platforms' && !score.platform);
        } else if (labelField === 'brand') {
          return score.brand && score.brand.name === label || (label === 'All Brands' && !score.brand);
        } else if (labelField === 'brand-platform') {
          const brandName = score.brand ? score.brand.name : 'All Brands';
          const platformName = score.platform || 'All Platforms';
          return `${brandName} - ${platformName}` === label;
        }
        return false;
      });
      
      // Calculate average L3 score for matching scores
      if (matchingScores.length > 0) {
        return matchingScores.reduce((sum, score) => sum + score.l3Score, 0) / matchingScores.length;
      }
      return 0;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'L1 Score',
          data: l1Data,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
        },
        {
          label: 'L2 Score',
          data: l2Data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1,
        },
        {
          label: 'L3 Score',
          data: l3Data,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  const chartData = taxonomyScores.length > 0 ? prepareChartData() : { labels: [], datasets: [] };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Taxonomy Scores ${selectedMonth ? `for ${selectedMonth}` : ''}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  // Generate month options for the selector
  const generateMonthOptions = () => {
    const options = [];
    
    // Add options for 2024-01 through 2025-03 to ensure we have data
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Add 2024 months
    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString().padStart(2, '0');
      const value = `2024-${monthStr}`;
      const label = `${monthNames[i-1]} 2024`;
      options.push({ value, label });
    }
    
    // Add 2025 months (January to March)
    for (let i = 1; i <= 3; i++) {
      const monthStr = i.toString().padStart(2, '0');
      const value = `2025-${monthStr}`;
      const label = `${monthNames[i-1]} 2025`;
      options.push({ value, label });
    }
    
    // Sort options by date (newest first)
    options.sort((a, b) => b.value.localeCompare(a.value));
    
    return options;
  };
  
  const monthOptions = generateMonthOptions();
  
  // Handle month change
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    console.log('Month changed to:', newMonth);
    
    // Update the month in the context
    setSelectedMonth(newMonth);
    
    // No need to call fetchTaxonomyData() here as the useEffect will handle it
    // This prevents duplicate API calls
  };

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = taxonomyScores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(taxonomyScores.length / itemsPerPage);
  
  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  return (
    <div className="p-6 w-full">
      <div className="w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold">Taxonomy Scores</h1>
            
            {/* Month selector */}
            <div className="mt-4 md:mt-0">
              <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Month
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
              <button 
                className="float-right font-bold"
                onClick={() => setError(null)}
              >
                &times;
              </button>
            </div>
          )}
          
          {/* Loading indicator */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : taxonomyScores.length === 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No taxonomy scores found for the selected filters. Try changing your filters or adding new scores.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Taxonomy Score Comparison</h2>
                <div className="h-80">
                  <Bar options={chartOptions} data={chartData} />
                </div>
              </div>
              
              {/* Table */}
              <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
                <h2 className="text-xl font-semibold mb-4">Detailed Scores</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platform
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        L1 Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        L2 Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        L3 Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((score) => {
                      return (
                        <tr key={score.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {score.country.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {score.brand ? score.brand.name : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {score.platform || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {score.l1Score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {score.l2Score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {score.l3Score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                            {score.averageScore}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Pagination */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <span className="text-sm text-gray-700 mr-2">
                      Rows per page:
                    </span>
                    <select
                      className="border border-gray-300 rounded-md text-sm p-1"
                      value={itemsPerPage}
                      onChange={handleItemsPerPageChange}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <span className="text-sm text-gray-700 ml-4">
                      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, taxonomyScores.length)} of {taxonomyScores.length}
                    </span>
                  </div>
                  
                  <div className="flex">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-l-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 border-t border-b ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-r-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default TaxonomyPage;
