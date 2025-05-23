'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChangeRequestFormProps {
  scoreId: number;
  currentScore: number;
  ruleName: string;
  countryName: string;
  brandName: string;
}

export default function ChangeRequestForm({ 
  scoreId, 
  currentScore, 
  ruleName, 
  countryName, 
  brandName 
}: ChangeRequestFormProps) {
  const [requestedScore, setRequestedScore] = useState<number>(currentScore);
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comments) {
      setError('Please provide comments explaining your change request');
      return;
    }
    
    if (requestedScore === currentScore) {
      setError('The requested score must be different from the current score');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Create request payload
      const payload = {
        scoreId,
        requestedScore,
        comments,
        status: 'Submitted for Review'
        // Note: userId is handled by the server based on the session
      };
      
      console.log('Submitting change request:', payload);
      
      const response = await fetch('/api/change-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      // Try to get the response body regardless of status
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        responseData = { error: 'Invalid server response' };
      }
      
      if (!response.ok) {
        console.error('Server error response:', responseData);
        throw new Error(responseData.error || `Failed to submit change request: ${response.status} ${response.statusText}`);
      }
      
      console.log('Change request submitted successfully:', responseData);
      setSuccess('Change request submitted successfully!');
      
      // Reset form
      setComments('');
      setRequestedScore(currentScore);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error('Error submitting change request:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Request Score Change
        </h3>
        
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            You are requesting a change for the score of {ruleName} in {countryName} for {brandName}.
            Current score is {currentScore}.
          </p>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div>
            <label htmlFor="requestedScore" className="block text-sm font-medium text-gray-700">
              Requested Score (0-100)
            </label>
            <input
              type="number"
              id="requestedScore"
              name="requestedScore"
              min="0"
              max="100"
              value={requestedScore}
              onChange={(e) => setRequestedScore(parseInt(e.target.value))}
              className="mt-1 block w-full px-4 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              required
            />
          </div>
          
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
              Comments
            </label>
            <div className="mt-1">
              <textarea
                id="comments"
                name="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-4"
                placeholder="Please explain why this score should be changed..."
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Provide a detailed explanation for why you believe this score should be changed.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
