'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopNav } from '@/components/DesktopNav';

export function SettingsLayoutClient({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  return (
    <>
      {isDesktop && <DesktopNav />}
      <div className={isDesktop ? 'pt-14' : ''}>
        {children}
      </div>
    </>
  );
}
