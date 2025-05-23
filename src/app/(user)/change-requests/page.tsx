'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Rule {
  id: number;
  platform: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
}

interface Score {
  id: number;
  ruleId: number;
  platform: string;
  countryId: number;
  brandId: number;
  score: number;
  trend: number;
  month: string;
  evaluation: string;
  rule: Rule;
  country: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
}

interface ChangeRequest {
  id: number;
  scoreId: number;
  requestedScore: number;
  comments: string;
  status: string;
  createdAt: string;
  score: Score;
}

export default function ChangeRequestsPage() {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchChangeRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/change-requests');
        if (!response.ok) {
          throw new Error('Failed to fetch change requests');
        }
        const data = await response.json();
        setChangeRequests(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load change requests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChangeRequests();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted for Review':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'meta':
        return 'bg-blue-100 text-blue-800';
      case 'google ads':
        return 'bg-green-100 text-green-800';
      case 'tiktok':
        return 'bg-purple-100 text-purple-800';
      case 'dv360':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-2xl font-bold mb-6">Change Requests</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-2xl font-bold mb-6">Change Requests</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Change Requests</h1>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country/Brand</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {changeRequests.length > 0 ? (
                changeRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.score.rule.title}</div>
                      <div className="text-sm text-gray-500">{request.score.rule.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlatformColor(request.score.platform)}`}>
                        {request.score.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.score.country.name}</div>
                      <div className="text-sm text-gray-500">{request.score.brand.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.score.score}/100
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.requestedScore}/100
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/change-requests/${request.id}`} className="text-indigo-600 hover:text-indigo-900 mr-3">View</Link>
                      {request.status === 'Submitted for Review' && (
                        <>
                          <Link href={`/change-requests/${request.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</Link>
                          <button className="text-red-600 hover:text-red-900">Cancel</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No change requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
