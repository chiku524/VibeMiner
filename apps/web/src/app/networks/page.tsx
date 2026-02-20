'use client';

import { Nav } from '@/components/Nav';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NetworksShowcase } from '@/components/NetworksShowcase';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { site } from '@/lib/site';

const base = site.baseUrl.replace(/\/$/, '');

export default function NetworksPage() {
  const isDesktop = useIsDesktop();
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <Nav />
      <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${isDesktop ? 'pt-14' : 'pt-8'}`}>
        <Breadcrumbs crumbs={[{ label: 'Home', href: isDesktop ? '/app' : '/' }, { label: 'Networks' }]} />
      </div>
      <NetworksShowcase />
    </main>
  );
}
