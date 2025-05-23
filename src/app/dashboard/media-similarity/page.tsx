'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FiDollarSign, FiPieChart, FiBarChart2, FiActivity, FiMap } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

interface DashboardData {
  budgetByMediaType: Record<string, number>;
  budgetByCountry: Record<string, number>;
  budgetByQuarter: Record<string, number>;
  campaignsByPMType: Record<string, number>;
  summary: {
    totalBudget: number;
    campaignCount: number;
    mediaTypeCount: number;
    countryCount: number;
    gamePlanCount: number;
  };
}

export default function SimilarityDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState('FY 2025');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/media-similarity');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare chart data
  const mediaTypeChartData = {
    labels: dashboardData ? Object.keys(dashboardData.budgetByMediaType) : [],
    datasets: [
      {
        data: dashboardData ? Object.values(dashboardData.budgetByMediaType) : [],
        backgroundColor: [
          '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
          '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ],
        borderWidth: 1,
      },
    ],
  };

  const quarterlyBudgetData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Quarterly Budget',
        data: dashboardData ? [dashboardData.budgetByQuarter.Q1, dashboardData.budgetByQuarter.Q2, dashboardData.budgetByQuarter.Q3, dashboardData.budgetByQuarter.Q4] : [],
        backgroundColor: '#4F46E5',
      },
    ],
  };

  const pmTypeChartData = {
    labels: dashboardData ? Object.keys(dashboardData.campaignsByPMType) : [],
    datasets: [
      {
        label: 'Campaigns by PM Type',
        data: dashboardData ? Object.values(dashboardData.campaignsByPMType) : [],
        backgroundColor: '#10B981',
      },
    ],
  };

  // Get top 5 countries by budget
  const topCountries = dashboardData
    ? Object.entries(dashboardData.budgetByCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const countryChartData = {
    labels: topCountries.map(([country]) => country),
    datasets: [
      {
        label: 'Budget by Country',
        data: topCountries.map(([, value]) => value),
        backgroundColor: '#F59E0B',
      },
    ],
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Top Navigation */}
      <Navigation />
      
      {/* Dashboard Tabs */}
      <div className="border-b border-gray-200 flex items-center justify-between px-4 py-2 mt-16">
        <div className="flex space-x-8">
          <Link href="/dashboard" className="px-1 py-4 text-sm font-medium text-gray-500 hover:text-indigo-500">
            Overview
          </Link>
          <Link href="/dashboard/game-plan" className="px-1 py-4 text-sm font-medium text-gray-500 hover:text-indigo-500">
            Game Plan
          </Link>
          <Link href="/dashboard/media-sufficiency" className="px-1 py-4 text-sm font-medium text-gray-500 hover:text-indigo-500">
            Sufficiency
          </Link>
          <Link href="/dashboard/media-similarity" className="px-1 py-4 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">
            Similarity
          </Link>
        </div>
        <div className="flex items-center">
          <select 
            className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option>FY 2025</option>
            <option>FY 2024</option>
            <option>FY 2023</option>
          </select>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : dashboardData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-500 mr-4">
                    <FiDollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Budget</p>
                    <p className="text-xl font-bold">{formatCurrency(dashboardData.summary.totalBudget)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                    <FiBarChart2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Campaigns</p>
                    <p className="text-xl font-bold">{dashboardData.summary.campaignCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                    <FiPieChart size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Media Types</p>
                    <p className="text-xl font-bold">{dashboardData.summary.mediaTypeCount}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                    <FiMap size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Countries</p>
                    <p className="text-xl font-bold">{dashboardData.summary.countryCount}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Budget by Media Type</h2>
                <div className="h-64">
                  <Pie data={mediaTypeChartData} options={{ maintainAspectRatio: false }} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Quarterly Budget Distribution</h2>
                <div className="h-64">
                  <Bar 
                    data={quarterlyBudgetData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => formatCurrency(Number(value))
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Campaigns by PM Type</h2>
                <div className="h-64">
                  <Bar 
                    data={pmTypeChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Top 5 Countries by Budget</h2>
                <div className="h-64">
                  <Bar 
                    data={countryChartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => formatCurrency(Number(value))
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
