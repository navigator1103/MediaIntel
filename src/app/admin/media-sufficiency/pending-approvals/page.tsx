'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiInfo, FiLoader, FiEye } from 'react-icons/fi';

interface PendingCampaign {
  id: number;
  name: string;
  year: number;
  country: {
    name: string;
  };
  range: {
    name: string;
  };
  businessUnit: {
    name: string;
  };
  _count: {
    mediaItems: number;
  };
}

interface PendingData {
  id: number;
  uploadSessionId: string;
  status: string;
  createdAt: string;
  comments: string;
  campaigns: PendingCampaign[];
  _count: {
    campaigns: number;
  };
}

export default function PendingApprovals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingData, setPendingData] = useState<PendingData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load pending data
  useEffect(() => {
    const fetchPendingData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/media-sufficiency/approve-pending');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch pending data');
        }
        
        const data = await response.json();
        setPendingData(data.pendingData || []);
      } catch (error) {
        console.error('Error fetching pending data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load pending data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingData();
  }, []);

  // Handle approval
  const handleApprove = async (id: number) => {
    try {
      setProcessingId(id);
      setError(null);
      
      const response = await fetch('/api/admin/media-sufficiency/approve-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pendingDataId: id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve pending data');
      }
      
      const result = await response.json();
      
      // Update the local state to remove the approved item
      setPendingData(pendingData.filter(item => item.id !== id));
      
      // Show success message
      setSuccessMessage(`Successfully approved data. Created ${result.result.campaignsCreated} campaigns with ${result.result.mediaItemsCreated} media items.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error approving pending data:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve pending data');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle deletion
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pending data? This action cannot be undone.')) {
      return;
    }
    
    try {
      setProcessingId(id);
      setError(null);
      
      const response = await fetch(`/api/admin/media-sufficiency/approve-pending?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pending data');
      }
      
      // Update the local state to remove the deleted item
      setPendingData(pendingData.filter(item => item.id !== id));
      
      // Show success message
      setSuccessMessage('Successfully deleted pending data.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error deleting pending data:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete pending data');
    } finally {
      setProcessingId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 max-w-full mx-auto" style={{ maxWidth: '95vw' }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Pending Data Approvals</h1>
        <button
          onClick={() => router.push('/admin/media-sufficiency')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Media Sufficiency
        </button>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-center">
          <FiCheckCircle className="mr-2" />
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
          <FiXCircle className="mr-2" />
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : pendingData.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600 text-lg">No pending data to approve.</p>
          <button
            onClick={() => router.push('/admin/media-sufficiency/enhanced-upload')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Upload New Data
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingData.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Import Session: {item.uploadSessionId}
                  </h2>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Uploaded: {formatDate(item.createdAt)}</p>
                    <p>Status: <span className="font-medium text-amber-600">{item.status}</span></p>
                    <p>Campaigns: {item._count.campaigns}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {item.status === 'pending_with_errors' ? (
                    <span className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
                      <FiAlertTriangle className="mr-1" />
                      Pending with Errors
                    </span>
                  ) : (
                    <span className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                      <FiInfo className="mr-1" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700">
                  <span className="font-medium">Comments:</span> {item.comments || 'No comments'}
                </p>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Campaigns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {item.campaigns.slice(0, 6).map((campaign) => (
                    <div key={campaign.id} className="bg-gray-50 p-3 rounded-md text-xs">
                      <p className="font-medium">{campaign.name}</p>
                      <p>Country: {campaign.country?.name || 'Unknown'}</p>
                      <p>Range: {campaign.range?.name || 'Unknown'}</p>
                      <p>Year: {campaign.year}</p>
                      <p>Media Items: {campaign._count.mediaItems}</p>
                    </div>
                  ))}
                  {item.campaigns.length > 6 && (
                    <div className="bg-gray-50 p-3 rounded-md text-xs flex items-center justify-center">
                      <p className="text-gray-500">+{item.campaigns.length - 6} more campaigns</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={processingId === item.id}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    processingId === item.id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {processingId === item.id ? (
                    <FiLoader className="animate-spin mr-2" />
                  ) : (
                    <FiXCircle className="mr-2" />
                  )}
                  Reject
                </button>
                
                <button
                  onClick={() => handleApprove(item.id)}
                  disabled={processingId === item.id}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    processingId === item.id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {processingId === item.id ? (
                    <FiLoader className="animate-spin mr-2" />
                  ) : (
                    <FiCheckCircle className="mr-2" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
