'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const showError = (message: string) => {
    setError(message);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Mock authentication directly in client code since API routes aren't working
      if (email === 'admin@example.com' && password === 'admin') {
        // Admin login
        const userData = {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        };
        
        // Store user data
        localStorage.setItem('token', 'demo-admin-token');
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect to admin page
        setTimeout(() => {
          router.push('/admin');
        }, 500);
        
        return;
      } else if (email === 'user@example.com' && password === 'user') {
        // Regular user login
        const userData = {
          id: 2,
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user'
        };
        
        // Store user data
        localStorage.setItem('token', 'demo-user-token');
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect to home page
        setTimeout(() => {
          router.push('/');
        }, 500);
        
        return;
      }
      
      // If we get here, credentials are invalid
      throw new Error('Invalid email or password');
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setAdminCredentials = () => {
    setEmail('admin@example.com');
    setPassword('admin');
  };

  const setUserCredentials = () => {
    setEmail('user@example.com');
    setPassword('user');
  };

  const loginAsAdmin = () => {
    setAdminCredentials();
    handleLogin();
  };

  const loginAsUser = () => {
    setUserCredentials();
    handleLogin();
  };

  return (
    <div className="bg-indigo-50 min-h-screen">
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <h1 className="text-4xl font-bold text-indigo-600 font-quicksand">MediaIQ</h1>
          </div>
          <h2 className="mt-4 text-center text-2xl font-semibold tracking-tight text-gray-800">
            Golden Rules Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your digital marketing compliance tools
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100">
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
            
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Demo accounts</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div>
                  <button
                    onClick={setAdminCredentials}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Set Admin
                  </button>
                </div>
                <div>
                  <button
                    onClick={setUserCredentials}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    Set User
                  </button>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <button
                    onClick={loginAsAdmin}
                    className="w-full rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Login as Admin
                  </button>
                </div>
                <div>
                  <button
                    onClick={loginAsUser}
                    className="w-full rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Login as User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
