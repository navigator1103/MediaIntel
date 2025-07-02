'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Prevent multiple redirects
    if (isRedirecting) return;

    const checkAuth = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setIsRedirecting(true);
          router.replace('/login');
          return;
        }

        const user = JSON.parse(userStr);
        setIsRedirecting(true);
        
        // Single redirect based on role - use replace to avoid back button issues
        if (user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard/media-sufficiency');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsRedirecting(true);
        router.replace('/login');
      }
    };

    // Immediate check without delay to reduce perceived loading time
    checkAuth();
  }, [router, isRedirecting]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-lg font-quicksand">Redirecting...</p>
      </div>
    </div>
  );
}
