'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ScoresManagementPage() {
  const router = useRouter();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Scores Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Golden Rules Scores Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-indigo-600 p-4">
            <h2 className="text-xl font-semibold text-white">Golden Rules Scores</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Manage scores for Golden Rules across different countries, brands, and platforms.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => router.push('/admin/scores/golden-rules')}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Manage Scores
              </button>
            </div>
          </div>
        </div>
        
        {/* Five Stars Scores Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-purple-600 p-4">
            <h2 className="text-xl font-semibold text-white">Five Stars Scores</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Manage Five Stars ratings for different countries and brands.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => router.push('/admin/scores/five-stars')}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Manage Scores
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
