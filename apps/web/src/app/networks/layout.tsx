import { site } from '@/lib/site';
import type { Metadata } from 'next';
import { NetworksLayoutClient } from './NetworksLayoutClient';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Networks',
  description: 'Browse mainnet and devnet networks. Mine Monero, Kaspa, Ergo and more. One-click mining with VibeMiner.',
  alternates: { canonical: `${base}/networks` },
};

export default function NetworksLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <NetworksLayoutClient>{children}</NetworksLayoutClient>
    </main>
  );
}
