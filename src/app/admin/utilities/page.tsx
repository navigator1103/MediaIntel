'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SubmissionInfo {
  byDate: Record<string, number>;
  byStatus: Record<string, number>;
}

interface ClearResponse {
  message: string;
  originalCount: number;
  submissionInfo: SubmissionInfo;
}

export default function AdminUtilitiesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClearResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClearChangeRequests = async () => {
    if (!confirm('Are you sure you want to clear ALL change requests? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/clear-change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear change requests');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error clearing change requests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-indigo-600 hover:text-indigo-900"
        >
          &larr; Back to Admin Dashboard
        </Link>
      </div>
      
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Utilities</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Database Management
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Utilities for managing database records.
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h4 className="text-md font-medium text-gray-900 mb-2">Change Requests</h4>
          
          <button
            onClick={handleClearChangeRequests}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Clear All Change Requests'}
          </button>
          
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {result && (
            <div className="mt-4">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="text-md font-medium text-gray-900 mb-2">Change Request Summary</h5>
                <p className="text-sm text-gray-500 mb-2">Total change requests cleared: {result.originalCount}</p>
                
                {result.submissionInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-500">
                        Submissions by Date
                      </div>
                      <div className="border-t border-gray-200">
                        <ul className="divide-y divide-gray-200">
                          {Object.entries(result.submissionInfo.byDate).map(([date, count]) => (
                            <li key={date} className="px-4 py-3 flex justify-between">
                              <span className="text-sm text-gray-900">{date}</span>
                              <span className="text-sm font-medium text-gray-900">{count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-500">
                        Submissions by Status
                      </div>
                      <div className="border-t border-gray-200">
                        <ul className="divide-y divide-gray-200">
                          {Object.entries(result.submissionInfo.byStatus).map(([status, count]) => (
                            <li key={status} className="px-4 py-3 flex justify-between">
                              <span className="text-sm text-gray-900">{status}</span>
                              <span className="text-sm font-medium text-gray-900">{count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
