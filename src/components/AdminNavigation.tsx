'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { handleLogout } from '@/lib/auth';
import { FiChevronDown, FiChevronRight, FiUploadCloud, FiTarget, FiGlobe, FiHardDrive } from 'react-icons/fi';

interface NavItem {
  name: string;
  href: string;
  icon: (active: boolean) => JSX.Element;
}

interface NavGroup {
  name: string;
  icon: JSX.Element;
  items: NavItem[];
}

const AdminNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'data-upload': true,
    'content-management': true,
    'configuration': true,
    'system-management': true
  });
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };
  
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };
  
  const onLogout = () => {
    handleLogout(router);
  };

  // Dashboard link (separate from groups)
  const dashboardItem: NavItem = {
    name: 'Dashboard',
    href: '/admin',
    icon: (active) => (
      <svg className={`${active ? 'text-indigo-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  };
  
  const navigationGroups: NavGroup[] = [
    {
      name: 'Data Upload & Import',
      icon: <FiUploadCloud className="h-5 w-5" />,
      items: [
        {
          name: 'Game Plans Upload',
          href: '/admin/game-plans/upload',
          icon: (active) => (
            <svg className={`${active ? 'text-orange-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )
        },
        {
          name: 'SOV Data Upload',
          href: '/admin/sov-upload',
          icon: (active) => (
            <svg className={`${active ? 'text-orange-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        },
        {
          name: 'Diminishing Returns Upload',
          href: '/admin/diminishing-returns-upload',
          icon: (active) => (
            <svg className={`${active ? 'text-orange-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          )
        },
        {
          name: 'Media Sufficiency Import',
          href: '/admin/reach-planning',
          icon: (active) => (
            <svg className={`${active ? 'text-orange-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )
        }
      ]
    },
    {
      name: 'Content Management',
      icon: <FiTarget className="h-5 w-5" />,
      items: [
        {
          name: 'Game Plans Management',
          href: '/admin/media-sufficiency/game-plans',
          icon: (active) => (
            <svg className={`${active ? 'text-purple-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          name: 'User Management',
          href: '/admin/users',
          icon: (active) => (
            <svg className={`${active ? 'text-purple-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )
        },
        {
          name: 'Entity Governance',
          href: '/admin/governance',
          icon: (active) => (
            <svg className={`${active ? 'text-purple-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    },
    {
      name: 'Configuration & Master Data',
      icon: <FiGlobe className="h-5 w-5" />,
      items: [
        {
          name: 'Countries',
          href: '/admin/countries',
          icon: (active) => (
            <svg className={`${active ? 'text-blue-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Categories',
          href: '/admin/categories',
          icon: (active) => (
            <svg className={`${active ? 'text-blue-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          )
        },
        {
          name: 'Ranges',
          href: '/admin/ranges',
          icon: (active) => (
            <svg className={`${active ? 'text-blue-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )
        },
        {
          name: 'Financial Cycles',
          href: '/admin/financial-cycles',
          icon: (active) => (
            <svg className={`${active ? 'text-blue-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    },
    {
      name: 'System Management',
      icon: <FiHardDrive className="h-5 w-5" />,
      items: [
        {
          name: 'Backups',
          href: '/admin/backups',
          icon: (active) => (
            <svg className={`${active ? 'text-gray-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          )
        },
        {
          name: 'Campaigns',
          href: '/admin/campaigns',
          icon: (active) => (
            <svg className={`${active ? 'text-gray-600' : 'text-gray-400'} mr-3 flex-shrink-0 h-5 w-5`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )
        }
      ]
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
          {/* Dashboard - standalone item */}
          <a
            href={dashboardItem.href}
            onClick={(e) => {
              e.preventDefault();
              router.push(dashboardItem.href);
            }}
            className={`${
              isActive(dashboardItem.href)
                ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
            } group flex items-center px-3 py-2 text-sm font-medium border-l-4 font-quicksand cursor-pointer`}
          >
            {dashboardItem.icon(isActive(dashboardItem.href))}
            <span className={`${expanded ? 'block' : 'hidden'}`}>
              {dashboardItem.name}
            </span>
          </a>

          {/* Navigation Groups */}
          {navigationGroups.map((group, groupIndex) => {
            const groupKey = group.name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
            const isGroupExpanded = expandedGroups[groupKey];
            const hasActiveItem = group.items.some(item => isActive(item.href));

            return (
              <div key={groupIndex} className="space-y-1">
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className={`${
                    hasActiveItem
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                  } group flex items-center w-full px-3 py-2 text-sm font-semibold text-left border-l-4 font-quicksand cursor-pointer transition-colors duration-150`}
                >
                  <span className={`mr-3 flex-shrink-0 ${hasActiveItem ? 'text-indigo-500' : 'text-gray-500'}`}>
                    {group.icon}
                  </span>
                  <span className={`${expanded ? 'block' : 'hidden'} flex-1 text-xs uppercase tracking-wider`}>
                    {group.name}
                  </span>
                  <span className={`${expanded ? 'block' : 'hidden'} ml-2 ${hasActiveItem ? 'text-indigo-500' : 'text-gray-400'}`}>
                    {isGroupExpanded ? (
                      <FiChevronDown className="h-3 w-3" />
                    ) : (
                      <FiChevronRight className="h-3 w-3" />
                    )}
                  </span>
                </button>

                {/* Group Items */}
                {isGroupExpanded && expanded && (
                  <div className="ml-3 space-y-1 border-l-2 border-gray-100 pl-3">
                    {group.items.map((item, itemIndex) => {
                      const isImplemented = [
                        '/admin',
                        '/admin/users',
                        '/admin/media-sufficiency/game-plans',
                        '/admin/game-plans/upload',
                        '/admin/reach-planning',
                        '/admin/backups',
                        '/admin/financial-cycles',
                        '/admin/governance',
                        '/admin/countries',
                        '/admin/categories',
                        '/admin/ranges',
                        '/admin/campaigns'
                      ].includes(item.href);

                      return (
                        <a
                          key={itemIndex}
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            if (isImplemented) {
                              router.push(item.href);
                            } else {
                              alert(`The ${item.name} page is not yet implemented.`);
                            }
                          }}
                          className={`${
                            isActive(item.href)
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                          } group flex items-center px-3 py-2 text-sm font-medium border-l-4 font-quicksand cursor-pointer transition-colors duration-150 ${
                            !isImplemented ? 'opacity-60' : ''
                          }`}
                        >
                          {item.icon(isActive(item.href))}
                          <span className="truncate">
                            {item.name}
                            {!isImplemented && <span className="ml-1 text-xs text-gray-400">(Coming Soon)</span>}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
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
