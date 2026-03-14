'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Desktop app navigation: Workspace dropdown (Mining, Run nodes), Sessions, Networks,
 * Settings, More dropdown, Admin, Sign out.
 */
export function DesktopNav() {
  const { user, isAdmin, loading, logout, accountType } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const isNetworkAccount = accountType === 'network';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) setWorkspaceOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function handleSignOut() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  const moreItems = [
    { href: '/how-mining-works', label: 'How mining works' },
    { href: '/pools', label: 'Pools' },
    { href: '/fees', label: 'Fees' },
    { href: '/licenses', label: 'Licenses' },
  ];

  const isWorkspace = pathname?.startsWith('/dashboard/mining') || pathname?.startsWith('/dashboard/nodes');

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
        <div className="flex items-center gap-1 sm:gap-2">
          {!isNetworkAccount && (
            <>
              <div className="relative" ref={workspaceRef}>
                <button
                  type="button"
                  onClick={() => setWorkspaceOpen((o) => !o)}
                  className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-sm transition hover:bg-white/5 hover:text-white ${isWorkspace ? 'text-white' : 'text-gray-400'}`}
                  aria-expanded={workspaceOpen}
                  aria-haspopup="true"
                >
                  Workspace
                  <span className="text-xs" aria-hidden>▾</span>
                </button>
                {workspaceOpen && (
                  <div className="absolute left-0 top-full mt-1 w-40 rounded-xl border border-white/10 bg-surface-900 py-1 shadow-xl">
                    <Link href="/dashboard/mining" onClick={() => setWorkspaceOpen(false)} className="block px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white">Mining</Link>
                    <Link href="/dashboard/nodes" onClick={() => setWorkspaceOpen(false)} className="block px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white">Run nodes</Link>
                  </div>
                )}
              </div>
              <Link href="/dashboard/sessions" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
                Sessions
              </Link>
            </>
          )}
          {isNetworkAccount && (
            <Link href="/dashboard/network" className={`rounded px-2.5 py-1.5 text-sm transition hover:bg-white/5 hover:text-white ${pathname === '/dashboard/network' ? 'text-white' : 'text-gray-400'}`}>
              Dashboard
            </Link>
          )}
          <Link href="/networks" className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Networks
          </Link>
          <Link href={isNetworkAccount ? '/dashboard/settings' : '/dashboard/settings'} className="rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white">
            Settings
          </Link>
          {!isNetworkAccount && (
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className="flex items-center gap-1 rounded px-2.5 py-1.5 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                More
                <span className="text-xs" aria-hidden>▾</span>
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-white/10 bg-surface-900 py-1 shadow-xl">
                  {moreItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
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
