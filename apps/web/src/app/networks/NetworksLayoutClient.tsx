'use client';

import { useDesktopCheck } from '@/hooks/useIsDesktop';
import { DesktopNav } from '@/components/DesktopNav';
import { NetworksNavClient } from './NetworksNavClient';

/**
 * Wraps networks route content with the right nav so desktop app always sees DesktopNav + content (no blank).
 */
export function NetworksLayoutClient({ children }: { children: React.ReactNode }) {
  const { isDesktop, hasChecked } = useDesktopCheck();

  if (!hasChecked || isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <DesktopNav />
        <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 min-h-screen">
          {children}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <NetworksNavClient />
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        {children}
      </div>
    </main>
  );
}
