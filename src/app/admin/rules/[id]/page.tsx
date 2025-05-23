'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Rule {
  id: number;
  platform: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function RuleDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const router = useRouter();
  const [rule, setRule] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRule = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rules/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch rule');
        }
        
        const data = await response.json();
        setRule(data);
      } catch (err) {
        console.error('Error fetching rule:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (!isNaN(id)) {
      fetchRule();
    } else {
      setError('Invalid rule ID');
      setLoading(false);
    }
  }, [id]);

  const handleEdit = () => {
    router.push(`/admin/rules/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/rules/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete rule');
      }
      
      router.push('/admin/rules');
    } catch (err) {
      console.error('Error deleting rule:', err);
      alert(err instanceof Error ? err.message : 'An error occurred during deletion');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading rule details...</div>;
  }

  if (error) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-4">
            <Link
              href="/admin/rules"
              className="text-indigo-600 hover:text-indigo-900"
            >
              &larr; Back to Rules
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-600">Rule Not Found</h1>
          <p className="mt-2 text-gray-600">The requested rule could not be found.</p>
          <div className="mt-4">
            <Link
              href="/admin/rules"
              className="text-indigo-600 hover:text-indigo-900"
            >
              &larr; Back to Rules
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/admin/rules"
          className="text-indigo-600 hover:text-indigo-900"
        >
          &larr; Back to Rules
        </Link>
        
        <div className="flex space-x-3">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Rule
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Rule
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Rule Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              ID: {rule.id}
            </p>
          </div>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              rule.status === 'active' ? 'bg-green-100 text-green-800' : 
              rule.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {rule.status}
            </span>
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              rule.priority === 'high' ? 'bg-red-100 text-red-800' : 
              rule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {rule.priority}
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {rule.title}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Platform</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {rule.platform}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {rule.category}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                {rule.description}
              </dd>
            </div>
            
            {rule.createdAt && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(rule.createdAt).toLocaleString()}
                </dd>
              </div>
            )}
            
            {rule.updatedAt && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(rule.updatedAt).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
