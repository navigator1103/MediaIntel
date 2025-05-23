'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { handleLogout } from '@/lib/auth';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserName(user.name || 'User');
        setUserEmail(user.email || '');
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const isActive = (path: string) => {
    return pathname === path ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-600 hover:text-white';
  };
  
  const isDashboardPage = pathname.startsWith('/dashboard');
  
  const onLogout = () => {
    try {
      // Clear localStorage first
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Then redirect
      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/login');
    }
  };
  
  return (
    <nav className="bg-indigo-800 fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center flex-grow">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold text-xl font-quicksand">
                MediaIQ
              </Link>
            </div>
            <div className="hidden md:block flex-grow">
              <div className="ml-10 flex items-baseline space-x-4">
                {isLoggedIn && (
                  <>
                    <Link href="/home" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/home')}`}>
                      Home
                    </Link>
                    <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>
                      Golden Rules
                    </Link>
                    <Link href="/five-stars" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/five-stars')}`}>
                      5 Stars
                    </Link>
                    <Link href="/taxonomy" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/taxonomy')}`}>
                      Taxonomy
                    </Link>
                    <Link href="/dashboard/media-sufficiency" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard/media-sufficiency')}`}>
                      Media Sufficiency
                    </Link>
                    {/* Dashboard link removed as it was redundant */}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block flex-shrink-0">
            <div className="ml-4 flex items-center md:ml-6">
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-1 text-gray-300 hover:bg-indigo-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium group"
                    aria-label="User menu"
                    aria-expanded={dropdownOpen}
                  >
                    <div className="relative w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <svg className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                        <p className="text-sm text-gray-500 truncate">{userEmail}</p>
                      </div>
                      <div className="border-t border-gray-100"></div>
                      <Link href="/change-requests" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Change Requests
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={onLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="text-gray-300 hover:bg-indigo-600 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
              )}
            </div>
          </div>
          {!isDashboardPage && (
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={toggleMenu}
                className="bg-indigo-700 inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-indigo-600 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {isOpen && !isDashboardPage && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isLoggedIn ? (
              <>
                <Link href="/home" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/home')}`} onClick={() => setIsOpen(false)}>
                  Home
                </Link>
                <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')}`}>
                  Golden Rules
                </Link>
                <Link href="/five-stars" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/five-stars')}`}>
                  5 Stars
                </Link>
                <Link href="/taxonomy" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/taxonomy')}`}>
                  Taxonomy
                </Link>
                <Link href="/dashboard/media-sufficiency" className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard/media-sufficiency')}`}>
                  Media Sufficiency
                </Link>
                <div className="px-3 py-2 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-gray-300 text-sm font-medium">
                        {userName}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {userEmail}
                      </div>
                    </div>
                  </div>
                  <Link href="/change-requests" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-indigo-600 hover:text-white">
                    Change Requests
                  </Link>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-red-600 hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-indigo-600 hover:text-white">
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
