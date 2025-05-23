'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import Navigation from '@/components/Navigation';
import FiveStarsSidebar from '@/components/FiveStarsSidebar';
import { FilterContext } from '@/components/UserNavigation';
import { prisma } from '@/lib/prisma';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Define the criteria interface
interface Criterion {
  id: number;
  name: string;
  description: string;
}

// Define the country interface
interface Country {
  id: number;
  name: string;
  ratings: Record<number, number>; // Maps criterion ID to rating (1-5)
}

// Define the brand interface
interface Brand {
  id: number;
  name: string;
}

const FiveStarsPage = () => {
  // Get filter state from context
  const { selectedBrand, selectedCountry, selectedMonth, setSelectedMonth } = useContext(FilterContext);
  
  // State for criteria, countries, brands, and trends
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [previousMonthData, setPreviousMonthData] = useState<{[countryId: number]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get previous month
  const getPreviousMonth = (month: string) => {
    const [year, monthNum] = month.split('-').map(part => parseInt(part));
    let prevMonth = monthNum - 1;
    let prevYear = year;
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  };
  
  // Function to fetch data directly using client-side code
  const fetchFiveStarsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the request data for current month
      const currentMonth = selectedMonth || '2025-03';
      const requestData = {
        month: currentMonth,
        brandId: selectedBrand ? Number(selectedBrand) : undefined,
        countryId: selectedCountry ? Number(selectedCountry) : undefined
      };
      
      // Prepare the request data for previous month
      const previousMonth = getPreviousMonth(currentMonth);
      const previousMonthRequestData = {
        month: previousMonth,
        brandId: selectedBrand ? Number(selectedBrand) : undefined,
        countryId: selectedCountry ? Number(selectedCountry) : undefined
      };
      
      console.log('Fetching data with params:', requestData);
      
      // Use fetch with a POST request to avoid URL length limitations
      const response = await fetch('/api/five-stars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the JSON, just use the status code
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Received current month data:', data);
      
      if (!data.criteria || !data.countries) {
        throw new Error('Invalid data format received from server');
      }
      
      // Fetch previous month data for trend analysis
      console.log('Fetching previous month data with params:', previousMonthRequestData);
      const previousResponse = await fetch('/api/five-stars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previousMonthRequestData),
      });
      
      // Process previous month data if available
      const previousData = previousResponse.ok ? await previousResponse.json() : null;
      console.log('Received previous month data:', previousData);
      
      // Calculate previous month averages for trend analysis
      const prevMonthAverages: {[countryId: number]: number} = {};
      if (previousData && previousData.countries) {
        previousData.countries.forEach((country: Country) => {
          const ratings = Object.values(country.ratings);
          if (ratings.length > 0) {
            const sum = ratings.reduce((acc, rating) => acc + rating, 0);
            prevMonthAverages[country.id] = sum / ratings.length;
          }
        });
      }
      
      // Update state with all the data
      setCriteria(data.criteria);
      setCountries(data.countries);
      setPreviousMonthData(prevMonthAverages);
      
      // Set current brand information if a brand is selected
      if (selectedBrand && data.brand) {
        setCurrentBrand(data.brand);
      } else {
        setCurrentBrand(null);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data when filters change
  useEffect(() => {
    console.log('Filters changed, fetching data with:', {
      month: selectedMonth,
      brand: selectedBrand,
      country: selectedCountry
    });
    fetchFiveStarsData();
  }, [selectedMonth, selectedBrand, selectedCountry]);
  
  // Function to handle month change
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    console.log('Changing month to:', newMonth);
    setSelectedMonth(newMonth);
  };
  
  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
      options.push({ value, label });
    }
    
    return options;
  };
  
  // No need to filter countries here as the API already handles filtering

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Calculate average rating for a country
  const calculateAverageRating = (country: Country) => {
    const ratings = Object.values(country.ratings);
    if (ratings.length === 0) return '0.0';
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return (sum / ratings.length).toFixed(1);
  };
  
  // Calculate trend compared to previous month
  const calculateTrend = (country: Country) => {
    const currentAvg = parseFloat(calculateAverageRating(country));
    const prevAvg = previousMonthData[country.id] || 0;
    
    if (prevAvg === 0) return { value: 0, label: 'No previous data' };
    
    const difference = currentAvg - prevAvg;
    const percentChange = (difference / prevAvg) * 100;
    
    return {
      value: difference,
      percent: percentChange.toFixed(1),
      label: difference === 0 ? 'No change' : difference > 0 ? 'Improved' : 'Declined'
    };
  };
  
  // Render trend indicator
  const renderTrendIndicator = (trend: { value: number, percent?: string, label: string }) => {
    if (trend.value === 0) {
      return (
        <div className="flex items-center text-gray-500">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14"></path>
          </svg>
          <span>{trend.label}</span>
        </div>
      );
    } else if (trend.value > 0) {
      return (
        <div className="flex items-center text-green-500">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
          </svg>
          <span>+{trend.value.toFixed(1)} ({trend.percent}%)</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-500">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          <span>{trend.value.toFixed(1)} ({trend.percent}%)</span>
        </div>
      );
    }
  };
  
  // Function to create gradient background for chart
  const createGradient = (ctx: any) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.9)');   // Indigo-500
    gradient.addColorStop(1, 'rgba(129, 140, 248, 0.6)');  // Indigo-400
    return gradient;
  };
  
  // Prepare data for the bar chart
  const prepareChartData = () => {
    if (!countries.length) return null;
    
    // Sort countries by average rating (descending)
    const sortedCountries = [...countries].sort((a, b) => {
      const avgA = parseFloat(calculateAverageRating(a));
      const avgB = parseFloat(calculateAverageRating(b));
      return avgB - avgA;
    });
    
    // Get chart canvas context for gradient
    const canvas = document.getElementById('five-stars-chart') as HTMLCanvasElement;
    let gradient = 'rgba(79, 70, 229, 0.8)';
    
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        gradient = createGradient(ctx);
      }
    }
    
    return {
      labels: sortedCountries.map(country => country.name),
      datasets: [
        {
          label: '5 Stars Rating',
          data: sortedCountries.map(country => parseFloat(calculateAverageRating(country))),
          backgroundColor: gradient,
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(67, 56, 202, 0.9)',  // Indigo-700
        },
      ],
    };
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    font: {
      family: 'Quicksand, sans-serif',
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          font: {
            family: 'Quicksand, sans-serif',
          },
        },
        title: {
          display: true,
          text: 'Average Rating',
          font: {
            family: 'Quicksand, sans-serif',
            weight: 'bold',
          },
        },
      },
      x: {
        title: {
          display: true,
          text: 'Countries',
          font: {
            family: 'Quicksand, sans-serif',
            weight: 'bold',
          },
        },
        ticks: {
          font: {
            family: 'Quicksand, sans-serif',
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            family: 'Quicksand, sans-serif',
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: '5 Stars Ratings by Country',
        font: {
          family: 'Quicksand, sans-serif',
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        titleFont: {
          family: 'Quicksand, sans-serif',
        },
        bodyFont: {
          family: 'Quicksand, sans-serif',
        },
        callbacks: {
          label: (context: any) => `Rating: ${context.parsed.y.toFixed(1)}`,
        },
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FiveStarsSidebar />
      <div className="flex-1 py-8 px-4 pt-16">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-600 font-quicksand">5 Stars Rating System</h1>
            
            {/* Month selector */}
            <div className="w-64">
              <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={handleMonthChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {getMonthOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">5 Stars Scores by Country</h2>
            <div className="w-full">
              {loading ? (
                <div className="py-8 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                  <p className="mt-2 text-gray-600">Loading data...</p>
                </div>
              ) : error ? (
                <div className="py-8 text-center text-red-500">{error}</div>
              ) : countries.length === 0 ? (
                <div className="py-8 text-center text-gray-600">No data available for the selected filters.</div>
              ) : (
                <div className="flex flex-col space-y-8">
                  {/* Two-column layout for chart and summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Bar Chart - Left Side (2/3 width) */}
                    <div className="bg-white rounded-lg shadow-md p-6 h-96 md:col-span-2 border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        5 Stars Ratings by Country
                      </h3>
                      <div className="h-80">
                        <Bar id="five-stars-chart" data={prepareChartData() || {labels: [], datasets: []}} options={chartOptions} />
                      </div>
                    </div>
                    
                    {/* Summary Box - Right Side (1/3 width) */}
                    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-96 border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        {selectedCountry 
                          ? countries.find(c => c.id.toString() === selectedCountry)?.name + ' Summary' 
                          : 'Overall Summary'}
                      </h3>
                      
                      {selectedCountry && countries.length > 0 ? (
                        // Single country summary
                        (() => {
                          const country = countries.find(c => c.id.toString() === selectedCountry);
                          if (!country) return <p>No data available</p>;
                          
                          const avgRating = parseFloat(calculateAverageRating(country));
                          const trend = calculateTrend(country);
                          
                          return (
                            <div className="space-y-4">
                              <div className="text-center">
                                <p className="text-gray-600 mb-2">Average Rating</p>
                                <div className="flex flex-col items-center">
                                  <span className="text-5xl font-bold text-indigo-600">{avgRating.toFixed(1)}</span>
                                  <div className="flex items-center mt-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <svg 
                                        key={star} 
                                        className={`w-8 h-8 ${star <= avgRating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20" 
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-center mt-4 bg-gray-50 py-3 rounded-lg">
                                <p className="text-gray-600 mb-3">Trend vs Previous Month</p>
                                <div className="flex justify-center">
                                  {renderTrendIndicator(trend)}
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-gray-600 mb-2">Top Criterion</p>
                                {Object.entries(country.ratings).length > 0 ? (
                                  (() => {
                                    const topCriterionId = Object.entries(country.ratings)
                                      .sort(([, a], [, b]) => b - a)[0][0];
                                    const topCriterion = criteria.find(c => c.id.toString() === topCriterionId);
                                    return (
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">{topCriterion?.name || 'Unknown'}</span>
                                        <div className="flex">
                                          <span className="font-bold text-indigo-600 mr-2">
                                            {country.ratings[parseInt(topCriterionId)]}
                                          </span>
                                          {renderStars(country.ratings[parseInt(topCriterionId)])}
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <p>No criteria data available</p>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        // Overall summary
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="text-gray-600 mb-2">Average Rating Across Countries</p>
                            {countries.length > 0 ? (
                              (() => {
                                const allRatings = countries.map(c => parseFloat(calculateAverageRating(c)));
                                const overallAvg = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;
                                
                                return (
                                  <div className="flex flex-col items-center">
                                    <span className="text-5xl font-bold text-indigo-600">{overallAvg.toFixed(1)}</span>
                                    <div className="flex items-center mt-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <svg 
                                          key={star} 
                                          className={`w-8 h-8 ${star <= overallAvg ? 'text-yellow-400' : 'text-gray-300'}`} 
                                          fill="currentColor" 
                                          viewBox="0 0 20 20" 
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <p>No data available</p>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-gray-600 mb-2">Top Performing Country</p>
                            {countries.length > 0 ? (
                              (() => {
                                const sortedCountries = [...countries].sort((a, b) => {
                                  return parseFloat(calculateAverageRating(b)) - parseFloat(calculateAverageRating(a));
                                });
                                const topCountry = sortedCountries[0];
                                const topRating = parseFloat(calculateAverageRating(topCountry));
                                
                                return (
                                  <div className="flex flex-col items-center">
                                    <span className="font-medium text-lg mb-1">{topCountry.name}</span>
                                    <div className="flex items-center">
                                      <span className="font-bold text-indigo-600 mr-2">{topRating.toFixed(1)}</span>
                                      {renderStars(topRating)}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <p>No country data available</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Country Ratings Table */}
                  <div className="overflow-x-auto bg-white rounded-lg shadow-md p-6 mt-6 border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Detailed Ratings {currentBrand && `for ${currentBrand.name}`}
                    </h3>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Country
                          </th>
                          {criteria.map(criterion => (
                            <th key={criterion.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {criterion.name}
                            </th>
                          ))}
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Average Rating
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[...countries].sort((a, b) => {
                          const avgA = parseFloat(calculateAverageRating(a));
                          const avgB = parseFloat(calculateAverageRating(b));
                          return avgB - avgA;
                        }).map((country) => (
                          <tr key={country.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {country.name}
                            </td>
                            {/* Display individual ratings for each criterion */}
                            {criteria.map(criterion => (
                              <td key={criterion.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {country.ratings[criterion.id] ? (
                                  <div className="flex items-center">
                                    <span className="mr-2 font-medium text-indigo-600">{country.ratings[criterion.id]}</span>
                                    {renderStars(country.ratings[criterion.id])}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                              <div className="flex items-center">
                                <span className="mr-2">{calculateAverageRating(country)}</span>
                                {renderStars(parseFloat(calculateAverageRating(country)))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">About the 5 Stars System</h2>
            <p className="text-gray-600">
              The 5 Stars Rating System provides a standardized way to evaluate media performance across different countries and brands.
              Each criterion is rated on a scale of 1 to 5 stars, with 5 being the highest rating. The average rating gives
              an overall performance indicator for each country and brand combination. Data is updated monthly to track performance over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiveStarsPage;
