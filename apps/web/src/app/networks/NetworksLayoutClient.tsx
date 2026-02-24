'use client';

import React, { useEffect, useState } from 'react';
import { DesktopNav } from '@/components/DesktopNav';
import { NetworksNavClient } from './NetworksNavClient';
import { NetworksPageContent } from './NetworksPageContent';

/**
 * Networks layout: desktop gets DesktopNav + content rendered directly; web gets
 * NetworksNavClient + router children. We default to the desktop branch so the
 * desktop app never shows a blank (avoids timing/hydration issues with electronAPI).
 * Only after mount do we set isDesktop from window.electronAPI?.isDesktop.
 */
export function NetworksLayoutClient({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setIsDesktop(typeof window !== 'undefined' && window.electronAPI?.isDesktop === true);
  }, []);

  if (isDesktop) {
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
