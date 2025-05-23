'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  accessibleCountries: string | null;
  accessibleBrands: string | null;
  accessiblePages: string | null;
}

interface Country {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Page {
  id: string;
  name: string;
}

interface UserFormProps {
  user: User | null;
  countries: Country[];
  brands: Brand[];
  availablePages: Page[];
  onSubmit: (userData: any) => void;
  onCancel: () => void;
}

export default function UserForm({ 
  user, 
  countries, 
  brands, 
  availablePages, 
  onSubmit, 
  onCancel 
}: UserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user',
    selectedCountries: [] as number[],
    selectedBrands: [] as number[],
    selectedPages: [] as string[],
  });
  
  useEffect(() => {
    if (user) {
      // Parse comma-separated IDs for countries, brands, and pages
      const parseIds = (idsString: string | null): number[] => {
        if (!idsString) return [];
        return idsString.split(',').map(id => parseInt(id.trim(), 10));
      };
      
      const parsePageIds = (idsString: string | null): string[] => {
        if (!idsString) return [];
        return idsString.split(',').map(id => id.trim());
      };
      
      setFormData({
        email: user.email,
        name: user.name || '',
        password: '', // Don't populate password for security reasons
        role: user.role,
        selectedCountries: parseIds(user.accessibleCountries),
        selectedBrands: parseIds(user.accessibleBrands),
        selectedPages: parsePageIds(user.accessiblePages),
      });
    }
  }, [user]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
    setFormData(prev => ({ ...prev, selectedCountries: selectedOptions }));
  };
  
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
    setFormData(prev => ({ ...prev, selectedBrands: selectedOptions }));
  };
  
  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, selectedPages: selectedOptions }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert arrays to comma-separated strings
    const userData = {
      email: formData.email,
      name: formData.name || null,
      role: formData.role,
      accessibleCountries: formData.selectedCountries.length > 0 
        ? formData.selectedCountries.join(',') 
        : null,
      accessibleBrands: formData.selectedBrands.length > 0 
        ? formData.selectedBrands.join(',') 
        : null,
      accessiblePages: formData.selectedPages.length > 0 
        ? formData.selectedPages.join(',') 
        : null,
    };
    
    // Only include password if it's provided (for new users or password changes)
    if (formData.password) {
      userData.password = formData.password;
    }
    
    onSubmit(userData);
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">
        {user ? 'Edit User' : 'Add New User'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {user && '(Leave blank to keep current password)'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accessible Countries (Hold Ctrl/Cmd to select multiple)
            </label>
            <select
              multiple
              value={formData.selectedCountries.map(String)}
              onChange={handleCountryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
            >
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for access to all countries
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accessible Brands (Hold Ctrl/Cmd to select multiple)
            </label>
            <select
              multiple
              value={formData.selectedBrands.map(String)}
              onChange={handleBrandChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
            >
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for access to all brands
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accessible Pages (Hold Ctrl/Cmd to select multiple)
            </label>
            <select
              multiple
              value={formData.selectedPages}
              onChange={handlePageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-32"
            >
              {availablePages.map(page => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for access to all pages
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {user ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
