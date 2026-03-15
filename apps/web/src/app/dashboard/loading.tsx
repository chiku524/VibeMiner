'use client';

import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DashboardSkeleton, NetworkListSkeleton } from '@/components/ui/Skeleton';
import { DesktopNav } from '@/components/DesktopNav';

/**
 * Shown while the dashboard route is loading (e.g. client navigation to /dashboard).
 * Desktop: shows DesktopNav and links to /app for home. Web: shows header with link to /.
 */
export default function DashboardLoading() {
  const isDesktop = useIsDesktop();
  const homeHref = '/home';

  if (isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <DesktopNav />
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6">
          <div className="mb-2 h-4 w-32 rounded bg-white/10" />
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

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={homeHref} className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="text-xl" aria-hidden="true">◇</span>
            <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">VibeMiner</span>
          </Link>
          <Link href={homeHref} className="text-sm text-gray-400 transition hover:text-white">← Back home</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-2 h-4 w-32 rounded bg-white/10" />
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
