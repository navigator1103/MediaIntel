'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        // For regular users, redirect to the media sufficiency dashboard
        router.push('/dashboard/media-sufficiency');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-lg font-quicksand">Redirecting...</p>
      </div>
    </div>
  );
}
