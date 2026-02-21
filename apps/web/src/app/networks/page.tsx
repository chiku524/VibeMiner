'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NetworksShowcase } from '@/components/NetworksShowcase';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Suspense } from 'react';

export default function NetworksPage() {
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
