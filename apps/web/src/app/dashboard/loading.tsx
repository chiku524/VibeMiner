'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DashboardSkeleton, NetworkListSkeleton } from '@/components/ui/Skeleton';
import { WebAppHeader } from '@/components/WebAppHeader';

/**
 * Shown while the dashboard route is loading (e.g. client navigation to /dashboard).
 * Desktop: shell provides sidebar; just show skeleton. Web: header + skeleton.
 */
export default function DashboardLoading() {
  const isDesktop = useIsDesktop();
  const homeHref = '/home';

  if (isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-8 sm:px-6">
          <div className="mb-2 h-4 w-32 rounded bg-white/10" />
          <div className="mb-8 h-8 w-48 animate-pulse rounded bg-white/10" />
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            <div className="xl:col-span-1">
              <div className="mb-4 h-12 rounded-xl bg-white/5" />
              <div className="mb-4 h-10 w-full rounded-xl bg-white/5" />
              <NetworkListSkeleton />
            </div>
            <div className="xl:col-span-2">
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
      <WebAppHeader links={[{ href: homeHref, label: '← Back home' }]} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-2 h-4 w-32 rounded bg-white/10" />
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <div className="mb-4 h-12 rounded-xl bg-white/5" />
            <div className="mb-4 h-10 w-full rounded-xl bg-white/5" />
            <NetworkListSkeleton />
          </div>
          <div className="xl:col-span-2">
            <div className="rounded-2xl border border-white/5 bg-surface-900/30 p-8">
              <DashboardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
