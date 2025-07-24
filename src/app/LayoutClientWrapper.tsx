'use client';

import { usePathname } from 'next/navigation';
import BeiersdorfHeader from '@/components/BeiersdorfHeader';

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show header on auth pages
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
  const showHeader = !authPages.includes(pathname);
  
  return (
    <>
      {showHeader && <BeiersdorfHeader />}
      <main className={showHeader ? 'pt-20' : ''}>
        {children}
      </main>
    </>
  );
}
