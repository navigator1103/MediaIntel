'use client';

import { useState } from 'react';
import { trackLogin } from '@/lib/gtag';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('login'); // login view only
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginType, setLoginType] = useState<'user' | 'admin' | null>(null);
  
  // Handle login form submission
  const handleLogin = async (type: 'user' | 'admin') => {
    console.log('=== LOGIN ATTEMPT START ===');
    console.log('Login type clicked:', type);
    console.log('Email:', email);
    console.log('Password length:', password.length);
    console.log('Current loading state:', isLoading);
    
    // Basic validation
    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError(''); // Clear any previous errors
    setLoginType(type);
    
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
      console.log('DEBUG: Checking demo accounts');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Admin check:', (email === 'admin@example.com' && password === 'admin') || (email.toLowerCase() === 'admin' && password === 'admin'));
      console.log('User check:', (email === 'user@example.com' && password === 'user') || (email.toLowerCase() === 'user' && password === 'user'));
      
      // Check for demo accounts and validate permissions
      let demoUser = null;
      
      console.log('Checking for demo accounts...');
      console.log('Email match check:', email === 'admin@example.com' || email.toLowerCase() === 'admin');
      console.log('Password match check:', password === 'admin');
      
      if ((email === 'admin@example.com' && password === 'admin') || (email.toLowerCase() === 'admin' && password === 'admin')) {
        demoUser = {
          id: 1,
          email: 'admin@example.com',
          name: 'Super Admin User',
          role: 'super_admin'
        };
      } else if ((email === 'user@example.com' && password === 'user') || (email.toLowerCase() === 'user' && password === 'user')) {
        demoUser = {
          id: 2,
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user'
        };
      }
      
      if (demoUser) {
        console.log('Demo account detected:', demoUser.email);
        console.log('Login type requested:', type);
        console.log('User role:', demoUser.role);
        
        // Validate permissions - check if user has required role for the requested login type
        if (type === 'admin' && !['super_admin', 'admin'].includes(demoUser.role)) {
          console.log('=== ADMIN ACCESS DENIED FOR DEMO ACCOUNT ===');
          console.log('Requested: admin, User role:', demoUser.role);
          console.log('Setting error state for demo account');
          setError('You do not have admin privileges. Please login as a regular user.');
          setIsLoading(false);
          return;
        }
        
        // Prevent admin users from accessing user dashboard
        if (type === 'user' && ['super_admin', 'admin'].includes(demoUser.role)) {
          console.log('=== USER ACCESS DENIED FOR ADMIN DEMO ACCOUNT ===');
          console.log('Requested: user dashboard, User role:', demoUser.role);
          console.log('Admin users cannot access user dashboard');
          setError('Admin users cannot access the user dashboard. Please use "Login as Admin" instead.');
          setIsLoading(false);
          return;
        }
        
        console.log('=== DEMO ACCOUNT PERMISSION CHECK PASSED ===');
        console.log('Using direct client-side authentication for demo account');
        
        // Track successful login
        trackLogin(type);
        
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
        const token = ['super_admin', 'admin'].includes(demoUser.role) ? 'mock-admin-token' : 'mock-user-token';
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('loginType', type || 'user');
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24}`;
        
        // Redirect based on login type and permissions
        setTimeout(() => {
          if (type === 'admin' && ['super_admin', 'admin'].includes(demoUser.role)) {
            console.log('Redirecting to admin dashboard');
            const adminLink = document.createElement('a');
            adminLink.href = '/admin';
            adminLink.style.display = 'none';
            document.body.appendChild(adminLink);
            adminLink.click();
          } else {
            console.log('Redirecting to user dashboard');
            const homeLink = document.createElement('a');
            homeLink.href = '/';
            homeLink.style.display = 'none';
            document.body.appendChild(homeLink);
            homeLink.click();
          }
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
          body: JSON.stringify({ email, password, loginType: type }),
          credentials: 'include'
        });
        
        // Clear the timeout since we got a response
        clearTimeout(apiTimeout);
        
        // Remove loading message
        const loadingEl = document.getElementById('api-loading-message');
        if (loadingEl) document.body.removeChild(loadingEl);
        
        const data = await response.json();
        
        if (!response.ok) {
          console.log('API login failed:', data.error || 'Login failed');
          console.log('Response status:', response.status);
          const errorMessage = data.error || 'Login failed';
          setError(errorMessage);
          setIsLoading(false);
          
          return;
        }
        
        if (data.user) {
          console.log('=== LOGIN SUCCESS ===');
          console.log('User data received:', data.user);
          console.log('Login type from state:', type);
          console.log('User role from API:', data.user.role);
          
          // CRITICAL: Double-check permissions on client side as additional security layer
          if (type === 'admin' && !['super_admin', 'admin'].includes(data.user.role)) {
            console.log('=== CLIENT-SIDE ADMIN ACCESS DENIED ===');
            console.log('Requested: admin, User role:', data.user.role);
            console.log('This should have been caught by the server, but blocking here as fallback');
            setError('You do not have admin privileges. Please login as a regular user.');
            setIsLoading(false);
            
            // Clear any stored authentication data to prevent confusion
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('loginType');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            return;
          }
          
          // CRITICAL: Prevent admin users from accessing user dashboard
          if (type === 'user' && ['super_admin', 'admin'].includes(data.user.role)) {
            console.log('=== CLIENT-SIDE USER ACCESS DENIED FOR ADMIN ===');
            console.log('Requested: user dashboard, User role:', data.user.role);
            console.log('Admin users cannot access user dashboard');
            setError('Admin users cannot access the user dashboard. Please use "Login as Admin" instead.');
            setIsLoading(false);
            
            // Clear any stored authentication data to prevent confusion
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('loginType');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            return;
          }
          
          console.log('=== PERMISSION CHECK PASSED ===');
          
          // Track successful login
          trackLogin(type);
          
          // Store user data in localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('loginType', type || 'user');
          
          // Use setTimeout to ensure localStorage is saved before redirect
          setTimeout(() => {
            // Redirect based on login type parameter, not state
            if (type === 'admin') {
              console.log('Redirecting to admin dashboard');
              window.location.href = '/admin';
            } else {
              console.log('Redirecting to user dashboard');
              window.location.href = '/dashboard';
            }
          }, 100);
        } else {
          console.log('No user data in response');
          setError('Login failed - no user data received');
          setIsLoading(false);
        }
      } catch (apiError: any) {
        console.error('API login failed:', apiError);
        setError(`Login failed: ${apiError.message}. Please try using the demo accounts: admin@example.com/admin or user@example.com/user`);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('=== CRITICAL LOGIN ERROR ===');
      console.error('Error details:', err);
      console.error('Error stack:', err.stack);
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
            <div className="h-20 w-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" opacity="0.9"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 font-quicksand">
            {view === 'login' && 'Welcome back'}
            {view === 'register' && 'Create your account'}
            {view === 'forgotPassword' && 'Reset your password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-quicksand">
            {view === 'login' && 'Sign in to your Beiersdorf Media Nebula account'}
            {view === 'register' && 'Join Beiersdorf Media Nebula to access all features'}
            {view === 'forgotPassword' && "We'll send you a link to reset your password"}
          </p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-400 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        
        {/* Login Form */}
        {view === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
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
                <a 
                  href="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500 font-quicksand"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleLogin('user')}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-quicksand disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading && loginType === 'user' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in as User...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Login as User
                  </span>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  console.log('ADMIN BUTTON CLICKED');
                  handleLogin('admin');
                }}
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 font-quicksand disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading && loginType === 'admin' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in as Admin...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Login as Admin
                  </span>
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 font-quicksand">
                Don't have an account?{' '}
                <a 
                  href="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-500 font-quicksand"
                >
                  Sign up
                </a>
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
