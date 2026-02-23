'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopNav } from '@/components/DesktopNav';

/**
 * Shown during client-side navigation (e.g. dashboard → home, → settings, → networks).
 * Must always show visible content so the user never sees a dark blank screen.
 * Desktop: show DesktopNav + loading area. Web: full-screen overlay with visible spinner + text.
 */
export default function Loading() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <DesktopNav />
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

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-surface-950"
      aria-busy="true"
      aria-label="Loading"
    >
      <div
        className="h-10 w-10 shrink-0 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin"
        aria-hidden
      />
      <p className="mt-4 text-sm text-gray-400">Loading…</p>
    </div>
  );
}
