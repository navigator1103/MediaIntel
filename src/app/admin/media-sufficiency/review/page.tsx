'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiAlertTriangle, FiArrowLeft, FiArrowRight, FiLoader, FiEdit2, FiFilter } from 'react-icons/fi';

interface CampaignData {
  id: number;
  campaign: string;
  country: string;
  category: string;
  range: string;
  media: string;
  mediaSubtype: string;
  startDate: string;
  endDate: string;
  budget: number;
  hasIssue: boolean;
  issueType?: string;
}

export default function ReviewMediaSufficiency() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [filteredData, setFilteredData] = useState<CampaignData[]>([]);
  const [filterIssues, setFilterIssues] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [editingItem, setEditingItem] = useState<CampaignData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Load campaign data from the API
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch data from the API
        const response = await fetch(`/api/admin/media-sufficiency/review?sessionId=${sessionId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch session data');
        }
        
        const data = await response.json();
        
        // Check if the data has the expected structure
        if (!data.campaignData) {
          throw new Error('Invalid session data format');
        }
        
        // Set the campaign data from the API response
        setCampaignData(data.campaignData);
        setFilteredData(data.campaignData);
        setLoading(false);

        
      } catch (error) {
        console.error('Error loading campaign data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data. Please try again.');
        setLoading(false);
      }
    };
    
    loadCampaignData();
  }, [sessionId]);
  
  // Handle filtering
  useEffect(() => {
    if (filterIssues) {
      setFilteredData(campaignData.filter(item => item.hasIssue));
    } else {
      setFilteredData(campaignData);
    }
  }, [filterIssues, campaignData]);
  
  // Handle import
  const handleImport = () => {
    setImportStatus('importing');
    
    // Simulate import process
    setTimeout(() => {
      setImportStatus('success');
      
      // Show success message briefly before redirecting
      setTimeout(() => {
        router.push('/admin/media-sufficiency');
      }, 2000);
    }, 2000);
  };
  
  // Handle navigation
  const handleBack = () => {
    router.push(`/admin/media-sufficiency/validate?sessionId=${sessionId}`);
  };
  
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-quicksand text-gray-800">Reviewing Data</h1>
          <button
            onClick={() => router.push('/admin/media-sufficiency')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-quicksand"
          >
            Back
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-center justify-center">
          <FiLoader className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-lg text-gray-700">Loading campaign data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-quicksand text-gray-800">Error</h1>
          <button
            onClick={() => router.push('/admin/media-sufficiency')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-quicksand"
          >
            Back
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center text-red-600 mb-4">
            <FiAlertTriangle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-medium">Error</h2>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/admin/media-sufficiency')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-quicksand"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-quicksand text-gray-800">Review Media Sufficiency Data</h1>
        <button
          onClick={() => router.push('/admin/media-sufficiency')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-quicksand"
        >
          Back to Dashboard
        </button>
      </div>
      
      {/* Data Summary */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Step 3: Review Campaign Data</h2>
        <p className="text-gray-600 mb-6">
          Review the campaign data before importing. You can filter and edit the data as needed.
        </p>
        
        {/* Filter Controls */}
        <div className="flex items-center mb-6">
          <div className="flex items-center mr-6">
            <input
              type="checkbox"
              id="filterIssues"
              checked={filterIssues}
              onChange={(e) => setFilterIssues(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="filterIssues" className="ml-2 text-sm text-gray-700">
              Show only records with issues
            </label>
          </div>
          
          <button
            className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            <FiFilter className="mr-1" />
            More Filters
          </button>
        </div>
        
        {/* Campaign Data Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-2 px-3 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className={item.hasIssue ? 'bg-yellow-50' : ''}>
                  <td className="py-2 px-3 text-sm text-gray-700">{item.campaign}</td>
                  <td className="py-2 px-3 text-sm text-gray-700">{item.country}</td>
                  <td className="py-2 px-3 text-sm text-gray-700">{item.category}</td>
                  <td className="py-2 px-3 text-sm text-gray-700">{item.range}</td>
                  <td className="py-2 px-3 text-sm text-gray-700">{item.media} - {item.mediaSubtype}</td>
                  <td className="py-2 px-3 text-sm text-gray-700">{new Date(item.startDate).toLocaleDateString()}</td>
                  <td className="py-2 px-3 text-sm text-gray-700">{new Date(item.endDate).toLocaleDateString()}</td>
                  <td className="py-2 px-3 text-sm text-gray-700">{item.budget.toLocaleString()}</td>
                  <td className="py-2 px-3 text-sm">
                    {item.hasIssue ? (
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Warning
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{item.issueType}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Valid
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-sm">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => {
                        setEditingItem(item);
                        setShowEditModal(true);
                      }}
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No records found matching your filters.
          </div>
        )}
        
        {/* Import Status */}
        {importStatus === 'importing' && (
          <div className="bg-indigo-50 text-indigo-700 p-4 rounded-lg mt-6 flex items-center">
            <div className="h-5 w-5 mr-3">
              <div className="h-full w-full rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <span>Importing data into the system...</span>
          </div>
        )}
        
        {importStatus === 'success' && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mt-6 flex items-center">
            <FiCheckCircle className="h-5 w-5 mr-2" />
            <span>Data imported successfully! Redirecting to dashboard...</span>
          </div>
        )}
        
        {importStatus === 'error' && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mt-6 flex items-center">
            <FiAlertTriangle className="h-5 w-5 mr-2" />
            <span>There was an error importing the data. Please try again.</span>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <button
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-quicksand flex items-center"
            onClick={handleBack}
          >
            <FiArrowLeft className="mr-2" />
            Back to Validation
          </button>
          
          <button
            className={`px-6 py-2 rounded-md font-quicksand flex items-center ${
              importStatus === 'importing'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            } transition-colors`}
            disabled={importStatus === 'importing'}
            onClick={handleImport}
          >
            {importStatus === 'importing' ? (
              <>
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span>
                Importing...
              </>
            ) : (
              <>
                Import Data
                <FiArrowRight className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Import Steps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-medium mb-4 font-quicksand text-gray-800">Import Process</h2>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-1 p-4 border-l-4 border-green-600 bg-green-50 mb-4 md:mb-0 md:mr-4">
            <h3 className="font-medium text-green-800">Step 1: Upload</h3>
            <p className="text-sm text-gray-600">Upload your CSV file with media sufficiency data</p>
          </div>
          <div className="flex-1 p-4 border-l-4 border-green-600 bg-green-50 mb-4 md:mb-0 md:mr-4">
            <h3 className="font-medium text-green-800">Step 2: Validate</h3>
            <p className="text-sm text-gray-600">System validates data and checks for issues</p>
          </div>
          <div className="flex-1 p-4 border-l-4 border-indigo-600 bg-indigo-50 mb-4 md:mb-0 md:mr-4">
            <h3 className="font-medium text-indigo-800">Step 3: Review</h3>
            <p className="text-sm text-gray-600">Review and edit data before import</p>
          </div>
          <div className="flex-1 p-4 border-l-4 border-gray-300 bg-gray-50">
            <h3 className="font-medium text-gray-600">Step 4: Import</h3>
            <p className="text-sm text-gray-600">Confirm and import data into the system</p>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Campaign</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                <input 
                  type="text" 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" 
                  value={editingItem.campaign}
                  onChange={(e) => setEditingItem({...editingItem, campaign: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={editingItem.country}
                  onChange={(e) => setEditingItem({...editingItem, country: e.target.value})}
                >
                  <option value="Australia">Australia</option>
                  <option value="Brazil">Brazil</option>
                  <option value="India">India</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Chile">Chile</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Vietnam">Vietnam</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                >
                  <option value="Deo">Deo</option>
                  <option value="Face Care">Face Care</option>
                  <option value="Body Care">Body Care</option>
                  <option value="Sun Care">Sun Care</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
                <input 
                  type="text" 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" 
                  value={editingItem.range}
                  onChange={(e) => setEditingItem({...editingItem, range: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media</label>
                <select 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={editingItem.media}
                  onChange={(e) => setEditingItem({...editingItem, media: e.target.value})}
                >
                  <option value="Digital">Digital</option>
                  <option value="TV">TV</option>
                  <option value="OOH">OOH</option>
                  <option value="Traditional">Traditional</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Subtype</label>
                <select 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={editingItem.mediaSubtype}
                  onChange={(e) => setEditingItem({...editingItem, mediaSubtype: e.target.value})}
                >
                  <option value="PM & FF">PM & FF</option>
                  <option value="Influencers">Influencers</option>
                  <option value="Open TV">Open TV</option>
                  <option value="Influencers Organic">Influencers Organic</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input 
                  type="date" 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" 
                  value={editingItem.startDate}
                  onChange={(e) => setEditingItem({...editingItem, startDate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input 
                  type="date" 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" 
                  value={editingItem.endDate}
                  onChange={(e) => setEditingItem({...editingItem, endDate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input 
                  type="number" 
                  className="block w-full pl-3 pr-10 py-2 text-base bg-white text-gray-900 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md" 
                  value={editingItem.budget}
                  onChange={(e) => setEditingItem({...editingItem, budget: Number(e.target.value)})}
                />
              </div>
            </div>
            
            {editingItem.hasIssue && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Warning</h4>
                <p className="text-sm text-yellow-700">{editingItem.issueType}</p>
                <p className="text-xs text-gray-500 mt-1">Editing this record may resolve the issue.</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
              >
                Cancel
              </button>
              
              <button 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                onClick={() => {
                  // Update the campaign data with the edited item
                  const updatedData = campaignData.map(item => 
                    item.id === editingItem.id ? editingItem : item
                  );
                  
                  // Check if the edit resolves any issues
                  let updatedItem = {...editingItem};
                  
                  // Simple validation - check if Vietnam now has a subregion
                  if (editingItem.country === 'Vietnam' && editingItem.hasIssue && 
                      editingItem.issueType === 'Missing subregion') {
                    // Simulate resolving the issue
                    updatedItem.hasIssue = false;
                    updatedItem.issueType = undefined;
                  }
                  
                  // Update with the potentially fixed item
                  const finalData = campaignData.map(item => 
                    item.id === editingItem.id ? updatedItem : item
                  );
                  
                  setCampaignData(finalData);
                  setFilteredData(filterIssues ? finalData.filter(item => item.hasIssue) : finalData);
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
