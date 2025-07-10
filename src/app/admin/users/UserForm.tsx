'use client';

import { useState, useEffect } from 'react';
import { PAGES, getPagesByCategory } from '@/lib/config/pages';

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

interface UserFormProps {
  user: User | null;
  countries: Country[];
  brands: Brand[];
  onSubmit: (userData: any) => void;
  onCancel: () => void;
}

export default function UserForm({ 
  user, 
  countries, 
  brands, 
  onSubmit, 
  onCancel 
}: UserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user',
    selectedPages: [] as string[],
    selectedCountries: [] as string[],
  });
  
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [selectAllCountries, setSelectAllCountries] = useState(false);
  
  useEffect(() => {
    if (user) {
      const parseIds = (idsString: string | null): string[] => {
        if (!idsString) return [];
        return idsString.split(',').map(id => id.trim()).filter(id => id);
      };
      
      const selectedPages = parseIds(user.accessiblePages);
      const selectedCountries = parseIds(user.accessibleCountries);
      
      setFormData({
        email: user.email,
        name: user.name || '',
        password: '', // Don't populate password for security reasons
        role: user.role,
        selectedPages,
        selectedCountries,
      });
      
      // Check if all pages or countries are selected
      setSelectAllPages(selectedPages.length === PAGES.length);
      setSelectAllCountries(selectedCountries.length === 0 || selectedCountries.length === countries.length);
    }
  }, [user, countries]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePageToggle = (pageId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedPages.includes(pageId);
      const selectedPages = isSelected
        ? prev.selectedPages.filter(id => id !== pageId)
        : [...prev.selectedPages, pageId];
      
      setSelectAllPages(selectedPages.length === PAGES.length);
      return { ...prev, selectedPages };
    });
  };
  
  const handleCountryToggle = (countryId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedCountries.includes(countryId);
      const selectedCountries = isSelected
        ? prev.selectedCountries.filter(id => id !== countryId)
        : [...prev.selectedCountries, countryId];
      
      setSelectAllCountries(selectedCountries.length === countries.length);
      return { ...prev, selectedCountries };
    });
  };
  
  const handleSelectAllPages = () => {
    if (selectAllPages) {
      setFormData(prev => ({ ...prev, selectedPages: [] }));
      setSelectAllPages(false);
    } else {
      setFormData(prev => ({ ...prev, selectedPages: PAGES.map(p => p.id) }));
      setSelectAllPages(true);
    }
  };
  
  const handleSelectAllCountries = () => {
    if (selectAllCountries) {
      setFormData(prev => ({ ...prev, selectedCountries: countries.map(c => c.id.toString()) }));
      setSelectAllCountries(false);
    } else {
      setFormData(prev => ({ ...prev, selectedCountries: [] }));
      setSelectAllCountries(true);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const userData: any = {
      email: formData.email,
      name: formData.name || null,
      role: formData.role,
      accessiblePages: formData.selectedPages.length > 0 
        ? formData.selectedPages.join(',') 
        : null,
      accessibleCountries: formData.selectedCountries.length > 0 
        ? formData.selectedCountries.join(',') 
        : null, // null means all countries
      accessibleBrands: null, // Not implemented yet
    };
    
    // Only include password if it's provided (for new users or password changes)
    if (formData.password) {
      userData.password = formData.password;
    }
    
    onSubmit(userData);
  };
  
  // Group pages by category for better organization
  const pageCategories = {
    dashboard: getPagesByCategory('dashboard'),
    'media-sufficiency': getPagesByCategory('media-sufficiency'),
    'master-data': getPagesByCategory('master-data'),
    admin: getPagesByCategory('admin'),
    system: getPagesByCategory('system'),
  };
  
  const categoryLabels = {
    dashboard: 'Dashboard',
    'media-sufficiency': 'Media Sufficiency',
    'master-data': 'Master Data Management',
    admin: 'Administration',
    system: 'System',
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password {user && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!user}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {formData.role === 'admin' && (
                <p className="mt-1 text-sm text-gray-500">
                  Admins have full access to all pages and countries
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Page Access - Only show for non-admin users */}
        {formData.role !== 'admin' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Page Access</h3>
              <button
                type="button"
                onClick={handleSelectAllPages}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                {selectAllPages ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-4">
              {Object.entries(pageCategories).map(([category, pages]) => (
                <div key={category} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h4>
                  <div className="space-y-2">
                    {pages.map(page => (
                      <label key={page.id} className="flex items-start">
                        <input
                          type="checkbox"
                          checked={formData.selectedPages.includes(page.id)}
                          onChange={() => handlePageToggle(page.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-700">{page.name}</span>
                          {page.description && (
                            <p className="text-xs text-gray-500">{page.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Country Access - Only show for non-admin users */}
        {formData.role !== 'admin' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Country Access</h3>
              <button
                type="button"
                onClick={handleSelectAllCountries}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                {selectAllCountries ? 'Restrict to Selected' : 'Allow All Countries'}
              </button>
            </div>
            
            {!selectAllCountries ? (
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {countries.map(country => (
                    <label key={country.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.selectedCountries.includes(country.id.toString())}
                        onChange={() => handleCountryToggle(country.id.toString())}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{country.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-green-300 bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  User has access to all countries
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}