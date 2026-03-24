'use client';

import React, { useEffect, useState } from 'react';
import { NetworksNavClient } from './NetworksNavClient';
import { NetworksPageContent } from './NetworksPageContent';

/**
 * Networks layout: desktop gets content only (DesktopShell provides sidebar); web gets
 * NetworksNavClient + router children. We default to the desktop branch so the
 * desktop app never shows a blank (avoids timing/hydration issues with desktopAPI).
 */
export function NetworksLayoutClient({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setIsDesktop(typeof window !== 'undefined' && window.desktopAPI?.isDesktop === true);
  }, []);

  if (isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 min-h-screen">
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
