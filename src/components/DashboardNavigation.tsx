'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DashboardNavigation = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-600 hover:text-white';
  };

  return (
    <div className="bg-indigo-700 p-3 flex items-center justify-between mt-16 shadow-sm">
      <h1 className="text-white text-xl font-bold">Media Dashboard</h1>
      <div className="flex space-x-4">
        <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}>
          Overview
        </Link>
        <Link href="/dashboard/game-plan" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard/game-plan')}`}>
          Game Plan
        </Link>
        <Link href="/dashboard/media-sufficiency" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard/media-sufficiency')}`}>
          Sufficiency
        </Link>
        <Link href="/dashboard/media-similarity" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard/media-similarity')}`}>
          Similarity
        </Link>
      </div>
      <div className="flex items-center">
        <select className="bg-indigo-700 text-white rounded-md px-3 py-1 text-sm">
          <option>FY 2023</option>
          <option>FY 2022</option>
          <option>FY 2021</option>
        </select>
      </div>
    </div>
  );
};

export default DashboardNavigation;
