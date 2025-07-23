'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Sending login request to API...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      console.log('Login API response status:', response.status);
      const data = await response.json();
      console.log('Login API response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      console.log('Login successful:', data);
      
      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on user role
      if (data.user.role === 'admin') {
        console.log('Redirecting to admin dashboard...');
        window.location.href = '/admin';
      } else {
        console.log('Redirecting to media sufficiency dashboard...');
        window.location.href = '/dashboard/media-sufficiency';
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const loginAsAdmin = () => {
    console.log('Direct login as admin');
    const adminData = {
      user: {
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin'
      },
      token: 'admin-token'
    };
    
    localStorage.setItem('token', adminData.token);
    localStorage.setItem('user', JSON.stringify(adminData.user));
    
    // Use direct navigation
    window.location.href = '/admin';
  };

  const loginAsUser = () => {
    console.log('Direct login as user');
    const userData = {
      user: {
        id: 2,
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user'
      },
      token: 'user-token'
    };
    
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
    
    // Use direct navigation
    window.location.href = '/dashboard/media-sufficiency';
  };
  
  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-quicksand">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 font-quicksand">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 font-quicksand"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500 font-quicksand">Or use test accounts</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <button
              onClick={() => {
                setEmail('admin@example.com');
                setPassword('admin');
              }}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 font-quicksand"
            >
              Set Admin
            </button>
          </div>
          <div>
            <button
              onClick={() => {
                setEmail('user@example.com');
                setPassword('user');
              }}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 font-quicksand"
            >
              Set User
            </button>
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <button
              onClick={loginAsAdmin}
              className="w-full rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-quicksand"
            >
              Login as Admin
            </button>
          </div>
          <div>
            <button
              onClick={loginAsUser}
              className="w-full rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-quicksand"
            >
              Login as User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
