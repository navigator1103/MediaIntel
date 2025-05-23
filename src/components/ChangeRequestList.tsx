'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChangeRequestStatus from './ChangeRequestStatus';
import { Dialog } from '@headlessui/react';

interface ChangeRequest {
  id: number;
  scoreId: number;
  userId?: number;
  requestedScore: number;
  comments: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  score: {
    id: number;
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
  };
  user?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
}

interface ChangeRequestListProps {
  statusFilter?: string;
  limit?: number;
  isAdmin?: boolean;
  brandId?: string;
  countryId?: string;
  timeframe?: string;
}

export default function ChangeRequestList({ 
  statusFilter, 
  limit, 
  isAdmin = false,
  brandId,
  countryId,
  timeframe
}: ChangeRequestListProps) {
  console.log('ChangeRequestList - isAdmin:', isAdmin);
  const router = useRouter();
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{id: number, status: string, comments: string} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const openConfirmDialog = (id: number, status: string) => {
    const request = changeRequests.find(r => r.id === id);
    if (!request) return;
    
    setConfirmAction({
      id,
      status,
      comments: request.comments
    });
    setRejectionReason('');
    setIsConfirmDialogOpen(true);
  };
  
  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
    setRejectionReason('');
  };
  
  const handleStatusUpdate = async (id: number, newStatus: string, adminComments?: string) => {
    try {
      setProcessingId(id);
      console.log(`Updating change request ${id} status to ${newStatus}`);
      
      const response = await fetch(`/api/change-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminComments: adminComments
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating status:', errorText);
        throw new Error(`Failed to update change request: ${response.status}`);
      }
      
      // Refresh the list after successful update
      fetchChangeRequests();
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during update');
    } finally {
      setProcessingId(null);
    }
  };

  const fetchChangeRequests = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      let url = '/api/change-requests';
      
      // Add query parameters if needed
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (brandId) params.append('brandId', brandId);
      if (countryId) params.append('countryId', countryId);
      if (timeframe) params.append('timeframe', timeframe);
      if (limit) params.append('limit', limit.toString());
      
      // Add timestamp to prevent caching
      params.append('_', new Date().getTime().toString());
      
      if (params.toString()) url += `?${params.toString()}`;
      
      console.log('Fetching change requests from:', url);
      const response = await fetch(url, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        next: { revalidate: 0 } // Next.js 13+ way to prevent caching
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch change requests: ${response.status} ${response.statusText}`);
      }
      
      let data = await response.json();
      console.log(`Fetched ${data.length} change requests`);
      
      // Ensure user property exists even if null
      data = data.map(request => ({
        ...request,
        user: request.user || null
      }));
      
      // Apply limit if specified
      if (limit && data.length > limit) {
        data = data.slice(0, limit);
      }
      
      setChangeRequests(data);
    } catch (err) {
      console.error('Error in fetchChangeRequests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching change requests');
    } finally {
      setLoading(false);
    }
  };
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchChangeRequests();
  }, [statusFilter, limit, brandId, countryId, timeframe]);

  if (loading) {
    return <div className="p-4 text-center">Loading change requests...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (changeRequests.length === 0) {
    return <div className="p-4 text-center text-gray-500">No change requests found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rule
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Country
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Brand
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Current Score
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Requested Score
            </th>
            {isAdmin && (
              <>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comments
                </th>
              </>
            )}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {changeRequests.map((request) => (
            <tr key={request.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {request.score.rule.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.score.country.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.score.brand.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.score.score}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {request.requestedScore}
              </td>
              {isAdmin && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.user ? (
                      <span title={request.user.email}>
                        {request.user.name || request.user.email.split('@')[0]}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate max-w-xs hover:whitespace-normal hover:overflow-visible">
                      {request.comments || 'No comments provided'}
                    </div>
                  </td>
                </>
              )}
              <td className="px-6 py-4 whitespace-nowrap">
                <ChangeRequestStatus status={request.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(request.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <a 
                    href={`/admin/change-requests/${request.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/admin/change-requests/${request.id}`);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 cursor-pointer"
                  >
                    View
                  </a>
                  
                  {isAdmin && request.status === 'Submitted for Review' && (
                    <>
                      <button
                        onClick={() => openConfirmDialog(request.id, 'Approved')}
                        disabled={processingId === request.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 px-2 py-1 rounded border border-green-200 hover:bg-green-50"
                      >
                        {processingId === request.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => openConfirmDialog(request.id, 'Rejected')}
                        disabled={processingId === request.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                      >
                        {processingId === request.id ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Confirmation Dialog */}
      {isConfirmDialogOpen && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {confirmAction.status === 'Approved' ? 'Approve Change Request' : 'Reject Change Request'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Original request comments:</p>
              <div className="bg-gray-50 p-3 rounded text-sm">{confirmAction.comments}</div>
            </div>
            
            {confirmAction.status === 'Rejected' && (
              <div className="mb-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (optional)
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={closeConfirmDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  confirmAction.status === 'Approved' 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
                onClick={() => {
                  handleStatusUpdate(
                    confirmAction.id, 
                    confirmAction.status, 
                    confirmAction.status === 'Rejected' ? rejectionReason : undefined
                  );
                  closeConfirmDialog();
                }}
              >
                Confirm {confirmAction.status === 'Approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
