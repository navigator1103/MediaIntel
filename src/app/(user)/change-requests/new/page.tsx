'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChangeRequestForm from '@/components/ChangeRequestForm';
import Link from 'next/link';

interface Score {
  id: number;
  ruleId: number;
  score: number;
  rule: {
    id: number;
    title: string;
  };
  country: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
}

export default function NewChangeRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scoreId = searchParams.get('scoreId');
  
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchScore = async () => {
      if (!scoreId) {
        setError('No score ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // We need to fetch the score directly by ID
        const response = await fetch(`/api/scores/${scoreId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch score: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.id) {
          setScore(data);
          setError(null);
        } else {
          throw new Error('Score not found');
        }
      } catch (err) {
        console.error('Error fetching score:', err);
        setError(err instanceof Error ? err.message : 'Failed to load score data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScore();
  }, [scoreId]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-2xl font-bold mb-6">New Change Request</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }
  
  if (error || !scoreId) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-2xl font-bold mb-6">New Change Request</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error || 'No score ID provided'}</span>
        </div>
        <div className="mt-4">
          <Link href="/change-requests" className="text-indigo-600 hover:text-indigo-900">
            &larr; Back to Change Requests
          </Link>
        </div>
      </div>
    );
  }
  
  if (!score) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-2xl font-bold mb-6">New Change Request</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Warning!</strong>
          <span className="block sm:inline"> Score not found</span>
        </div>
        <div className="mt-4">
          <Link href="/change-requests" className="text-indigo-600 hover:text-indigo-900">
            &larr; Back to Change Requests
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Change Request</h1>
        <p className="text-gray-600 mt-2">
          Submit a request to change a score
        </p>
      </div>
      
      <div className="mb-6">
        <Link href="/change-requests" className="text-indigo-600 hover:text-indigo-900">
          &larr; Back to Change Requests
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ChangeRequestForm
          scoreId={score.id}
          currentScore={score.score}
          ruleName={score.rule.title}
          countryName={score.country.name}
          brandName={score.brand.name}
        />
      </div>
    </div>
  );
}
