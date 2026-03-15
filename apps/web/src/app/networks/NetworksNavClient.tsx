'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import Link from 'next/link';

/**
 * Desktop-aware logo link: /app in desktop, / on web. Used in networks layout so
 * the nav always directs to the correct "home" for the context.
 */
export function NetworksNavClient() {
  const isDesktop = useIsDesktop();
  const homeHref = '/home';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={homeHref}
          className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-white/95 hover:text-white"
        >
          <span className="text-lg" aria-hidden="true">◇</span>
          <span>VibeMiner</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/dashboard" className="rounded px-2.5 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
            Dashboard
          </Link>
          <Link href="/networks" className="rounded px-2.5 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
            Networks
          </Link>
          <Link href="/dashboard/settings" className="rounded px-2.5 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
            Settings
          </Link>
        </div>
      </nav>
    </header>
  );
}
