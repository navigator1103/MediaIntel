'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Criterion {
  id: number;
  name: string;
  description: string;
}

interface Country {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Rating {
  id: number;
  criterionId: number;
  countryId: number;
  brandId: number;
  rating: number;
  month: string;
  criterion: Criterion;
  country: Country;
  brand: Brand;
}

export default function FiveStarsScoresPage() {
  const router = useRouter();
  
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  // State for data
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for form
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRatingId, setEditingRatingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    criterionId: '',
    countryId: '',
    brandId: '',
    rating: '',
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
  
  // Fetch criteria, countries, and brands on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch criteria
        const criteriaResponse = await fetch('/api/five-stars/criteria');
        if (!criteriaResponse.ok) throw new Error('Failed to fetch criteria');
        const criteriaData = await criteriaResponse.json();
        setCriteria(criteriaData);
        
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
  
  // Fetch ratings when filters change
  useEffect(() => {
    const fetchRatings = async () => {
      if (!selectedMonth) return;
      
      try {
        setLoading(true);
        
        // Prepare request body
        const requestBody = {
          month: selectedMonth,
          countryId: selectedCountry ? parseInt(selectedCountry) : undefined,
          brandId: selectedBrand ? parseInt(selectedBrand) : undefined
        };
        
        // Fetch ratings
        const response = await fetch('/api/five-stars/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) throw new Error('Failed to fetch ratings');
        
        const data = await response.json();
        setRatings(data.ratings || []);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRatings();
  }, [selectedMonth, selectedCountry, selectedBrand]);
  
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
      if (!formData.criterionId || !formData.countryId || !formData.brandId || !formData.rating || !formData.month) {
        setError('All fields are required');
        return;
      }
      
      // Prepare data for API
      const ratingData = {
        criterionId: parseInt(formData.criterionId),
        countryId: parseInt(formData.countryId),
        brandId: parseInt(formData.brandId),
        rating: parseInt(formData.rating),
        month: formData.month
      };
      
      // If in edit mode, include the rating ID
      if (isEditMode && editingRatingId) {
        ratingData['id'] = editingRatingId;
      }
      
      // Submit rating
      const response = await fetch('/api/five-stars/ratings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save rating');
      }
      
      // Reset form and state
      setFormData({
        criterionId: '',
        countryId: '',
        brandId: '',
        rating: '',
        month: selectedMonth,
      });
      
      setShowForm(false);
      setIsEditMode(false);
      setEditingRatingId(null);
      
      // Refresh ratings list
      const requestBody = {
        month: selectedMonth,
        countryId: selectedCountry ? parseInt(selectedCountry) : undefined,
        brandId: selectedBrand ? parseInt(selectedBrand) : undefined
      };
      
      const ratingsResponse = await fetch('/api/five-stars/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!ratingsResponse.ok) throw new Error('Failed to refresh ratings');
      
      const ratingsData = await ratingsResponse.json();
      setRatings(ratingsData.ratings || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle editing a rating
  const handleEditRating = (rating: Rating) => {
    // Set form to edit mode
    setIsEditMode(true);
    setEditingRatingId(rating.id);
    
    // Populate form with rating data
    setFormData({
      criterionId: rating.criterionId.toString(),
      countryId: rating.countryId.toString(),
      brandId: rating.brandId.toString(),
      rating: rating.rating.toString(),
      month: rating.month,
    });
    
    // Show the form
    setShowForm(true);
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Function to render star ratings
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Five Stars Ratings Management</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
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
              onChange={(e) => setSelectedBrand(e.target.value)}
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
      
      {/* Add/Edit Rating Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            if (showForm) {
              // Cancel form
              setShowForm(false);
              setIsEditMode(false);
              setEditingRatingId(null);
              setFormData({
                criterionId: '',
                countryId: '',
                brandId: '',
                rating: '',
                month: selectedMonth,
              });
            } else {
              // Show form for adding new rating
              setShowForm(true);
            }
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Rating'}
        </button>
      </div>
      
      {/* Add/Edit Rating Form */}
      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">{isEditMode ? 'Edit Rating' : 'Add New Rating'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Criterion Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Criterion</label>
                <select
                  name="criterionId"
                  value={formData.criterionId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Criterion</option>
                  {criteria.map(criterion => (
                    <option key={criterion.id} value={criterion.id.toString()}>
                      {criterion.name}
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
              
              {/* Rating Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Rating</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
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
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Rating'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Ratings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 bg-gray-50 border-b">Ratings</h2>
        
        {loading && !ratings.length ? (
          <div className="p-4 text-center">Loading ratings...</div>
        ) : ratings.length === 0 ? (
          <div className="p-4 text-center">No ratings found for the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criterion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ratings.map(rating => (
                  <tr key={rating.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rating.criterion.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rating.country.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rating.brand.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderStars(rating.rating)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(rating.month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => handleEditRating(rating)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
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
