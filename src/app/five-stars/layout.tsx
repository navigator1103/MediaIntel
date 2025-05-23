'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import FilterProvider from '@/components/FilterProvider';

export default function FiveStarsLayout({
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
      // Allow both regular users and admins to access this page
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
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Top navigation */}
        <Navigation />
        
        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </FilterProvider>
  );
}
