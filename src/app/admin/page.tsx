'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRules: 0,
    totalCountries: 0,
    totalBrands: 0,
    pendingChangeRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch dashboard statistics
        const [rulesRes, countriesRes, brandsRes, changeRequestsRes] = await Promise.all([
          fetch('/api/rules'),
          fetch('/api/countries'),
          fetch('/api/brands'),
          fetch('/api/change-requests?status=Submitted for Review')
        ]);

        const [rules, countries, brands, changeRequests] = await Promise.all([
          rulesRes.json(),
          countriesRes.json(),
          brandsRes.json(),
          changeRequestsRes.json()
        ]);

        setStats({
          totalRules: rules.length,
          totalCountries: countries.length,
          totalBrands: brands.length,
          pendingChangeRequests: changeRequests.length
        });
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
      '/admin/media-sufficiency/enhanced-upload'
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-quicksand text-gray-800">Admin Dashboard</h1>
        <LogoutButton />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Dashboard Cards */}
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleNavigate('/admin/rules')}
        >
          <h2 className="text-lg font-medium mb-2 font-quicksand text-gray-700">Total Rules</h2>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalRules}</p>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleNavigate('/admin/countries')}
        >
          <h2 className="text-lg font-medium mb-2 font-quicksand text-gray-700">Countries</h2>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalCountries}</p>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleNavigate('/admin/brands')}
        >
          <h2 className="text-lg font-medium mb-2 font-quicksand text-gray-700">Brands</h2>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalBrands}</p>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleNavigate('/admin/change-requests')}
        >
          <h2 className="text-lg font-medium mb-2 font-quicksand text-gray-700">Pending Change Requests</h2>
          <p className="text-3xl font-bold text-indigo-600">{stats.pendingChangeRequests}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Recent Change Requests</h2>
          {/* We would fetch and display recent change requests here */}
          <div className="text-center py-8 text-gray-500 font-quicksand">
            {stats.pendingChangeRequests > 0 ? (
              <p>You have {stats.pendingChangeRequests} pending change requests to review</p>
            ) : (
              <p>No pending change requests</p>
            )}
            <button 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/admin/change-requests')}
            >
              View All Change Requests
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Admin Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/admin/rules')}
            >
              Manage Rules
            </button>
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/admin/countries')}
            >
              Manage Countries
            </button>
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/admin/brands')}
            >
              Manage Brands
            </button>
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/admin/users')}
            >
              Manage Users
            </button>
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/admin/taxonomy')}
            >
              Taxonomy Scores
            </button>
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/admin/media-sufficiency')}
            >
              Media Sufficiency
            </button>
            <button 
              className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/admin/media-sufficiency/enhanced-upload')}
            >
              Enhanced Data Import
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
