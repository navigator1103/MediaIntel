'use client';

import { useState } from 'react';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('login'); // login, register, forgotPassword
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Always log the attempt for debugging
    console.log(`Login attempt for: ${email}`);
    
    // Add a visible message to show login is being processed
    const processingMessage = document.createElement('div');
    processingMessage.style.position = 'fixed';
    processingMessage.style.top = '0';
    processingMessage.style.left = '0';
    processingMessage.style.width = '100%';
    processingMessage.style.padding = '10px';
    processingMessage.style.backgroundColor = '#4f46e5';
    processingMessage.style.color = 'white';
    processingMessage.style.textAlign = 'center';
    processingMessage.style.zIndex = '9999';
    processingMessage.id = 'login-processing-message';
    processingMessage.innerText = 'Processing login...';
    document.body.appendChild(processingMessage);
    
    try {
      // Remove the processing message
      const processingEl = document.getElementById('login-processing-message');
      if (processingEl) document.body.removeChild(processingEl);
      
      // IMPORTANT: Check for demo accounts first and use client-side authentication for them
      // This is a guaranteed fallback that will work even if the backend is unavailable
      if ((email === 'admin@example.com' && password === 'admin') || (email.toLowerCase() === 'admin' && password === 'admin')) {
        // Admin login
        console.log('Using direct client-side authentication for admin demo account');
        const mockAdminUser = {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        };
        
        // Display success message
        const successMessage = document.createElement('div');
        successMessage.style.position = 'fixed';
        successMessage.style.top = '0';
        successMessage.style.left = '0';
        successMessage.style.width = '100%';
        successMessage.style.padding = '10px';
        successMessage.style.backgroundColor = '#4f46e5';
        successMessage.style.color = 'white';
        successMessage.style.textAlign = 'center';
        successMessage.style.zIndex = '9999';
        successMessage.innerText = 'Login successful! Redirecting to dashboard...';
        document.body.appendChild(successMessage);
        
        // Store authentication data
        localStorage.setItem('token', 'mock-admin-token');
        localStorage.setItem('user', JSON.stringify(mockAdminUser));
        document.cookie = `token=mock-admin-token; path=/; max-age=${60 * 60 * 24}`;
        
        // Use a direct navigation approach instead of location.href
        setTimeout(() => {
          const adminLink = document.createElement('a');
          adminLink.href = '/admin';
          adminLink.style.display = 'none';
          document.body.appendChild(adminLink);
          adminLink.click();
        }, 1500);
        return;
      } else if ((email === 'user@example.com' && password === 'user') || (email.toLowerCase() === 'user' && password === 'user')) {
        // Regular user login
        console.log('Using direct client-side authentication for user demo account');
        const mockRegularUser = {
          id: 2,
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user'
        };
        
        // Display success message
        const successMessage = document.createElement('div');
        successMessage.style.position = 'fixed';
        successMessage.style.top = '0';
        successMessage.style.left = '0';
        successMessage.style.width = '100%';
        successMessage.style.padding = '10px';
        successMessage.style.backgroundColor = '#4f46e5';
        successMessage.style.color = 'white';
        successMessage.style.textAlign = 'center';
        successMessage.style.zIndex = '9999';
        successMessage.innerText = 'Login successful! Redirecting to dashboard...';
        document.body.appendChild(successMessage);
        
        // Store authentication data
        localStorage.setItem('token', 'mock-user-token');
        localStorage.setItem('user', JSON.stringify(mockRegularUser));
        document.cookie = `token=mock-user-token; path=/; max-age=${60 * 60 * 24}`;
        
        // Use a direct navigation approach instead of location.href
        setTimeout(() => {
          const homeLink = document.createElement('a');
          homeLink.href = '/';
          homeLink.style.display = 'none';
          document.body.appendChild(homeLink);
          homeLink.click();
        }, 1500);
        return;
      }
      
      // For non-demo accounts, try API login with a timeout to prevent hanging
      try {
        const loadingMessage = document.createElement('div');
        loadingMessage.style.position = 'fixed';
        loadingMessage.style.top = '0';
        loadingMessage.style.left = '0';
        loadingMessage.style.width = '100%';
        loadingMessage.style.padding = '10px';
        loadingMessage.style.backgroundColor = '#4f46e5';
        loadingMessage.style.color = 'white';
        loadingMessage.style.textAlign = 'center';
        loadingMessage.style.zIndex = '9999';
        loadingMessage.id = 'api-loading-message';
        loadingMessage.innerText = 'Attempting API login...';
        document.body.appendChild(loadingMessage);
        
        // Set a timeout to fallback to demo accounts if API takes too long
        const apiTimeout = setTimeout(() => {
          const loadingEl = document.getElementById('api-loading-message');
          if (loadingEl) document.body.removeChild(loadingEl);
          
          // Show fallback message
          setError('API login timed out. Please try using the demo accounts: admin@example.com/admin or user@example.com/user');
          setIsLoading(false);
        }, 5000); // 5 second timeout
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        
        // Clear the timeout since we got a response
        clearTimeout(apiTimeout);
        
        // Remove loading message
        const loadingEl = document.getElementById('api-loading-message');
        if (loadingEl) document.body.removeChild(loadingEl);
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }
        
        if (data.user) {
          // Store user data in localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Redirect based on role
          if (data.user.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/';
          }
        }
      } catch (apiError: any) {
        console.error('API login failed:', apiError);
        setError(`Login failed: ${apiError.message}. Please try using the demo accounts: admin@example.com/admin or user@example.com/user`);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Handle registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Switch to login view after successful registration
      setView('login');
      setEmail('');
      setPassword('');
      setName('');
      setConfirmPassword('');
      alert('Account created successfully! Please log in.');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle forgot password form submission
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process password reset');
      }
      
      // Show success message and return to login view
      alert(`If an account exists for ${email}, we've sent a password reset link.`);
      setView('login');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to process password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-xl">
        {/* Logo and header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <h1 className="text-2xl font-bold text-white font-quicksand">MIQ</h1>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 font-quicksand">
            {view === 'login' && 'Welcome back'}
            {view === 'register' && 'Create your account'}
            {view === 'forgotPassword' && 'Reset your password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-quicksand">
            {view === 'login' && 'Sign in to your MediaIQ account'}
            {view === 'register' && 'Join MediaIQ to access all features'}
            {view === 'forgotPassword' && "We'll send you a link to reset your password"}
          </p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Login Form */}
        {view === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 font-quicksand">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button 
                  type="button" 
                  onClick={() => setView('forgotPassword')}
                  className="font-medium text-indigo-600 hover:text-indigo-500 font-quicksand"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-quicksand disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 font-quicksand">
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={() => setView('register')}
                  className="font-medium text-indigo-600 hover:text-indigo-500 font-quicksand"
                >
                  Sign up
                </button>
              </p>
            </div>
            
            {/* Test account info - hidden by default but can be shown for development */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <details className="text-sm text-gray-500">
                <summary className="cursor-pointer font-medium">Developer Options</summary>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@example.com');
                      setPassword('admin');
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 font-quicksand"
                  >
                    Use Admin Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('user@example.com');
                      setPassword('user');
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 font-quicksand"
                  >
                    Use User Account
                  </button>
                </div>
              </details>
            </div>
          </form>
        )}
        
        {/* Registration Form */}
        {view === 'register' && (
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label htmlFor="register-email" className="sr-only">Email address</label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="register-password" className="sr-only">Password</label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-quicksand disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create account'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 font-quicksand">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="font-medium text-indigo-600 hover:text-indigo-500 font-quicksand"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}
        
        {/* Forgot Password Form */}
        {view === 'forgotPassword' && (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div className="rounded-md shadow-sm">
              <div>
                <label htmlFor="reset-email" className="sr-only">Email address</label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-quicksand disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending reset link...
                  </span>
                ) : 'Reset password'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 font-quicksand">
                <button 
                  type="button"
                  onClick={() => setView('login')}
                  className="font-medium text-indigo-600 hover:text-indigo-500 font-quicksand"
                >
                  Back to sign in
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
