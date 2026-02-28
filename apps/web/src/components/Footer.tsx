'use client';

import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export function Footer() {
  const isDesktop = useIsDesktop();

  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-display text-sm font-medium text-gray-500">
          <span className="text-lg" aria-hidden="true">◇</span>
          VibeMiner <span className="text-gray-600">by nico.builds</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 sm:justify-end">
          <Link href="/networks" className="transition hover:text-white">Networks</Link>
          <Link href="/how-mining-works" className="transition hover:text-white">How it works</Link>
          {!isDesktop && <Link href="/download" className="transition hover:text-white">Download</Link>}
          <Link href="/fees" className="transition hover:text-white">Fees</Link>
          <Link href="/licenses" className="transition hover:text-white">Licenses</Link>
          <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
          <a href="mailto:support@vibeminer.tech" className="transition hover:text-white">Support</a>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-gray-600">
        Mine responsibly. This software connects you to mining pools; rewards depend on pool and network.
        <br />
        VibeMiner by <a href="https://nico.builds" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition">nico.builds</a>.
      </p>
    </footer>
  );
}
