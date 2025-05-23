'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DashboardTabs = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-500';
  };

  return (
    <div className="border-b border-gray-200 flex items-center justify-between px-4 py-2">
      <div className="flex space-x-8">
        <Link href="/dashboard" className={`px-1 py-4 text-sm font-medium ${isActive('/dashboard')}`}>
          Overview
        </Link>
        <Link href="/dashboard/game-plan" className={`px-1 py-4 text-sm font-medium ${isActive('/dashboard/game-plan')}`}>
          Game Plan
        </Link>
        <Link href="/dashboard/media-sufficiency" className={`px-1 py-4 text-sm font-medium ${isActive('/dashboard/media-sufficiency')}`}>
          Sufficiency
        </Link>
        <Link href="/dashboard/media-similarity" className={`px-1 py-4 text-sm font-medium ${isActive('/dashboard/media-similarity')}`}>
          Similarity
        </Link>
      </div>
      <div className="flex items-center">
        <select className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white">
          <option>FY 2025</option>
          <option>FY 2024</option>
          <option>FY 2023</option>
        </select>
      </div>
    </div>
  );
};

export default DashboardTabs;
