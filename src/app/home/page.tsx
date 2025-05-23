'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { FilterContext } from '@/components/UserNavigation';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

export default function HomePage() {
  const { selectedMonth, setSelectedMonth } = useContext(FilterContext);
  const [goldenRulesScore, setGoldenRulesScore] = useState<number>(85); // Hardcoded score
  const [fiveStarsScore, setFiveStarsScore] = useState<number>(4.2); // Hardcoded score
  const [taxonomyScore, setTaxonomyScore] = useState<number>(78); // Hardcoded taxonomy score
  const [goldenRulesHistory, setGoldenRulesHistory] = useState<{month: string, score: number}[]>([
    { month: 'Jan', score: 76 },
    { month: 'Feb', score: 77 },
    { month: 'Mar', score: 78 },
    { month: 'Apr', score: 80 },
    { month: 'May', score: 82 },
    { month: 'Jun', score: 85 }
  ]);
  const [fiveStarsHistory, setFiveStarsHistory] = useState<{month: string, score: number}[]>([
    { month: 'Jan', score: 3.6 },
    { month: 'Feb', score: 3.7 },
    { month: 'Mar', score: 3.8 },
    { month: 'Apr', score: 3.9 },
    { month: 'May', score: 4.0 },
    { month: 'Jun', score: 4.2 }
  ]);
  const [taxonomyHistory, setTaxonomyHistory] = useState<{month: string, score: number}[]>([
    { month: 'Jan', score: 69 },
    { month: 'Feb', score: 71 },
    { month: 'Mar', score: 73 },
    { month: 'Apr', score: 75 },
    { month: 'May', score: 76 },
    { month: 'Jun', score: 78 }
  ]);
  const [countryGoldenRulesScores, setCountryGoldenRulesScores] = useState<{country: string, score: number}[]>([
    { country: 'Brazil', score: 88 },
    { country: 'India', score: 82 },
    { country: 'South Africa', score: 91 },
    { country: 'Mexico', score: 79 },
    { country: 'Chile', score: 85 },
    { country: 'Thailand', score: 83 }
  ]);
  const [countryFiveStarsScores, setCountryFiveStarsScores] = useState<{country: string, score: number}[]>([
    { country: 'Brazil', score: 4.5 },
    { country: 'India', score: 3.9 },
    { country: 'South Africa', score: 4.7 },
    { country: 'Mexico', score: 4.1 },
    { country: 'Chile', score: 4.3 },
    { country: 'Thailand', score: 4.2 }
  ]);
  const [countryTaxonomyScores, setCountryTaxonomyScores] = useState<{country: string, score: number}[]>([
    { country: 'Brazil', score: 81 },
    { country: 'India', score: 76 },
    { country: 'South Africa', score: 85 },
    { country: 'Mexico', score: 72 },
    { country: 'Chile', score: 79 },
    { country: 'Thailand', score: 75 }
  ]);
  const [loading, setLoading] = useState(false); // Start with loading false
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  
  // Reference for the month selector dropdown
  const monthSelectorRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close the month selector dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (monthSelectorRef.current && !monthSelectorRef.current.contains(event.target as Node)) {
        setIsMonthSelectorOpen(false);
      }
    }
    
    // Add event listener when dropdown is open
    if (isMonthSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthSelectorOpen]);

  // Set default month if not already set
  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth('2024-01'); // Use January 2024 as default
    }
  }, [selectedMonth, setSelectedMonth]);

  // Simple month change handler - just for demonstration
  useEffect(() => {
    if (!selectedMonth) return;
    
    console.log('Month changed to:', selectedMonth);
    
    // Simulate loading for 1 second when month changes
    setLoading(true);
    setError(null);
    setNoData(false);
    
    const timeoutId = setTimeout(() => {
      setLoading(false);
      
      // Show no data message for specific months (for demonstration)
      if (selectedMonth === '2025-03') {
        setNoData(true);
        console.log('No data available for March 2025');
      } else {
        // For other months, show hardcoded data
        setNoData(false);
        
        // Vary the scores slightly based on month
        const monthNum = parseInt(selectedMonth.split('-')[1]);
        const newGoldenRulesScore = 75 + monthNum;
        const newFiveStarsScore = 3.5 + (monthNum * 0.1);
        const newTaxonomyScore = 68 + (monthNum * 1.2);
        
        setGoldenRulesScore(newGoldenRulesScore);
        setFiveStarsScore(newFiveStarsScore);
        setTaxonomyScore(newTaxonomyScore);
        
        // Update history data for the line charts
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        setGoldenRulesHistory(months.map((month, i) => ({
          month,
          score: 75 + Math.min(monthNum, 6) - 5 + i
        })));
        
        setFiveStarsHistory(months.map((month, i) => ({
          month,
          score: 3.5 + (Math.min(monthNum, 6) - 5 + i) * 0.1
        })));
        
        setTaxonomyHistory(months.map((month, i) => ({
          month,
          score: 68 + (Math.min(monthNum, 6) - 5 + i) * 1.2
        })));
        
        // Update country scores based on month
        setCountryGoldenRulesScores([
          { country: 'Brazil', score: 78 + monthNum },
          { country: 'India', score: 72 + monthNum },
          { country: 'South Africa', score: 81 + monthNum },
          { country: 'Mexico', score: 69 + monthNum },
          { country: 'Chile', score: 75 + monthNum },
          { country: 'Thailand', score: 73 + monthNum }
        ]);
        
        setCountryFiveStarsScores([
          { country: 'Brazil', score: 3.5 + (monthNum * 0.1) },
          { country: 'India', score: 3.2 + (monthNum * 0.07) },
          { country: 'South Africa', score: 3.7 + (monthNum * 0.1) },
          { country: 'Mexico', score: 3.1 + (monthNum * 0.1) },
          { country: 'Chile', score: 3.3 + (monthNum * 0.1) },
          { country: 'Thailand', score: 3.4 + (monthNum * 0.08) }
        ]);
        
        setCountryTaxonomyScores([
          { country: 'Brazil', score: 71 + (monthNum * 1) },
          { country: 'India', score: 66 + (monthNum * 1) },
          { country: 'South Africa', score: 75 + (monthNum * 1) },
          { country: 'Mexico', score: 62 + (monthNum * 1) },
          { country: 'Chile', score: 69 + (monthNum * 1) },
          { country: 'Thailand', score: 65 + (monthNum * 1) }
        ]);
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [selectedMonth]);
  
  // Chart data for Golden Rules
  const goldenRulesChartData = {
    labels: ['Score', 'Remaining'],
    datasets: [
      {
        data: [goldenRulesScore || 0, 100 - (goldenRulesScore || 0)],
        backgroundColor: [
          'rgba(20, 184, 166, 0.8)', // teal-500 with opacity
          'rgba(240, 240, 240, 0.5)',
        ],
        borderColor: [
          'rgba(20, 184, 166, 1)', // teal-500
          'rgba(240, 240, 240, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for 5 Stars
  const fiveStarsChartData = {
    labels: ['Rating', 'Remaining'],
    datasets: [
      {
        data: [fiveStarsScore || 0, 5 - (fiveStarsScore || 0)],
        backgroundColor: [
          'rgba(153, 102, 255, 0.8)',
          'rgba(240, 240, 240, 0.5)',
        ],
        borderColor: [
          'rgba(153, 102, 255, 1)',
          'rgba(240, 240, 240, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for Taxonomy
  const taxonomyChartData = {
    labels: ['Score', 'Remaining'],
    datasets: [
      {
        data: [taxonomyScore || 0, 100 - (taxonomyScore || 0)],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue-500 with opacity
          'rgba(240, 240, 240, 0.5)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)', // blue-500
          'rgba(240, 240, 240, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };
  
  // Line chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };
  
  // Line chart options for 5 Stars (different scale)
  const fiveStarsLineChartOptions = {
    ...lineChartOptions,
    scales: {
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales.y,
        min: 3,
        max: 5,
        ticks: {
          stepSize: 0.5,
          precision: 1,
        },
      },
    },
  };
  
  // Golden Rules line chart data
  const goldenRulesLineData = {
    labels: goldenRulesHistory.map(item => item.month),
    datasets: [
      {
        data: goldenRulesHistory.map(item => item.score),
        borderColor: 'rgba(20, 184, 166, 1)',
        backgroundColor: 'rgba(20, 184, 166, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(20, 184, 166, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.2,
      },
    ],
  };
  
  // 5 Stars line chart data
  const fiveStarsLineData = {
    labels: fiveStarsHistory.map(item => item.month),
    datasets: [
      {
        data: fiveStarsHistory.map(item => item.score),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.2,
      },
    ],
  };
  
  // Taxonomy line chart data
  const taxonomyLineData = {
    labels: taxonomyHistory.map(item => item.month),
    datasets: [
      {
        data: taxonomyHistory.map(item => item.score),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.2,
      },
    ],
  };
  
  // Helper function to get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-600';
  };
  
  // Helper functions to get top and bottom performing countries
  const getTopPerformingCountry = (countries: {country: string, score: number}[]) => {
    return [...countries].sort((a, b) => b.score - a.score)[0];
  };
  
  const getBottomPerformingCountry = (countries: {country: string, score: number}[]) => {
    return [...countries].sort((a, b) => a.score - b.score)[0];
  };
  
  // Get top and bottom performing countries
  const topGoldenRulesCountry = getTopPerformingCountry(countryGoldenRulesScores);
  const bottomGoldenRulesCountry = getBottomPerformingCountry(countryGoldenRulesScores);
  const topFiveStarsCountry = getTopPerformingCountry(countryFiveStarsScores);
  const bottomFiveStarsCountry = getBottomPerformingCountry(countryFiveStarsScores);
  const topTaxonomyCountry = getTopPerformingCountry(countryTaxonomyScores);
  const bottomTaxonomyCountry = getBottomPerformingCountry(countryTaxonomyScores);
  
  // Platform performance data (for analysis explanations)
  const platformPerformance = {
    'Meta': { goldenRules: 88, fiveStars: 4.6, taxonomy: 82 },
    'Google': { goldenRules: 82, fiveStars: 4.2, taxonomy: 79 },
    'TikTok': { goldenRules: 75, fiveStars: 3.8, taxonomy: 71 },
    'Amazon': { goldenRules: 79, fiveStars: 4.0, taxonomy: 76 }
  };
  
  // Country-platform strengths
  const countryPlatformStrengths = {
    'Brazil': 'Meta',
    'India': 'Google',
    'South Africa': 'Meta',
    'Mexico': 'TikTok',
    'Chile': 'Google',
    'Thailand': 'Amazon'
  };
  
  // Get platform reason for country performance
  const getPerformanceReason = (country: string, metric: 'goldenRules' | 'fiveStars' | 'taxonomy') => {
    const platform = countryPlatformStrengths[country as keyof typeof countryPlatformStrengths];
    const score = platformPerformance[platform as keyof typeof platformPerformance][metric];
    return { platform, score };
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8 pt-16">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row items-center md:justify-between mb-6 space-y-4 md:space-y-0">
              <h1 className="text-3xl font-bold text-indigo-600 font-quicksand">MediaIQ Dashboard</h1>
              
              {/* Month selector */}
              <div className="relative" ref={monthSelectorRef}>
                <div 
                  className="bg-indigo-50 p-3 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors duration-200 flex items-center space-x-2"
                  onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
                  title="Click to change month"
                >
                  <div>
                    <div className="text-sm text-gray-500">Selected Period</div>
                    <div className="text-lg font-semibold text-indigo-700">
                      {new Date((selectedMonth || '2025-03') + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-indigo-600 transition-transform duration-200 ${isMonthSelectorOpen ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                
                {/* Month selector dropdown */}
                {isMonthSelectorOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-10">
                    <div className="p-2">
                      <div className="text-sm font-medium text-gray-500 px-3 py-2">Select Month</div>
                      <div className="max-h-60 overflow-y-auto">
                        {Array.from({ length: 12 }).map((_, index) => {
                          const monthNum = index + 1;
                          const monthValue = `2024-${monthNum.toString().padStart(2, '0')}`;
                          const monthDate = new Date(`${monthValue}-01`);
                          const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                          
                          return (
                            <button
                              key={monthValue}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                                selectedMonth === monthValue
                                  ? 'bg-indigo-100 text-indigo-800 font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => {
                                if (selectedMonth !== monthValue) {
                                  setSelectedMonth(monthValue);
                                }
                                setIsMonthSelectorOpen(false);
                              }}
                            >
                              {monthName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : noData ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-8 rounded-lg text-center">
                <svg className="w-12 h-12 mx-auto text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-gray-600 mb-4">There is no data available for {new Date((selectedMonth || '2025-03') + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
                <p className="text-gray-600">Please select a different month or check back later when data becomes available.</p>
              </div>
            ) : (
              <>
                {/* Golden Rules Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Golden Rules Score Widget */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 shadow border border-teal-100">
                    <h2 className="text-xl font-semibold text-teal-800 mb-4">Overall Golden Rules Score</h2>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col md:flex-row items-center md:justify-between w-full mb-4">
                        <div className="relative h-40 w-40">
                          <Doughnut data={goldenRulesChartData} options={chartOptions} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-3xl font-bold text-teal-700">{goldenRulesScore || 0}</span>
                              <span className="text-sm text-teal-600">/100</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6">
                          <p className="text-gray-600 mb-2 text-center md:text-left">
                            The Golden Rules score represents your overall compliance with media best practices across all platforms.
                          </p>
                          <div className="text-center md:text-left">
                            <a href="/golden-rules" className="text-teal-600 hover:text-teal-800 font-medium inline-flex items-center">
                              View Details
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-32 mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-1">6-Month Trend</p>
                        <Line data={goldenRulesLineData} options={lineChartOptions} height={100} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Golden Rules by Country Widget */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6 shadow border border-teal-100">
                    <h2 className="text-xl font-semibold text-teal-800 mb-4">Golden Rules by Country</h2>
                    <div className="space-y-4">
                      {countryGoldenRulesScores.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">{item.country}</span>
                          <div className="flex items-center">
                            <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-teal-600 h-2.5 rounded-full" 
                                style={{ width: `${item.score}%` }}
                              ></div>
                            </div>
                            <span className="text-teal-700 font-semibold">{item.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Analysis Section */}
                    <div className="mt-6 bg-white rounded-lg p-4 border border-teal-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Analysis</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                          </svg>
                          <div>
                            <div>
                              <span className="text-sm text-gray-600">Top performer: </span>
                              <span className="text-sm font-semibold text-gray-800">{topGoldenRulesCountry.country}</span>
                              <span className="text-sm text-gray-600"> with a score of </span>
                              <span className="text-sm font-semibold text-green-600">{topGoldenRulesCountry.score}</span>
                            </div>
                            {(() => {
                              const reason = getPerformanceReason(topGoldenRulesCountry.country, 'goldenRules');
                              return (
                                <div className="text-xs text-gray-500 mt-1">
                                  Strong performance on {reason.platform} platform (score: {reason.score})
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                          </svg>
                          <div>
                            <div>
                              <span className="text-sm text-gray-600">Needs improvement: </span>
                              <span className="text-sm font-semibold text-gray-800">{bottomGoldenRulesCountry.country}</span>
                              <span className="text-sm text-gray-600"> with a score of </span>
                              <span className="text-sm font-semibold text-red-600">{bottomGoldenRulesCountry.score}</span>
                            </div>
                            {(() => {
                              const reason = getPerformanceReason(bottomGoldenRulesCountry.country, 'goldenRules');
                              return (
                                <div className="text-xs text-gray-500 mt-1">
                                  Lower scores on {reason.platform} platform (score: {reason.score})
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-right">
                      <a href="/golden-rules" className="text-teal-600 hover:text-teal-800 font-medium inline-flex items-center justify-end">
                        View Details
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* 5 Stars Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 5 Stars Score Widget */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 shadow border border-purple-100">
                    <h2 className="text-xl font-semibold text-purple-800 mb-4">Overall 5 Stars Rating</h2>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col md:flex-row items-center md:justify-between w-full mb-4">
                        <div className="relative h-40 w-40">
                          <Doughnut data={fiveStarsChartData} options={chartOptions} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-3xl font-bold text-purple-700">{fiveStarsScore ? fiveStarsScore.toFixed(1) : '0.0'}</span>
                              <span className="text-sm text-purple-600">/5</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6">
                          <p className="text-gray-600 mb-2 text-center md:text-left">
                            The 5 Stars Rating shows your average performance across all evaluation criteria and countries.
                          </p>
                          <div className="text-center md:text-left">
                            <a href="/five-stars" className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center">
                              View Details
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-32 mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-1">6-Month Trend</p>
                        <Line data={fiveStarsLineData} options={fiveStarsLineChartOptions} height={100} />
                      </div>
                    </div>
                  </div>
                  
                  {/* 5 Stars by Country Widget */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 shadow border border-purple-100">
                    <h2 className="text-xl font-semibold text-purple-800 mb-4">5 Stars by Country</h2>
                    <div className="space-y-4">
                      {countryFiveStarsScores.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">{item.country}</span>
                          <div className="flex items-center">
                            <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-purple-600 h-2.5 rounded-full" 
                                style={{ width: `${(item.score / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-purple-700 font-semibold">{item.score.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Analysis Section */}
                    <div className="mt-6 bg-white rounded-lg p-4 border border-purple-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Analysis</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                          </svg>
                          <div>
                            <div>
                              <span className="text-sm text-gray-600">Top performer: </span>
                              <span className="text-sm font-semibold text-gray-800">{topFiveStarsCountry.country}</span>
                              <span className="text-sm text-gray-600"> with a rating of </span>
                              <span className="text-sm font-semibold text-green-600">{topFiveStarsCountry.score.toFixed(1)}</span>
                            </div>
                            {(() => {
                              const reason = getPerformanceReason(topFiveStarsCountry.country, 'fiveStars');
                              return (
                                <div className="text-xs text-gray-500 mt-1">
                                  Excellent ratings on {reason.platform} platform (rating: {reason.score.toFixed(1)})
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                          </svg>
                          <div>
                            <div>
                              <span className="text-sm text-gray-600">Needs improvement: </span>
                              <span className="text-sm font-semibold text-gray-800">{bottomFiveStarsCountry.country}</span>
                              <span className="text-sm text-gray-600"> with a rating of </span>
                              <span className="text-sm font-semibold text-red-600">{bottomFiveStarsCountry.score.toFixed(1)}</span>
                            </div>
                            {(() => {
                              const reason = getPerformanceReason(bottomFiveStarsCountry.country, 'fiveStars');
                              return (
                                <div className="text-xs text-gray-500 mt-1">
                                  Below average ratings on {reason.platform} platform (rating: {reason.score.toFixed(1)})
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-right">
                      <a href="/five-stars" className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center justify-end">
                        View Details
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Taxonomy Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Taxonomy Score Widget */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow border border-blue-100">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4">Overall Taxonomy Score</h2>
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col md:flex-row items-center md:justify-between w-full mb-4">
                        <div className="relative h-40 w-40">
                          <Doughnut data={taxonomyChartData} options={chartOptions} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <span className="text-3xl font-bold text-blue-700">{taxonomyScore || 0}</span>
                              <span className="text-sm text-blue-600">/100</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6">
                          <p className="text-gray-600 mb-2 text-center md:text-left">
                            The Taxonomy score measures your media content classification and organization across platforms and brands.
                          </p>
                          <div className="text-center md:text-left">
                            <a href="/taxonomy" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                              View Details
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-32 mt-4">
                        <p className="text-sm font-medium text-gray-500 mb-1">6-Month Trend</p>
                        <Line data={taxonomyLineData} options={lineChartOptions} height={100} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Taxonomy by Country Widget */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow border border-blue-100">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4">Taxonomy by Country</h2>
                    <div className="space-y-4">
                      {countryTaxonomyScores.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">{item.country}</span>
                          <div className="flex items-center">
                            <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${item.score}%` }}
                              ></div>
                            </div>
                            <span className="text-blue-700 font-semibold">{item.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Analysis Section */}
                    <div className="mt-6 bg-white rounded-lg p-4 border border-blue-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Analysis</h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                          </svg>
                          <div>
                            <div>
                              <span className="text-sm text-gray-600">Top performer: </span>
                              <span className="text-sm font-semibold text-gray-800">{topTaxonomyCountry.country}</span>
                              <span className="text-sm text-gray-600"> with a score of </span>
                              <span className="text-sm font-semibold text-green-600">{topTaxonomyCountry.score}</span>
                            </div>
                            {(() => {
                              const reason = getPerformanceReason(topTaxonomyCountry.country, 'taxonomy');
                              return (
                                <div className="text-xs text-gray-500 mt-1">
                                  Superior taxonomy on {reason.platform} platform (score: {reason.score})
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                          </svg>
                          <div>
                            <div>
                              <span className="text-sm text-gray-600">Needs improvement: </span>
                              <span className="text-sm font-semibold text-gray-800">{bottomTaxonomyCountry.country}</span>
                              <span className="text-sm text-gray-600"> with a score of </span>
                              <span className="text-sm font-semibold text-red-600">{bottomTaxonomyCountry.score}</span>
                            </div>
                            {(() => {
                              const reason = getPerformanceReason(bottomTaxonomyCountry.country, 'taxonomy');
                              return (
                                <div className="text-xs text-gray-500 mt-1">
                                  Needs taxonomy improvement on {reason.platform} platform (score: {reason.score})
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-right">
                      <a href="/taxonomy" className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center justify-end">
                        View Details
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
