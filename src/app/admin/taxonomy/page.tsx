'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Country {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface TaxonomyScore {
  id: number;
  countryId: number;
  brandId?: number;
  platform?: string;
  month: string;
  l1Score: number;
  l2Score: number;
  l3Score: number;
  averageScore: number;
  country: Country;
  brand?: Brand;
}

export default function TaxonomyScoresPage() {
  const router = useRouter();
  
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  
  // State for data
  const [countries, setCountries] = useState<Country[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [platforms, setPlatforms] = useState<string[]>(['Meta', 'Google DV360', 'TikTok', 'Amazon', 'Pinterest']);
  const [taxonomyScores, setTaxonomyScores] = useState<TaxonomyScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    countryId: '',
    brandId: '',
    platform: '',
    month: '',
    l1Score: '',
    l2Score: '',
    l3Score: '',
  });
  
  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
      options.push({ value, label });
    }
    
    return options;
  };
  
  // Fetch countries and brands on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch countries
        const countriesResponse = await fetch('/api/countries');
        if (!countriesResponse.ok) throw new Error('Failed to fetch countries');
        const countriesData = await countriesResponse.json();
        setCountries(countriesData);
        
        // Fetch brands
        const brandsResponse = await fetch('/api/brands');
        if (!brandsResponse.ok) throw new Error('Failed to fetch brands');
        const brandsData = await brandsResponse.json();
        setBrands(brandsData);
        
        // Set default month to current month
        const currentMonth = new Date().toISOString().slice(0, 7);
        setSelectedMonth(currentMonth);
        setFormData(prev => ({ ...prev, month: currentMonth }));
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Fetch taxonomy scores when filters change
  useEffect(() => {
    const fetchTaxonomyScores = async () => {
      if (!selectedMonth) return;
      
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (selectedMonth) params.append('month', selectedMonth);
        if (selectedCountry) params.append('countryId', selectedCountry);
        if (selectedBrand) params.append('brandId', selectedBrand);
        if (selectedPlatform) params.append('platform', selectedPlatform);
        
        // Fetch taxonomy scores
        const response = await fetch(`/api/taxonomy?${params.toString()}`);
        
        if (!response.ok) throw new Error('Failed to fetch taxonomy scores');
        
        const data = await response.json();
        setTaxonomyScores(data);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaxonomyScores();
  }, [selectedMonth, selectedCountry, selectedBrand, selectedPlatform]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Calculate average score
  const calculateAverage = () => {
    if (!formData.l1Score || !formData.l2Score || !formData.l3Score) return '';
    
    const l1 = parseInt(formData.l1Score);
    const l2 = parseInt(formData.l2Score);
    const l3 = parseInt(formData.l3Score);
    
    return Math.round((l1 + l2 + l3) / 3).toString();
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      if (!formData.countryId || !formData.month || !formData.l1Score || !formData.l2Score || !formData.l3Score) {
        setError('Country, month, and scores are required');
        setLoading(false);
        return;
      }
      
      // Brand and platform are optional, but at least one should be provided
      if (!formData.brandId && !formData.platform) {
        setError('Please provide either a brand or a platform');
        setLoading(false);
        return;
      }
      
      // Validate score ranges
      const l1 = parseInt(formData.l1Score);
      const l2 = parseInt(formData.l2Score);
      const l3 = parseInt(formData.l3Score);
      
      if (l1 < 0 || l1 > 100 || l2 < 0 || l2 > 100 || l3 < 0 || l3 > 100) {
        setError('Scores must be between 0 and 100');
        setLoading(false);
        return;
      }
      
      // Prepare data for API
      const taxonomyScoreData = {
        countryId: parseInt(formData.countryId),
        month: formData.month,
        l1Score: l1,
        l2Score: l2,
        l3Score: l3,
        brandId: formData.brandId ? parseInt(formData.brandId) : undefined,
        platform: formData.platform || undefined
      };
      
      // Submit taxonomy score
      const response = await fetch('/api/taxonomy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taxonomyScoreData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save taxonomy score');
      }
      
      // Reset form and refresh scores
      setFormData({
        countryId: '',
        brandId: '',
        platform: '',
        month: '',
        l1Score: '',
        l2Score: '',
        l3Score: '',
      });
      
      setShowForm(false);
      
      // Refresh taxonomy scores
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedCountry) params.append('countryId', selectedCountry);
      
      const refreshResponse = await fetch(`/api/taxonomy?${params.toString()}`);
      if (!refreshResponse.ok) throw new Error('Failed to refresh taxonomy scores');
      
      const refreshData = await refreshResponse.json();
      setTaxonomyScores(refreshData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Taxonomy Scores</h1>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="">Select Month</option>
              {getMonthOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id.toString()}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id.toString()}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform
            </label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="">All Platforms</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Add Score Button */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Taxonomy Score'}
        </button>
      </div>
      
      {/* Add Score Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Taxonomy Score</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  name="countryId"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.countryId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id.toString()}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  name="month"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.month}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Month</option>
                  {getMonthOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand (Optional)
                </label>
                <select
                  name="brandId"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.brandId}
                  onChange={handleInputChange}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform (Optional)
                </label>
                <select
                  name="platform"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.platform}
                  onChange={handleInputChange}
                >
                  <option value="">Select Platform</option>
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  L1 Score (0-100)
                </label>
                <input
                  type="number"
                  name="l1Score"
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.l1Score}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  L2 Score (0-100)
                </label>
                <input
                  type="number"
                  name="l2Score"
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.l2Score}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  L3 Score (0-100)
                </label>
                <input
                  type="number"
                  name="l3Score"
                  min="0"
                  max="100"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={formData.l3Score}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Score
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
                value={calculateAverage()}
                readOnly
              />
              <p className="text-sm text-gray-500 mt-1">
                Average is calculated automatically (rounded to nearest integer)
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Taxonomy Score'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Scores Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Taxonomy Scores</h2>
        </div>
        
        {loading && !showForm ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
            <p>Loading scores...</p>
          </div>
        ) : taxonomyScores.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No taxonomy scores found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L1 Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L2 Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L3 Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxonomyScores.map((score) => {
                  // Format month for display (e.g., "2023-01" to "January 2023")
                  const [year, month] = score.month.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  const formattedMonth = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                  
                  return (
                    <tr key={score.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {score.country.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {score.brand ? score.brand.name : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {score.platform || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formattedMonth}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{score.l1Score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{score.l2Score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{score.l3Score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{score.averageScore}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
