'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export function Nav() {
  const reduced = useReducedMotion() ?? false;
  const isDesktop = useIsDesktop();
  const { user, profile, accountType, isAdmin, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await logout();
    router.push('/');
    router.refresh();
  }

  const displayLabel =
    accountType === 'network' && profile?.network_name
      ? profile.network_name
      : profile?.display_name || user?.email?.split('@')[0] || 'Account';

  return (
    <motion.header
      initial={reduced ? false : { y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href={isDesktop && user ? '/dashboard' : '/'}
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
        >
          <span className="text-2xl" aria-hidden="true">◇</span>
          <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
            VibeMiner
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link href="/networks" className="text-sm font-medium text-gray-400 transition hover:text-white">
            Networks
          </Link>
          <Link href="/pools" className="text-sm font-medium text-gray-400 transition hover:text-white">
            Pools
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-gray-400 transition hover:text-white" title="Scrolls to section on home">
            How it works
          </Link>
          {!isDesktop && (
            <Link href="/download" className="text-sm font-medium text-gray-400 transition hover:text-white">
              Download
            </Link>
          )}
          {isDesktop && (
            <span className="text-sm font-medium text-accent-cyan/90" aria-hidden="true">Desktop app</span>
          )}
          <Link href="/fees" className="text-sm font-medium text-gray-400 transition hover:text-white">
            Fees
          </Link>
          {!loading && (
            user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-850/80 px-3 py-2 text-sm font-medium text-white transition hover:bg-surface-850"
                >
                  <span className="max-w-[120px] truncate">{displayLabel}</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-gray-400">
                    {isAdmin ? 'Admin' : accountType === 'network' ? 'Network' : 'Miner'}
                  </span>
                  <span className="text-gray-500" aria-hidden="true">▾</span>
                </button>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-1 w-48 rounded-xl border border-white/10 bg-surface-900 py-1 shadow-xl"
                  >
                    {accountType === 'user' && (
                      <Link
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        Miner dashboard
                      </Link>
                    )}
                    {accountType === 'network' && (
                      <Link
                        href="/dashboard/network"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        Network dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/dashboard/admin"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-red-400"
                    >
                      Sign out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login?returnTo=/dashboard" className="text-sm font-medium text-gray-400 transition hover:text-white">
                  Sign in
                </Link>
                <Link href="/register?returnTo=/dashboard" className="rounded-lg bg-accent-cyan/20 px-4 py-2 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30">
                  Register
                </Link>
                <Link href="/dashboard" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5">
                  Start mining
                </Link>
              </>
            )
          )}
        </div>
      </nav>
    </motion.header>
  );
}
