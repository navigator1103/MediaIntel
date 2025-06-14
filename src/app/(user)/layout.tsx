'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserNavigation from '@/components/UserNavigation';
import FilterProvider from '@/components/FilterProvider';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (userData.role === 'admin') {
        // Redirect admin users to the admin dashboard
        router.push('/admin');
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
      return;
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg font-quicksand">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <FilterProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Left sidebar navigation */}
        <UserNavigation />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-y-auto pt-16">
            {children}
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}
