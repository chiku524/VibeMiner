'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NetworksShowcase } from '@/components/NetworksShowcase';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Suspense } from 'react';
import { MiningLoader } from '@/components/ui/MiningLoader';

/**
 * Shared Networks page body (breadcrumbs + showcase). Used by both the page (web) and
 * the layout when in desktop mode, so the desktop layout does not depend on the
 * router's children slot and cannot render blank on return navigation.
 */
export function NetworksPageContent() {
  const isDesktop = useIsDesktop();
  return (
    <>
      <Breadcrumbs crumbs={[{ label: 'Home', href: '/home' }, { label: 'Networks' }]} />
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <MiningLoader size="md" label="Loading networks…" />
          </div>
        }
      >
        <NetworksShowcase />
      </Suspense>
    </>
  );
}
