'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { NetworkListSkeleton, DashboardSkeleton } from '@/components/ui/Skeleton';

/**
 * Shown while DashboardContent is loading (Suspense fallback).
 * Desktop: shell provides sidebar; just show skeleton content.
 */
export function DashboardFallback() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-8 sm:px-6">
          <div className="mb-8 mt-4 h-16 w-64 rounded-lg bg-white/5 animate-pulse" aria-hidden />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
              <NetworkListSkeleton />
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/5 bg-surface-900/30 p-8">
                <DashboardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="mb-4 h-12 rounded-xl bg-white/5" />
            <div className="mb-4 h-10 w-full rounded-xl bg-white/5" />
            <NetworkListSkeleton />
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/5 bg-surface-900/30 p-8">
              <DashboardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
