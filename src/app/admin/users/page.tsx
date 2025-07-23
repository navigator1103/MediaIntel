'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserForm from './UserForm';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  accessibleCountries: string | null;
  accessibleBrands: string | null;
  accessiblePages: string | null;
  createdAt: string;
  updatedAt: string;
}


interface Country {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  // Available pages for access control
  const availablePages = [
    { id: 'media-sufficiency', name: 'Media Sufficiency' },
    { id: 'game-plans', name: 'Game Plans' },
    { id: 'admin', name: 'Admin Panel' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users, countries, and brands in parallel
        const [usersResponse, countriesResponse] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/countries')
        ]);

        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        if (!countriesResponse.ok) {
          throw new Error('Failed to fetch countries');
        }

        const usersData = await usersResponse.json();
        const countriesData = await countriesResponse.json();

        setUsers(usersData);
        setCountries(countriesData);
        setBrands([]); // Brands not implemented yet
        
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Remove the deleted user from the state
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  const handleFormSubmit = async (userData: any) => {
    try {
      const method = selectedUser ? 'PUT' : 'POST';
      const url = selectedUser 
        ? `/api/admin/users/${selectedUser.id}` 
        : '/api/admin/users';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        throw new Error(`Failed to ${selectedUser ? 'update' : 'create'} user: ${errorData}`);
      }
      
      const savedUser = await response.json();
      
      if (selectedUser) {
        // Update existing user in the list
        setUsers(users.map(user => user.id === savedUser.id ? savedUser : user));
      } else {
        // Add new user to the list
        setUsers([...users, savedUser]);
      }
      
      handleFormClose();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${selectedUser ? 'update' : 'create'} user`);
    }
  };

  // Helper function to get country names (simplified for media sufficiency focus)
  const getCountryNames = (countryIds: string | null) => {
    if (!countryIds) return 'All Countries';
    return countryIds || 'All Countries';
  };

  // Helper function to get brand names (simplified for media sufficiency focus)
  const getBrandNames = (brandIds: string | null) => {
    if (!brandIds) return 'All Brands';
    return brandIds || 'All Brands';
  };

  // Helper function to get page names
  const getPageNames = (pageIds: string | null) => {
    if (!pageIds) return 'All Pages';
    if (pageIds.trim() === '') return 'All Pages';
    
    const ids = pageIds.split(',').map(id => id.trim());
    return availablePages
      .filter(page => ids.includes(page.id))
      .map(page => page.name)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-sm text-gray-600">Manage user accounts and permissions</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button 
                onClick={handleAddUser}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New User
              </button>
            </div>
          </div>
        </div>
        
        {/* Form Modal */}
        {isFormOpen && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h3>
            </div>
            <div className="p-6">
              <UserForm
                user={selectedUser}
                countries={countries}
                brands={brands}
                onSubmit={handleFormSubmit}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        )}
        
        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Level
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country Access
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-sm">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' 
                          ? 'bg-red-100 text-red-800' 
                          : user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.role === 'super_admin' ? (
                        <span className="text-green-600 font-medium">Full Access</span>
                      ) : user.accessiblePages ? (
                        <span className="text-blue-600">{user.accessiblePages.split(',').length} pages</span>
                      ) : (
                        <span className="text-gray-400">No pages assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.role === 'super_admin' ? (
                        <span className="text-green-600 font-medium">All Countries</span>
                      ) : user.accessibleCountries ? (
                        <span className="text-blue-600">{user.accessibleCountries.split(',').length} countries</span>
                      ) : (
                        <span className="text-gray-400">All countries</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium rounded-md text-xs transition-colors duration-200"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        {!['super_admin', 'admin'].includes(user.role) && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-medium rounded-md text-xs transition-colors duration-200"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Empty State */}
        {users.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Get started by adding your first user.</p>
          </div>
        )}
      </div>
    </div>
  );
}
