'use client';

import React from 'react';
import { useDesktopCheck } from '@/hooks/useIsDesktop';
import { DesktopNav } from '@/components/DesktopNav';
import { NetworksNavClient } from './NetworksNavClient';
import { NetworksPageContent } from './NetworksPageContent';

/**
 * Networks layout: desktop gets DesktopNav + content rendered directly; web gets
 * NetworksNavClient + router children. On desktop we do not use the layout's
 * children slot so we never depend on the router filling it (avoids blank screen
 * on return navigation). On web we use children as usual.
 */
export function NetworksLayoutClient({ children }: { children: React.ReactNode }) {
  const { isDesktop, hasChecked } = useDesktopCheck();

  if (!hasChecked || isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <DesktopNav />
        <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 min-h-screen">
          <NetworksPageContent />
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
