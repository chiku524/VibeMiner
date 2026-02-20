import { site } from '@/lib/site';
import type { Metadata } from 'next';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Networks',
  description: 'Browse mainnet and devnet networks. Mine Monero, Kaspa, Ergo and more. One-click mining with VibeMiner.',
  alternates: { canonical: `${base}/networks` },
};

export default function NetworksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
