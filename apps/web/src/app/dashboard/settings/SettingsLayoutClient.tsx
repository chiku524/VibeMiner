'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';

export function SettingsLayoutClient({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  return (
    <div className={!isDesktop ? 'pt-14' : ''}>
      {children}
    </div>
  );
}
