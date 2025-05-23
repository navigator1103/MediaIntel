'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChangeRequestDetail from '@/components/ChangeRequestDetail';

export default function ChangeRequestDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is admin
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setIsAdmin(user.role === 'admin');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);
  
  if (isNaN(id)) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-600">Invalid Change Request ID</h1>
          <p className="mt-2 text-gray-600">The ID provided is not valid.</p>
          <div className="mt-4">
            <Link
              href="/change-requests"
              className="text-indigo-600 hover:text-indigo-900"
            >
              &larr; Back to Change Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/change-requests"
          className="text-indigo-600 hover:text-indigo-900"
        >
          &larr; Back to Change Requests
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ChangeRequestDetail id={id} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
