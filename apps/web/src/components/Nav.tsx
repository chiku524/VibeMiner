'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { BrandMark } from '@/components/BrandMark';

const MORE_LINKS = [
  { href: '/pools', label: 'Pools' },
  { href: '/fees', label: 'Fees' },
  { href: '/licenses', label: 'Licenses' },
];

export function Nav() {
  const reduced = useReducedMotion() ?? false;
  const isDesktop = useIsDesktop();
  const { user, profile, accountType, isAdmin, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) setWorkspaceOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [mobileOpen]);

  async function handleSignOut() {
    setOpen(false);
    setMobileOpen(false);
    await logout();
    router.push('/');
    router.refresh();
  }

  const displayLabel =
    accountType === 'network' && profile?.network_name
      ? profile.network_name
      : profile?.display_name || user?.email?.split('@')[0] || 'Account';

  // Desktop app uses DesktopShell sidebar; no top nav.
  if (isDesktop) {
    return null;
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <motion.header
        initial={reduced ? false : { y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl"
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href={user ? '/home' : '/'}
            className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold tracking-tight"
          >
            <BrandMark className="h-7 w-7 shrink-0" />
            <span className="truncate bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
              VibeMiner
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-3 md:flex md:gap-4">
            <div className="relative" ref={workspaceRef}>
              <button
                type="button"
                onClick={() => setWorkspaceOpen((o) => !o)}
                className="text-sm font-medium text-gray-400 transition hover:text-white"
                aria-expanded={workspaceOpen}
                aria-haspopup="true"
              >
                Workspace
                <span className="ml-0.5 text-xs" aria-hidden>▾</span>
              </button>
              {workspaceOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-0 top-full mt-1 w-40 rounded-xl border border-white/10 bg-surface-900 py-1 shadow-xl"
                >
                  <Link href="/dashboard/mining" onClick={() => setWorkspaceOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                    Mining
                  </Link>
                  <Link href="/dashboard/nodes" onClick={() => setWorkspaceOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                    Run nodes
                  </Link>
                </motion.div>
              )}
            </div>
            <Link href="/networks" className="text-sm font-medium text-gray-400 transition hover:text-white">
              Networks
            </Link>
            <Link href="/how-mining-works" className="text-sm font-medium text-gray-400 transition hover:text-white">
              How it works
            </Link>
            <Link href="/download" className="text-sm font-medium text-gray-400 transition hover:text-white">
              Download
            </Link>
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className="text-sm font-medium text-gray-400 transition hover:text-white"
                aria-expanded={moreOpen}
                aria-haspopup="true"
              >
                More
                <span className="ml-0.5 text-xs" aria-hidden>▾</span>
              </button>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-white/10 bg-surface-900 py-1 shadow-xl"
                >
                  {MORE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
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
                </>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-lg p-2 text-gray-300 hover:bg-white/10 md:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      <div
        role="presentation"
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMobile}
      />
      <div
        id="mobile-nav-drawer"
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(300px,88vw)] flex-col border-l border-white/10 bg-surface-900/98 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
          <span className="font-display text-sm font-semibold text-white">Menu</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobile}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Workspace</p>
          <Link href="/dashboard/mining" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
            Mining
          </Link>
          <Link href="/dashboard/nodes" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
            Run nodes
          </Link>
          <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Explore</p>
          <Link href="/networks" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
            Networks
          </Link>
          <Link href="/how-mining-works" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
            How it works
          </Link>
          <Link href="/download" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
            Download
          </Link>
          {MORE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobile}
              className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {!loading && user && (
            <>
              <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Account</p>
              {accountType === 'user' && (
                <Link href="/dashboard" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                  Miner dashboard
                </Link>
              )}
              {accountType === 'network' && (
                <Link href="/dashboard/network" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                  Network dashboard
                </Link>
              )}
              {isAdmin && (
                <Link href="/dashboard/admin" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-amber-400/90 hover:bg-amber-500/10">
                  Admin
                </Link>
              )}
              <Link href="/dashboard/settings" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
                Settings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 rounded-lg px-3 py-2.5 text-left text-sm text-gray-500 hover:bg-white/5 hover:text-red-400"
              >
                Sign out
              </button>
            </>
          )}
          {!loading && !user && (
            <div className="mt-4 flex flex-col gap-2 px-3">
              <Link href="/login?returnTo=/dashboard" onClick={closeMobile} className="rounded-lg border border-white/10 px-4 py-2.5 text-center text-sm text-gray-300 hover:bg-white/5">
                Sign in
              </Link>
              <Link href="/register?returnTo=/dashboard" onClick={closeMobile} className="rounded-lg bg-accent-cyan/20 px-4 py-2.5 text-center text-sm font-medium text-accent-cyan hover:bg-accent-cyan/30">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
