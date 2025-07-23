'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default function UserDashboard() {
  const [userData, setUserData] = useState({
    name: '',
    brand: '',
    country: '',
    role: ''
  });
  const [scores, setScores] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data for dashboard...');
        // Get user data from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.log('No user found in localStorage, redirecting to login');
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        console.log('User data from localStorage:', user);
        
        setUserData({
          name: user.name || 'User',
          brand: 'All Brands', // Default value since we don't have brand info
          country: 'All Countries', // Default value since we don't have country info
          role: user.role || 'user'
        });

        // Fetch all scores since we don't have brand/country filters
        const scoresRes = await fetch('/api/scores');
        if (!scoresRes.ok) {
          console.error('Failed to fetch scores:', await scoresRes.text());
          setScores([]);
        } else {
          const scoresData = await scoresRes.json();
          setScores(scoresData);
        }

        // Fetch all change requests since we don't have user-specific filtering
        const changeRequestsRes = await fetch('/api/change-requests');
        if (!changeRequestsRes.ok) {
          console.error('Failed to fetch change requests:', await changeRequestsRes.text());
          setChangeRequests([]);
        } else {
          const changeRequestsData = await changeRequestsRes.json();
          setChangeRequests(changeRequestsData);
        }
      } catch (error) {
        console.error('Error fetching user dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleNavigate = (path: string) => {
    router.push(path);
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
        <div>
          <h1 className="text-3xl font-bold font-quicksand text-gray-800">Welcome, {userData.name}</h1>
          <p className="text-gray-600 font-quicksand">{userData.brand} - {userData.country}</p>
        </div>
        <LogoutButton />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleNavigate('/scores')}
        >
          <h2 className="text-lg font-medium mb-2 font-quicksand text-gray-700">Your Scores</h2>
          <p className="text-3xl font-bold text-indigo-600">{scores.length}</p>
          <p className="text-gray-500 mt-2 font-quicksand">View all scores for your brand</p>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleNavigate('/change-requests')}
        >
          <h2 className="text-lg font-medium mb-2 font-quicksand text-gray-700">Your Change Requests</h2>
          <p className="text-3xl font-bold text-indigo-600">{changeRequests.length}</p>
          <p className="text-gray-500 mt-2 font-quicksand">View your submitted change requests</p>
        </div>
        
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleNavigate('/rules')}
        >
          <h2 className="text-lg font-medium mb-2 font-quicksand text-gray-700">Golden Rules</h2>
          <p className="text-3xl font-bold text-indigo-600">View</p>
          <p className="text-gray-500 mt-2 font-quicksand">Browse all golden rules</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Recent Change Requests</h2>
          {changeRequests.length > 0 ? (
            <div className="space-y-4">
              {changeRequests.slice(0, 3).map((request: any) => (
                <div key={request.id} className="border-b pb-4 last:border-b-0">
                  <p className="font-medium font-quicksand">{request.rule?.title || 'Unknown Rule'}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'Approved' 
                        ? 'bg-green-100 text-green-800' 
                        : request.status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    } font-quicksand`}>
                      {request.status}
                    </span>
                    <span className="text-sm text-gray-500 font-quicksand">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 font-quicksand">
              <p>You haven't submitted any change requests yet</p>
              <button 
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
                onClick={() => handleNavigate('/rules')}
              >
                Browse Rules
              </button>
            </div>
          )}
          {changeRequests.length > 0 && (
            <div className="mt-4 text-center">
              <button 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
                onClick={() => handleNavigate('/change-requests')}
              >
                View All Change Requests
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/rules')}
            >
              View Rules
            </button>
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/scores')}
            >
              View Scores
            </button>
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/change-requests/new')}
            >
              Submit Change Request
            </button>
            <button 
              className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
              onClick={() => handleNavigate('/profile')}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
