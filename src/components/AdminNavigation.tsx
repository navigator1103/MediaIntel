'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { handleLogout } from '@/lib/auth';

interface NavItem {
  name: string;
  href: string;
  icon: (active: boolean) => JSX.Element;
}

const AdminNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };
  
  const onLogout = () => {
    handleLogout(router);
  };
  
  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: (active) => (
        <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Media Sufficiency Upload',
      href: '/admin/media-sufficiency/enhanced-upload',
      icon: (active) => (
        <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    {
      name: 'Game Plans Management',
      href: '/admin/media-sufficiency/game-plans',
      icon: (active) => (
        <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: 'Reach Planning Import',
      href: '/admin/reach-planning',
      icon: (active) => (
        <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: (active) => (
        <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
  ];
  
  return (
    <div className={`${expanded ? 'w-64' : 'w-20'} transition-width duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-screen font-quicksand`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className={`${expanded ? 'flex' : 'hidden'} items-center`}>
          <span className="text-xl font-bold text-indigo-600 font-quicksand">Admin Panel</span>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          {expanded ? (
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navigation.map((item) => {
            // Check if the page is implemented
            const isImplemented = [
              '/admin',
              '/admin/users',
              '/admin/media-sufficiency/game-plans',
              '/admin/media-sufficiency/enhanced-upload',
              '/admin/reach-planning'
            ].includes(item.href);
            
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  if (isImplemented) {
                    router.push(item.href);
                  } else {
                    // Show an alert for pages that are not yet implemented
                    alert(`The ${item.name} page is not yet implemented.`);
                  }
                }}
                className={`${
                  isActive(item.href)
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                } group flex items-center px-3 py-2 text-sm font-medium border-l-4 font-quicksand cursor-pointer ${
                  !isImplemented ? 'opacity-60' : ''
                }`}
              >
                {item.icon(isActive(item.href))}
                <span className={`${expanded ? 'block' : 'hidden'}`}>
                  {item.name}
                  {!isImplemented && <span className="ml-1 text-xs text-gray-400">(Coming Soon)</span>}
                </span>
              </a>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onLogout}
          className={`w-full flex ${expanded ? 'justify-between' : 'justify-center'} items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md`}
        >
          <span className={`${expanded ? 'block' : 'hidden'}`}>Logout</span>
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AdminNavigation;
