'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 font-display text-sm font-medium text-gray-500">
          <span className="text-lg">◇</span>
          Vibe Mine
        </div>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/#networks" className="transition hover:text-white">Networks</Link>
          <Link href="/#how-it-works" className="transition hover:text-white">How it works</Link>
          <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-gray-600">
        Mine responsibly. This software connects you to mining pools; rewards depend on pool and network.
      </p>
    </footer>
  );
}
