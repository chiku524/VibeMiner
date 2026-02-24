'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NetworksShowcase } from '@/components/NetworksShowcase';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Suspense } from 'react';

/**
 * Shared Networks page body (breadcrumbs + showcase). Used by both the page (web) and
 * the layout when in desktop mode, so the desktop layout does not depend on the
 * router's children slot and cannot render blank on return navigation.
 */
export function NetworksPageContent() {
  const isDesktop = useIsDesktop();
  return (
    <>
      <Breadcrumbs crumbs={[{ label: 'Home', href: isDesktop ? '/app' : '/' }, { label: 'Networks' }]} />
      <Suspense
        fallback={
          <div className="py-24 flex flex-col items-center justify-center text-gray-400">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
            <p className="mt-4 text-sm">Loading networks…</p>
          </div>
        }
      >
        <NetworksShowcase />
      </Suspense>
    </>
  );
}
