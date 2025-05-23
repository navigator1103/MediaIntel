'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Rule {
  id: number;
  title: string;
  platform: string;
  category: string;
}

interface Country {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Score {
  id: number;
  ruleId: number;
  countryId: number;
  brandId: number;
  score: number;
  month: string;
  rule: Rule;
  country: Country;
  brand: Brand;
}

export default function GoldenRulesScoresPage() {
  const router = useRouter();
  
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  // State for data
  const [rules, setRules] = useState<Rule[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    ruleId: '',
    countryId: '',
    brandId: '',
    score: '',
    month: '',
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
  
  // Fetch rules, countries, and brands on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch rules
        const rulesResponse = await fetch('/api/rules');
        if (!rulesResponse.ok) throw new Error('Failed to fetch rules');
        const rulesData = await rulesResponse.json();
        setRules(rulesData);
        
        // Fetch countries
        const countriesResponse = await fetch('/api/admin/countries');
        if (!countriesResponse.ok) throw new Error('Failed to fetch countries');
        const countriesData = await countriesResponse.json();
        setCountries(countriesData);
        
        // Fetch brands
        const brandsResponse = await fetch('/api/admin/brands');
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
  
  // Fetch scores when filters change
  useEffect(() => {
    const fetchScores = async () => {
      if (!selectedMonth) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('month', selectedMonth);
        
        // Only add non-empty filter values
        if (selectedPlatform && selectedPlatform.trim() !== '') {
          params.append('platform', selectedPlatform);
          console.log(`Adding platform filter: ${selectedPlatform}`);
        }
        
        if (selectedCountry && selectedCountry.trim() !== '') {
          const countryId = parseInt(selectedCountry);
          if (!isNaN(countryId)) {
            params.append('countryId', countryId.toString());
            console.log(`Adding country filter: ${countryId}`);
          }
        }
        
        if (selectedBrand && selectedBrand.trim() !== '') {
          const brandId = parseInt(selectedBrand);
          if (!isNaN(brandId)) {
            params.append('brandId', brandId.toString());
            console.log(`Adding brand filter: ${brandId}`);
          }
        }
        
        const queryString = params.toString();
        console.log('Fetching scores with params:', queryString);
        
        // Fetch scores
        const response = await fetch(`/api/scores?${queryString}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          throw new Error('Failed to fetch scores: ' + errorText);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} scores for filters:`, queryString);
        setScores(data);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching scores:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchScores();
  }, [selectedMonth, selectedPlatform, selectedCountry, selectedBrand]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      if (!formData.ruleId || !formData.countryId || !formData.brandId || !formData.score || !formData.month) {
        setError('All fields are required');
        return;
      }
      
      // Prepare data for API
      const scoreData = {
        ruleId: parseInt(formData.ruleId),
        countryId: parseInt(formData.countryId),
        brandId: parseInt(formData.brandId),
        score: parseInt(formData.score),
        month: formData.month,
        platform: rules.find(r => r.id === parseInt(formData.ruleId))?.platform || 'unknown'
      };
      
      // Submit score
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save score');
      }
      
      // Reset form and refresh scores
      setFormData({
        ruleId: '',
        countryId: '',
        brandId: '',
        score: '',
        month: selectedMonth,
      });
      
      setShowForm(false);
      
      // Refresh scores list
      const params = new URLSearchParams();
      params.append('month', selectedMonth);
      if (selectedPlatform) params.append('platform', selectedPlatform);
      if (selectedCountry) params.append('countryId', selectedCountry);
      if (selectedBrand) params.append('brandId', selectedBrand);
      
      const scoresResponse = await fetch(`/api/scores?${params.toString()}`);
      if (!scoresResponse.ok) throw new Error('Failed to refresh scores');
      
      const scoresData = await scoresResponse.json();
      setScores(scoresData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Get unique platforms from rules
  const platforms = [...new Set(rules.map(rule => rule.platform))].filter(Boolean);
  console.log('Available platforms:', platforms);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Golden Rules Scores Management</h1>
        <button
          onClick={() => router.push('/admin/scores')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Back to Scores Dashboard
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select Month</option>
              {getMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Platform Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => {
                console.log('Platform selected:', e.target.value);
                setSelectedPlatform(e.target.value);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Platforms</option>
              {platforms.map(platform => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
          
          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                console.log('Country selected:', e.target.value);
                setSelectedCountry(e.target.value);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country.id} value={country.id.toString()}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                console.log('Brand selected:', e.target.value);
                setSelectedBrand(e.target.value);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id.toString()}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Add Score Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Score'}
        </button>
      </div>
      
      {/* Add Score Form */}
      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Score</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Rule Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule</label>
                <select
                  name="ruleId"
                  value={formData.ruleId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Rule</option>
                  {rules.map(rule => (
                    <option key={rule.id} value={rule.id.toString()}>
                      {rule.title} ({rule.platform})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  name="countryId"
                  value={formData.countryId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id.toString()}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Brand Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Score Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Month</option>
                  {getMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Score'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Scores Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 bg-gray-50 border-b">Scores</h2>
        
        {loading && !scores.length ? (
          <div className="p-4 text-center">Loading scores...</div>
        ) : scores.length === 0 ? (
          <div className="p-4 text-center">No scores found for the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scores.map(score => (
                  <tr key={score.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.rule.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.rule.platform}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.country.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.brand.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span 
                        className={`inline-block w-12 text-center py-1 rounded ${
                          score.score >= 80 ? 'bg-green-100 text-green-800' : 
                          score.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {score.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(score.month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
