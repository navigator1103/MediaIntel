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
        throw new Error(`Failed to ${selectedUser ? 'update' : 'create'} user`);
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
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button 
          onClick={handleAddUser}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
        >
          Add New User
        </button>
      </div>
      
      {isFormOpen && (
        <UserForm
          user={selectedUser}
          countries={countries}
          brands={brands}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
        />
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name/Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Accessible Pages
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'No Name'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getPageNames(user.accessiblePages)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found. Click "Add New User" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
