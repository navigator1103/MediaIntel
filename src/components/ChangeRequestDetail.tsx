'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChangeRequestStatus from './ChangeRequestStatus';

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

interface ChangeRequestDetailProps {
  id: number;
  isAdmin?: boolean;
}

export default function ChangeRequestDetail({ id, isAdmin = false }: ChangeRequestDetailProps) {
  console.log('ChangeRequestDetail - isAdmin:', isAdmin, 'ID:', id);
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const [updating, setUpdating] = useState(false);
  const [adminComments, setAdminComments] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchChangeRequest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/change-requests/${id}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch change request: ${response.status}`);
        }
        
        const data = await response.json();
        setChangeRequest(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChangeRequest();
  }, [id]);

  const openActionDialog = (action: 'approve' | 'reject') => {
    setActionType(action);
    setAdminComments('');
    setShowCommentDialog(true);
  };
  
  const handleStatusUpdate = async (newStatus: string) => {
    if (!changeRequest) return;
    
    try {
      setUpdating(true);
      console.log(`Updating change request ${id} status to ${newStatus}`);
      
      const response = await fetch(`/api/change-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminComments: adminComments || undefined
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error updating status:', errorText);
        throw new Error(`Failed to update change request: ${response.status}`);
      }
      
      const updatedRequest = await response.json();
      console.log('Updated request:', updatedRequest);
      setChangeRequest(updatedRequest);
      setUpdateStatus({ message: `Change request ${newStatus === 'Approved' ? 'approved' : 'rejected'} successfully`, type: 'success' });
      
      // Navigate back to the admin change requests page after a short delay
      setTimeout(() => {
        console.log('Redirecting to admin change requests page');
        router.push('/admin/change-requests');
      }, 3000);
    } catch (err) {
      console.error('Update error:', err);
      setUpdateStatus({ message: err instanceof Error ? err.message : 'An error occurred during update', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading change request details...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!changeRequest) {
    return <div className="p-4 text-center text-gray-500">Change request not found.</div>;
  }

  console.log('Rendering ChangeRequestDetail - isAdmin:', isAdmin, 'Status:', changeRequest?.status);
  
  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {updateStatus && (
          <div className={`${updateStatus.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded relative mb-4`}>
            {updateStatus.message}
          </div>
        )}
        
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Change Request #{changeRequest.id}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Submitted on {new Date(changeRequest.createdAt).toLocaleDateString()}
            </p>
          </div>
          <ChangeRequestStatus status={changeRequest.status} className="text-sm" />
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rule</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {changeRequest.score.rule.title}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Country</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {changeRequest.score.country.name}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Brand</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {changeRequest.score.brand.name}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Current Score</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {changeRequest.score.score}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Requested Score</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {changeRequest.requestedScore}
              </dd>
            </div>
            
            {isAdmin && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Submitted By</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {changeRequest.user ? (
                    <span title={changeRequest.user.email}>
                      {changeRequest.user.name || changeRequest.user.email.split('@')[0]}
                      <span className="text-gray-500 ml-2">({changeRequest.user.email})</span>
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Unknown</span>
                  )}
                </dd>
              </div>
            )}
            
            <div className={`bg-${isAdmin ? 'gray-50' : 'white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
              <dt className="text-sm font-medium text-gray-500">Comments</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {changeRequest.comments}
              </dd>
            </div>
          </dl>
        </div>
        
        {/* Only show admin actions if isAdmin is true and status is 'Submitted for Review' */}
        {isAdmin && changeRequest.status === 'Submitted for Review' && (
          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Admin Actions</h4>
            <div className="flex space-x-4">
              <button
                onClick={() => openActionDialog('approve')}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {updating ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => openActionDialog('reject')}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {updating ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Confirmation Dialog */}
      {showCommentDialog && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Change Request' : 'Reject Change Request'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Original request comments:</p>
              <div className="bg-gray-50 p-3 rounded text-sm">{changeRequest.comments}</div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="adminComments" className="block text-sm font-medium text-gray-700 mb-1">
                {actionType === 'approve' ? 'Approval Comments (optional)' : 'Rejection Reason (optional)'}
              </label>
              <textarea
                id="adminComments"
                rows={3}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder={actionType === 'approve' ? 'Add any comments about this approval...' : 'Provide a reason for rejection...'}
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
              />
            </div>
            
            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowCommentDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  actionType === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
                onClick={() => {
                  handleStatusUpdate(actionType === 'approve' ? 'Approved' : 'Rejected');
                  setShowCommentDialog(false);
                }}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
