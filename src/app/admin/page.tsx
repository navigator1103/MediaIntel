'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { FiUsers, FiDatabase, FiMap, FiTag, FiBarChart2, FiUploadCloud, FiFileText, FiAlertCircle, FiCalendar, FiPieChart } from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRules: 0,
    totalCountries: 0,
    totalBrands: 0,
    pendingChangeRequests: 0,
    totalGamePlans: 0,
    totalUsers: 0,
    lastUpdated: '',
    monthlyData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Rule Changes',
          data: [12, 19, 8, 15, 22, 27],
          borderColor: 'rgb(79, 70, 229)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointBackgroundColor: 'rgb(79, 70, 229)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Change Requests',
          data: [8, 15, 12, 9, 17, 22],
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointBackgroundColor: 'rgb(245, 158, 11)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    },
    distributionData: {
      labels: ['Rules', 'Countries', 'Brands', 'Game Plans'],
      datasets: [{
        data: [300, 50, 100, 80],
        backgroundColor: [
          'rgba(79, 70, 229, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(16, 185, 129, 0.85)'
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 10,
      }]
    }
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch dashboard statistics
        const [rulesRes, countriesRes, brandsRes, changeRequestsRes, gamePlansRes, usersRes] = await Promise.all([
          fetch('/api/rules'),
          fetch('/api/countries'),
          fetch('/api/brands'),
          fetch('/api/change-requests?status=Submitted for Review'),
          fetch('/api/admin/media-sufficiency/game-plans').catch(() => ({ json: () => Promise.resolve([]) })),
          fetch('/api/admin/users').catch(() => ({ json: () => Promise.resolve([]) }))
        ]);

        const [rules, countries, brands, changeRequests, gamePlans, users] = await Promise.all([
          rulesRes.json(),
          countriesRes.json(),
          brandsRes.json(),
          changeRequestsRes.json(),
          gamePlansRes.json ? gamePlansRes.json() : [],
          usersRes.json ? usersRes.json() : []
        ]);

        // Preserve the chart data when updating stats
        setStats(prevStats => ({
          totalRules: rules.length,
          totalCountries: countries.length,
          totalBrands: brands.length,
          pendingChangeRequests: changeRequests.length,
          totalGamePlans: Array.isArray(gamePlans) ? gamePlans.length : 0,
          totalUsers: Array.isArray(users) ? users.length : 0,
          lastUpdated: new Date().toLocaleString(),
          monthlyData: prevStats.monthlyData,
          distributionData: {
            ...prevStats.distributionData,
            datasets: [{
              ...prevStats.distributionData.datasets[0],
              data: [rules.length, countries.length, brands.length, Array.isArray(gamePlans) ? gamePlans.length : 0]
            }]
          }
        }));
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkAdminAndFetchStats = async () => {
      try {
        // Check if user is logged in and has admin role
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.log('No user found, redirecting to login');
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        console.log('User role:', user.role);
        
        if (user.role !== 'admin') {
          console.log('User is not admin, redirecting to user dashboard');
          router.push('/');
          return;
        }
        
        // User is admin, fetch stats
        await fetchStats();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/login');
      }
    };

    checkAdminAndFetchStats();
  }, [router]);

  const handleNavigate = (path: string) => {
    // Check if the page is implemented
    const implementedPages = [
      '/admin',
      '/admin/change-requests',
      '/admin/countries',
      '/admin/taxonomy',
      '/admin/media-sufficiency',
      '/admin/media-sufficiency/enhanced-upload',
      '/admin/media-sufficiency/game-plans'
    ];
    
    if (implementedPages.includes(path)) {
      router.push(path);
    } else {
      // Show an alert for pages that are not yet implemented
      alert(`This page is not yet implemented.`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg font-quicksand">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <div className="bg-indigo-600 text-white p-5 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold font-quicksand">Media IQ Admin Dashboard</h1>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Key Stats Overview - Simplified */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div 
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleNavigate('/admin/rules')}
          >
            <div className="flex items-center mb-1">
              <FiDatabase className="h-4 w-4 text-indigo-500 mr-2" />
              <h2 className="text-sm font-medium text-gray-500">Rules</h2>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalRules}</p>
          </div>
          
          <div 
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleNavigate('/admin/countries')}
          >
            <div className="flex items-center mb-1">
              <FiMap className="h-4 w-4 text-indigo-500 mr-2" />
              <h2 className="text-sm font-medium text-gray-500">Countries</h2>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalCountries}</p>
          </div>
          
          <div 
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleNavigate('/admin/change-requests')}
          >
            <div className="flex items-center mb-1">
              <FiAlertCircle className="h-4 w-4 text-amber-500 mr-2" />
              <h2 className="text-sm font-medium text-gray-500">Pending Requests</h2>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingChangeRequests}</p>
          </div>

          <div 
            className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleNavigate('/admin/media-sufficiency/game-plans')}
          >
            <div className="flex items-center mb-1">
              <FiCalendar className="h-4 w-4 text-indigo-500 mr-2" />
              <h2 className="text-sm font-medium text-gray-500">Game Plans</h2>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalGamePlans}</p>
          </div>
        </div>
        
        {/* Analytics Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-5 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-700 flex items-center">
                <FiBarChart2 className="mr-2 text-indigo-500" /> Activity Trends
              </h2>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Last 6 months
              </div>
            </div>
            <div className="h-72 p-2">
              <Line 
                data={stats.monthlyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        usePointStyle: true,
                        boxWidth: 6,
                        padding: 20,
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      titleColor: '#6B7280',
                      bodyColor: '#374151',
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                      padding: 12,
                      boxPadding: 6,
                      usePointStyle: true,
                      titleFont: {
                        size: 14,
                        weight: 'bold'
                      },
                      bodyFont: {
                        size: 13
                      },
                      callbacks: {
                        label: function(context) {
                          return ` ${context.dataset.label}: ${context.parsed.y}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: {
                          size: 11
                        }
                      }
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      },
                      ticks: {
                        font: {
                          size: 11
                        }
                      }
                    }
                  },
                  elements: {
                    line: {
                      tension: 0.4
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-700 flex items-center">
                <FiPieChart className="mr-2 text-indigo-500" /> Data Distribution
              </h2>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Current data
              </div>
            </div>
            <div className="h-72 flex items-center justify-center p-2">
              <div className="w-4/5 h-full">
                <Doughnut 
                  data={stats.distributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: {
                        position: 'right' as const,
                        labels: {
                          usePointStyle: true,
                          boxWidth: 8,
                          padding: 15,
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#6B7280',
                        bodyColor: '#374151',
                        borderColor: '#E5E7EB',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((sum: any, value: any) => sum + value, 0);
                            const value = context.raw as number;
                            const percentage = Math.round((value / total) * 100);
                            return ` ${context.label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    animation: {
                      animateScale: true,
                      animateRotate: true
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
              <h2 className="text-lg font-medium mb-4 text-gray-700">Quick Actions</h2>
              <div className="space-y-2">
                <button 
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand flex items-center justify-center"
                  onClick={() => handleNavigate('/admin/change-requests')}
                >
                  <FiAlertCircle className="mr-2" /> Review Change Requests
                </button>
                <button 
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand flex items-center justify-center"
                  onClick={() => handleNavigate('/admin/media-sufficiency/enhanced-upload')}
                >
                  <FiUploadCloud className="mr-2" /> Upload Media Data
                </button>
                <button 
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand flex items-center justify-center"
                  onClick={() => handleNavigate('/admin/media-sufficiency/game-plans')}
                >
                  <FiCalendar className="mr-2" /> Manage Game Plans
                </button>
              </div>
            </div>
          </div>

          {/* Admin Modules - Simplified */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h2 className="text-lg font-medium mb-4 text-gray-700">Admin Modules</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/rules')}
                >
                  <FiDatabase className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Rules</span>
                </div>
                
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/countries')}
                >
                  <FiMap className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Countries</span>
                </div>
                
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/brands')}
                >
                  <FiTag className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Brands</span>
                </div>
                
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/users')}
                >
                  <FiUsers className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Users</span>
                </div>
                
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/taxonomy')}
                >
                  <FiBarChart2 className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Taxonomy</span>
                </div>
                
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/media-sufficiency')}
                >
                  <FiBarChart2 className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Media Sufficiency</span>
                </div>
                
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/media-sufficiency/game-plans')}
                >
                  <FiCalendar className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Game Plans</span>
                </div>
                
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/media-sufficiency/enhanced-upload')}
                >
                  <FiUploadCloud className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Media Data</span>
                </div>
                
                <div 
                  className="p-3 border border-gray-200 rounded-md hover:border-indigo-500 hover:shadow-sm transition-all cursor-pointer flex items-center"
                  onClick={() => handleNavigate('/admin/change-requests')}
                >
                  <FiAlertCircle className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="font-medium text-sm">Change Requests</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500 mt-4 pb-4">
        Last updated: {stats.lastUpdated}
      </div>
    </div>
  );
}
