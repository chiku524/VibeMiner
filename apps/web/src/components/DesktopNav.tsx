'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Minimal navigation for the desktop app: no web navbar, just a simple bar
 * with Home, Networks, Pools, Fees, Settings, optional Admin, and Sign out.
 * Used whenever the app is running inside the Electron desktop client.
 */
export function DesktopNav() {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/app"
          className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-white/95 transition hover:text-white"
        >
          <span className="text-lg" aria-hidden="true">◇</span>
          <span>VibeMiner</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/networks" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Networks
          </Link>
          <Link href="/pools" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Pools
          </Link>
          <Link href="/fees" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Fees
          </Link>
          <Link href="/dashboard/settings" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Settings
          </Link>
          {!loading && user && isAdmin && (
            <Link href="/dashboard/admin" className="rounded px-2.5 py-1.5 text-sm text-amber-400/90 transition hover:bg-amber-500/10 hover:text-amber-300">
              Admin
            </Link>
          )}
          {!loading && user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded px-2.5 py-1.5 text-sm text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
            >
              Sign out
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
