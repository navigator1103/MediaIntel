'use client';

import { usePathname } from 'next/navigation';
import BeiersdorfHeader from '@/components/BeiersdorfHeader';
import DebugConsole from '@/components/DebugConsole';

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show header on login page
  const showHeader = pathname !== '/login';
  
  return (
    <>
      {showHeader && <BeiersdorfHeader />}
      <main className={showHeader ? 'pt-16' : ''}>
        {children}
      </main>
      <DebugConsole />
    </>
  );
}
