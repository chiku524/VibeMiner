import { site } from '@/lib/site';
import type { Metadata } from 'next';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Networks',
  description: 'Browse mainnet and devnet networks. Mine Monero, Kaspa, Ergo and more. One-click mining with VibeMiner.',
  alternates: { canonical: `${base}/networks` },
};

/**
 * Server-rendered nav shell so the Networks page is never blank (e.g. in desktop app
 * before client hydration). Uses plain links so HTML is always present; Next.js
 * still does client-side navigation for same-origin.
 */
export default function NetworksLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-white/95 hover:text-white">
            <span className="text-lg" aria-hidden="true">◇</span>
            <span>VibeMiner</span>
          </a>
          <div className="flex items-center gap-1 sm:gap-3">
            <a href="/dashboard" className="rounded px-2.5 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
              Dashboard
            </a>
            <a href="/networks" className="rounded px-2.5 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
              Networks
            </a>
            <a href="/dashboard/settings" className="rounded px-2.5 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
              Settings
            </a>
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        {children}
      </div>
    </main>
  );
}
