'use client';

import { useEffect, useState } from 'react';
import { DesktopNav } from '@/components/DesktopNav';

/**
 * Shown during client-side navigation (e.g. dashboard → networks).
 * Always uses in-flow layout (no fixed overlay) so nothing can cover the page.
 * Desktop: DesktopNav + spinner. Web: same shell so nav is consistent.
 */
export default function Loading() {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setIsDesktop(typeof window !== 'undefined' && window.electronAPI?.isDesktop === true);
  }, []);

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      {isDesktop ? (
        <DesktopNav />
      ) : (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <span className="font-display text-base font-semibold text-white/95">VibeMiner</span>
          </div>
        </header>
      )}
      <div
        className="flex flex-col items-center justify-center px-4 pt-14"
        style={{ minHeight: 'calc(100vh - 4rem)' }}
      >
        <div
          className="h-10 w-10 shrink-0 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin"
          aria-hidden
        />
        <p className="mt-4 text-sm text-gray-400">Loading…</p>
      </div>
    </main>
  );
}
