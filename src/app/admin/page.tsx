'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiUploadCloud, FiCalendar, FiDatabase, FiBarChart2, FiActivity, FiTrendingUp, FiHardDrive, FiGlobe, FiTag, FiBox, FiTarget, FiCheckCircle } from 'react-icons/fi';
import { createPermissionChecker } from '@/lib/auth/permissions';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalGamePlans: 0,
    totalUsers: 0,
    totalCampaigns: 0,
    totalBudget: 0,
    lastUpdated: '',
  });
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize user permissions
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        const permissionChecker = createPermissionChecker(userData);
        setUserPermissions(permissionChecker);
      } catch (error) {
        console.error('Error loading user permissions:', error);
      }
    }

    const fetchStats = async () => {
      try {
        // Get authorization token for API calls
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch media sufficiency dashboard statistics with country filtering
        const [gamePlansRes, usersRes, dashboardRes] = await Promise.all([
          fetch('/api/admin/media-sufficiency/game-plans', { headers }).catch(() => ({ json: () => Promise.resolve([]) })),
          fetch('/api/admin/users').catch(() => ({ json: () => Promise.resolve([]) })),
          fetch('/api/dashboard/media-sufficiency', { headers }).catch(() => ({ json: () => Promise.resolve({}) }))
        ]);

        const [gamePlansData, users, dashboardData] = await Promise.all([
          gamePlansRes.json ? gamePlansRes.json() : {},
          usersRes.json ? usersRes.json() : [],
          dashboardRes.json ? dashboardRes.json() : {}
        ]);

        // Handle game plans response structure (API returns {gamePlans: [...], ...})
        const gamePlans = gamePlansData.gamePlans || gamePlansData || [];

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

  const canAccessPath = (path: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.canAccessPath(path);
  };

  const canAccessAnyPath = (paths: string[]): boolean => {
    return paths.some(path => canAccessPath(path));
  };

  const handleNavigate = (path: string) => {
    // Check if user has permission to access this path
    if (!canAccessPath(path)) {
      alert('You do not have permission to access this page.');
      return;
    }

    // Check if the page is implemented
    const implementedPages = [
      '/admin',
      '/admin/users',
      '/admin/media-sufficiency',
      '/admin/game-plans/upload',
      '/admin/media-sufficiency/game-plans',
      '/admin/backups',
      '/admin/reach-planning',
      '/admin/financial-cycles',
      '/admin/governance',
      '/admin/countries',
      '/admin/categories',
      '/admin/ranges',
      '/admin/campaigns',
      '/admin/share-of-voice',
      '/admin/diminishing-returns'
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
          {canAccessPath('/admin/media-sufficiency/game-plans') && (
          <div 
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer border border-gray-200"
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
          )}
          
          {canAccessPath('/admin/media-sufficiency') && (
          <div 
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer border border-gray-200"
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
          )}
          
          {canAccessPath('/admin/users') && (
          <div 
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer border border-gray-200"
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
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Budget</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(stats.totalBudget / 1000).toFixed(1)}M
                </p>
              </div>
              <div className="p-3 rounded-lg" style={{backgroundColor: '#2E294E'}}>
                <FiBarChart2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Data Upload & Import */}
        {canAccessAnyPath(['/admin/game-plans/upload', '/admin/reach-planning', '/admin/share-of-voice', '/admin/diminishing-returns']) && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <FiUploadCloud className="mr-3" style={{color: '#ECA400'}} />
            Data Upload & Import
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canAccessPath('/admin/game-plans/upload') && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#ECA400'}}>
                  <FiCalendar className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Game Plans</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Upload campaign planning and budget data</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#ECA400'}}
                onClick={() => handleNavigate('/admin/game-plans/upload')}
              >
                Upload Game Plans
              </button>
            </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#006992'}}>
                  <FiBarChart2 className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">SOV Data</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Upload competitive share of voice data</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#006992'}}
                onClick={() => handleNavigate('/admin/share-of-voice')}
              >
                Upload SOV Data
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#98473E'}}>
                  <FiTrendingUp className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Diminishing Returns</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Upload media effectiveness curves</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#98473E'}}
                onClick={() => handleNavigate('/admin/diminishing-returns')}
              >
                Upload Media Curves
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#2E294E'}}>
                  <FiDatabase className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Reach Planning</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Import reach planning and media data</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#2E294E'}}
                onClick={() => handleNavigate('/admin/reach-planning')}
              >
                Import Media Data
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Content Management */}
        {canAccessAnyPath(['/admin/media-sufficiency/game-plans', '/admin/users', '/admin/governance']) && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <FiTarget className="mr-3" style={{color: '#785589'}} />
            Content Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canAccessPath('/admin/media-sufficiency/game-plans') && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#785589'}}>
                  <FiCalendar className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Game Plans</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">View and manage campaign plans</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#785589'}}
                onClick={() => handleNavigate('/admin/media-sufficiency/game-plans')}
              >
                Manage Plans
              </button>
            </div>
            )}

            {canAccessPath('/admin/users') && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#A04668'}}>
                  <FiUsers className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Users</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Manage user accounts and permissions</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#A04668'}}
                onClick={() => handleNavigate('/admin/users')}
              >
                Manage Users
              </button>
            </div>
            )}

            {canAccessPath('/admin/governance') && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#D3BCCC'}}>
                  <FiCheckCircle className="h-5 w-5 text-gray-800" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Entity Governance</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Review auto-created entities</p>
              <button 
                className="w-full px-4 py-2 text-gray-800 rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#D3BCCC'}}
                onClick={() => handleNavigate('/admin/governance')}
              >
                Review Entities
              </button>
            </div>
            )}
          </div>
        </div>
        )}

        {/* Configuration Management */}
        {canAccessAnyPath(['/admin/countries', '/admin/categories', '/admin/ranges', '/admin/campaigns', '/admin/financial-cycles']) && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <FiGlobe className="mr-3" style={{color: '#E8D7F1'}} />
            Configuration & Master Data
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#E8D7F1'}}>
                  <FiGlobe className="h-5 w-5 text-gray-800" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Countries</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Manage countries and regions</p>
              <button 
                className="w-full px-4 py-2 text-gray-800 rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#E8D7F1'}}
                onClick={() => handleNavigate('/admin/countries')}
              >
                Manage Countries
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#EAF8BF'}}>
                  <FiTag className="h-5 w-5 text-gray-800" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Categories</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Manage product categories</p>
              <button 
                className="w-full px-4 py-2 text-gray-800 rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#EAF8BF'}}
                onClick={() => handleNavigate('/admin/categories')}
              >
                Manage Categories
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#006992'}}>
                  <FiBox className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Ranges</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Manage product ranges</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#006992'}}
                onClick={() => handleNavigate('/admin/ranges')}
              >
                Manage Ranges
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#ECA400'}}>
                  <FiCalendar className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Financial Cycles</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Manage planning cycles</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#ECA400'}}
                onClick={() => handleNavigate('/admin/financial-cycles')}
              >
                Manage Cycles
              </button>
            </div>
          </div>
        </div>
        )}

        {/* System Management */}
        {canAccessAnyPath(['/admin/backups', '/admin/campaigns']) && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <FiHardDrive className="mr-3" style={{color: '#2E294E'}} />
            System Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#785589'}}>
                  <FiHardDrive className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Backups</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">View and restore data backups</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#785589'}}
                onClick={() => handleNavigate('/admin/backups')}
              >
                Manage Backups
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg mr-3" style={{backgroundColor: '#A04668'}}>
                  <FiTarget className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-medium text-gray-900">Campaigns</h4>
              </div>
              <p className="text-gray-600 mb-4 text-sm">Manage marketing campaigns</p>
              <button 
                className="w-full px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                style={{backgroundColor: '#A04668'}}
                onClick={() => handleNavigate('/admin/campaigns')}
              >
                Manage Campaigns
              </button>
            </div>
          </div>
        </div>
        )}

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