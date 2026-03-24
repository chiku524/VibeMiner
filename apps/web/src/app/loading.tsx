'use client';

import { useEffect, useState } from 'react';
import { MiningLoader } from '@/components/ui/MiningLoader';

/**
 * Shown during client-side navigation (e.g. dashboard → networks).
 * Desktop: shell provides sidebar; just show spinner. Web: header + spinner.
 */
export default function Loading() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setIsDesktop(typeof window !== 'undefined' && window.desktopAPI?.isDesktop === true);
  }, []);

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      {!isDesktop && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <span className="font-display text-base font-semibold text-white/95">VibeMiner</span>
          </div>
        </header>
      )}
      <div
        className={`flex flex-col items-center justify-center px-4 ${!isDesktop ? 'pt-14' : 'pt-6'}`}
        style={{ minHeight: 'calc(100vh - 4rem)' }}
      >
        <MiningLoader size="md" label="Loading…" />
      </div>
    </main>
  );
}
