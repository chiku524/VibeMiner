'use client';

import { Nav } from '@/components/Nav';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export function NetworksLayoutClient({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  return (
    <>
      <Nav />
      <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${isDesktop ? 'pt-14' : 'pt-8'}`}>
        {children}
      </div>
    </>
  );
}
