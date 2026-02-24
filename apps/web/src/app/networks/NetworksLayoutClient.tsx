'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useDesktopCheck } from '@/hooks/useIsDesktop';
import { DesktopNav } from '@/components/DesktopNav';
import { NetworksNavClient } from './NetworksNavClient';

/** Shown when layout children are missing (e.g. client nav back to /networks before segment is ready). */
function NetworksContentFallback() {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-gray-400">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent"
        aria-hidden
      />
      <p className="mt-4 text-sm">Loading networks…</p>
    </div>
  );
}

/**
 * Wraps networks route content with the right nav so desktop app always sees DesktopNav + content (no blank).
 * When children are missing (e.g. on return navigation), shows a loading fallback instead of a blank area.
 */
export function NetworksLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isDesktop, hasChecked } = useDesktopCheck();
  const hasContent = children != null && React.Children.count(children) > 0;
  const content = hasContent ? children : <NetworksContentFallback />;
  const contentKey = pathname ?? 'networks';

  if (!hasChecked || isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <DesktopNav />
        <div key={contentKey} className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 min-h-screen">
          {content}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <NetworksNavClient />
      <div key={contentKey} className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        {content}
      </div>
    </main>
  );
}
