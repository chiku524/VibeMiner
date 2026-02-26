'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Minimal navigation for the desktop app: Home, Dashboard, Networks, Settings,
 * optional Admin, Open in browser, and Sign out. Used when running inside the Electron desktop client.
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
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-medium text-gray-400">
            Desktop
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/dashboard" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Dashboard
          </Link>
          <Link href="/dashboard/sessions" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Sessions
          </Link>
          <Link href="/networks" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Networks
          </Link>
          <Link href="/how-mining-works" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            How mining works
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
          {!loading && !user && (
            <Link href="/login" className="rounded px-2.5 py-1.5 text-sm text-accent-cyan transition hover:bg-accent-cyan/10">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
