'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = () => {
      // Check if user is logged in and is an admin
      const user = localStorage.getItem('user');
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return false;
      }

      try {
        const userData = JSON.parse(user);
        console.log('User role:', userData.role);
        
        if (userData.role !== 'admin') {
          console.log('User is not admin, redirecting to user dashboard');
          router.push('/');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/login');
        return false;
      }
    };

    if (checkAdminAuth()) {
      setLoading(false);
    }
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
    <div className="flex h-screen overflow-hidden">
      <div className="flex-none">
        <AdminNavigation />
      </div>
      <div className="flex-1 overflow-y-auto" id="admin-content">
        {children}
      </div>
    </div>
  );
}
