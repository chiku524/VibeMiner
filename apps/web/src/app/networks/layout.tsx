import { site } from '@/lib/site';
import type { Metadata } from 'next';
import { NetworksLayoutClient } from './NetworksLayoutClient';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Networks',
  description: 'Browse mainnet and devnet networks. Mine Monero, Kaspa, Ergo and more. One-click mining with VibeMiner.',
  alternates: { canonical: `${base}/networks` },
};

/**
 * Uses NetworksLayoutClient so desktop app gets DesktopNav + content (no blank). Web gets NetworksNavClient.
 */
export default function NetworksLayout({ children }: { children: React.ReactNode }) {
  return <NetworksLayoutClient>{children}</NetworksLayoutClient>;
}
