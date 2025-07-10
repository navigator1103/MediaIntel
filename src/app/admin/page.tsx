'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiUploadCloud, FiCalendar, FiDatabase, FiBarChart2, FiActivity, FiTrendingUp, FiHardDrive, FiGlobe, FiTag, FiBox, FiTarget, FiCheckCircle } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalGamePlans: 0,
    totalUsers: 0,
    totalCampaigns: 0,
    totalBudget: 0,
    lastUpdated: '',
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch media sufficiency dashboard statistics
        const [gamePlansRes, usersRes, dashboardRes] = await Promise.all([
          fetch('/api/admin/media-sufficiency/game-plans').catch(() => ({ json: () => Promise.resolve([]) })),
          fetch('/api/admin/users').catch(() => ({ json: () => Promise.resolve([]) })),
          fetch('/api/dashboard/media-sufficiency').catch(() => ({ json: () => Promise.resolve({}) }))
        ]);

        const [gamePlans, users, dashboardData] = await Promise.all([
          gamePlansRes.json ? gamePlansRes.json() : [],
          usersRes.json ? usersRes.json() : [],
          dashboardRes.json ? dashboardRes.json() : {}
        ]);

        // Count unique campaigns from game plans
        const uniqueCampaigns = new Set();
        if (Array.isArray(gamePlans)) {
          gamePlans.forEach(plan => {
            if (plan.campaign?.name) uniqueCampaigns.add(plan.campaign.name);
          });
        }

        setStats({
          totalGamePlans: Array.isArray(gamePlans) ? gamePlans.length : 0,
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalCampaigns: uniqueCampaigns.size,
          totalBudget: dashboardData.summary?.totalBudget || 0,
          lastUpdated: new Date().toLocaleString(),
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    // Auth check is handled by layout, just fetch stats
    fetchStats();
  }, [router]);

  const handleNavigate = (path: string) => {
    // Check if the page is implemented
    const implementedPages = [
      '/admin',
      '/admin/users',
      '/admin/media-sufficiency',
      '/admin/media-sufficiency/enhanced-upload',
      '/admin/media-sufficiency/game-plans',
      '/admin/backups',
      '/admin/game-plans/upload',
      '/admin/reach-planning',
      '/admin/financial-cycles',
      '/admin/governance',
      '/admin/countries',
      '/admin/categories',
      '/admin/ranges',
      '/admin/campaigns'
    ];
    
    if (implementedPages.includes(path)) {
      router.push(path);
    } else {
      alert(`This feature is coming soon.`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg font-quicksand">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6">
      <div className="max-w-6xl mx-auto p-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your Media Sufficiency Platform</p>
        </div>

        {/* Key Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div 
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border border-gray-100"
            onClick={() => handleNavigate('/admin/media-sufficiency/game-plans')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Game Plans</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalGamePlans}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <FiCalendar className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border border-gray-100"
            onClick={() => handleNavigate('/admin/media-sufficiency')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiTrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border border-gray-100"
            onClick={() => handleNavigate('/admin/users')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiUsers className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Budget</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(stats.totalBudget / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiBarChart2 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiUploadCloud className="mr-2 text-indigo-600" />
              Media Data
            </h3>
            <p className="text-gray-600 mb-4 text-sm">Upload and manage media sufficiency data</p>
            <button 
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={() => handleNavigate('/admin/media-sufficiency/enhanced-upload')}
            >
              Upload Data
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCalendar className="mr-2 text-blue-600" />
              Game Plans
            </h3>
            <p className="text-gray-600 mb-4 text-sm">Manage campaign planning and budgets</p>
            <button 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => handleNavigate('/admin/media-sufficiency/game-plans')}
            >
              Manage Plans
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiUsers className="mr-2 text-green-600" />
              User Management
            </h3>
            <p className="text-gray-600 mb-4 text-sm">Manage user accounts and permissions</p>
            <button 
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={() => handleNavigate('/admin/users')}
            >
              Manage Users
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCalendar className="mr-2 text-amber-600" />
              Financial Cycles
            </h3>
            <p className="text-gray-600 mb-4 text-sm">Manage financial cycles for planning</p>
            <button 
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              onClick={() => handleNavigate('/admin/financial-cycles')}
            >
              Manage Cycles
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiCheckCircle className="mr-2 text-emerald-600" />
              Entity Governance
            </h3>
            <p className="text-gray-600 mb-4 text-sm">Review auto-created campaigns and ranges</p>
            <button 
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              onClick={() => handleNavigate('/admin/governance')}
            >
              Review Entities
            </button>
          </div>
        </div>

        {/* Master Data Management */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Master Data Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiGlobe className="mr-2 text-cyan-600" />
                Countries
              </h3>
              <p className="text-gray-600 mb-4 text-sm">Manage countries and regional mappings</p>
              <button 
                className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                onClick={() => handleNavigate('/admin/countries')}
              >
                Manage Countries
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiTag className="mr-2 text-pink-600" />
                Categories
              </h3>
              <p className="text-gray-600 mb-4 text-sm">Manage product categories</p>
              <button 
                className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                onClick={() => handleNavigate('/admin/categories')}
              >
                Manage Categories
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiBox className="mr-2 text-teal-600" />
                Ranges
              </h3>
              <p className="text-gray-600 mb-4 text-sm">Manage product ranges and their categories</p>
              <button 
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                onClick={() => handleNavigate('/admin/ranges')}
              >
                Manage Ranges
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiTarget className="mr-2 text-red-600" />
                Campaigns
              </h3>
              <p className="text-gray-600 mb-4 text-sm">Manage marketing campaigns</p>
              <button 
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={() => handleNavigate('/admin/campaigns')}
              >
                Manage Campaigns
              </button>
            </div>
          </div>
        </div>

        {/* System Management */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">System Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiHardDrive className="mr-2 text-purple-600" />
                Backups
              </h3>
              <p className="text-gray-600 mb-4 text-sm">View and restore game plan backups</p>
              <button 
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                onClick={() => handleNavigate('/admin/backups')}
              >
                Manage Backups
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiTrendingUp className="mr-2 text-orange-600" />
                Media Import
              </h3>
              <p className="text-gray-600 mb-4 text-sm">Import reach planning and media data</p>
              <button 
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                onClick={() => handleNavigate('/admin/reach-planning')}
              >
                Import Media Data
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiActivity className="mr-2 text-indigo-600" />
              System Status
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-gray-700">Database</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-gray-700">File Upload</p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-gray-700">API Services</p>
                <p className="text-xs text-gray-500">Running</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 pb-4">
          Last updated: {stats.lastUpdated}
        </div>
      </div>
    </div>
  );
}