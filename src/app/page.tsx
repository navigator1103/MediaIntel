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
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        setIsRedirecting(true);
        
        // Single redirect based on role - no duplicate auth checks
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard/media-sufficiency');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsRedirecting(true);
        router.push('/login');
      }
    };

    // Small delay to prevent hydration issues
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
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
