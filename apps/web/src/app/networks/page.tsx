'use client';

import { Nav } from '@/components/Nav';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NetworksShowcase } from '@/components/NetworksShowcase';
import { site } from '@/lib/site';

const base = site.baseUrl.replace(/\/$/, '');

export default function NetworksPage() {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <Nav />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <Breadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Networks' }]} />
      </div>
      <NetworksShowcase />
    </main>
  );
}
