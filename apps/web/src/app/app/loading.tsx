'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopNav } from '@/components/DesktopNav';

export default function AppLauncherLoading() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <DesktopNav />
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-14" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
          <p className="mt-4 text-sm text-gray-400">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 bg-grid flex flex-col items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      <p className="mt-4 text-sm text-gray-400">Loading…</p>
    </div>
  );
}
