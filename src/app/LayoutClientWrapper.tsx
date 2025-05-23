'use client';

import DebugConsole from '@/components/DebugConsole';

export default function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DebugConsole />
    </>
  );
}
