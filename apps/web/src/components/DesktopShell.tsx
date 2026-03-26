'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopShellProvider } from '@/contexts/DesktopShellContext';
import { BrandMark } from '@/components/BrandMark';
import {
  Pickaxe,
  Server,
  Radio,
  Network,
  Settings,
  LayoutDashboard,
  BookOpen,
  DollarSign,
  FileText,
  Shield,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

const MORE_ITEMS = [
  { href: '/how-mining-works', label: 'How mining works', Icon: BookOpen },
  { href: '/pools', label: 'Pools', Icon: Network },
  { href: '/fees', label: 'Fees', Icon: DollarSign },
  { href: '/licenses', label: 'Licenses', Icon: FileText },
];

type SidebarProps = {
  /** Close mobile drawer after navigation */
  onNavigate?: () => void;
  mobileOpen?: boolean;
};

function SidebarContent({ onNavigate, mobileOpen }: SidebarProps) {
  const { user, isAdmin, loading, logout, accountType } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const isNetworkAccount = accountType === 'network';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  async function handleSignOut() {
    onNavigate?.();
    await logout();
    router.push('/login');
    router.refresh();
  }

  function navLink(
    href: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    active?: boolean
  ) {
    return (
      <Link
        href={href}
        onClick={() => onNavigate?.()}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <aside
      id="desktop-app-sidebar"
      className={`fixed left-0 top-0 z-40 flex h-screen w-[min(260px,92vw)] flex-col border-r border-white/5 bg-surface-900/98 backdrop-blur-md transition-transform duration-200 ease-out lg:w-[240px] lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/5 px-4">
        <Link
          href="/home"
          onClick={() => onNavigate?.()}
          className="flex min-w-0 flex-1 items-center gap-2 font-display text-base font-semibold tracking-tight text-white transition hover:text-white"
        >
          <BrandMark className="h-5 w-5 shrink-0" />
          <span className="truncate">VibeMiner</span>
        </Link>
        <span className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 sm:inline">
          App
        </span>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => onNavigate?.()}
          className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 py-4">
        {!isNetworkAccount && (
          <>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Workspace</p>
            {navLink('/dashboard/mining', 'Mining', Pickaxe, pathname?.startsWith('/dashboard/mining'))}
            {navLink('/dashboard/nodes', 'Run nodes', Server, pathname?.startsWith('/dashboard/nodes'))}
            {navLink('/dashboard/sessions', 'Sessions', Radio, pathname === '/dashboard/sessions')}
          </>
        )}
        {isNetworkAccount && (
          <>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Network</p>
            {navLink('/dashboard/network', 'Dashboard', LayoutDashboard, pathname === '/dashboard/network')}
          </>
        )}
        <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Explore</p>
        {navLink('/networks', 'Networks', Network, pathname?.startsWith('/networks'))}
        {navLink('/dashboard/settings', 'Settings', Settings, pathname?.startsWith('/dashboard/settings'))}
        {!isNetworkAccount && (
          <div className="relative mt-1" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                moreOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              <ChevronDown className="h-5 w-5 shrink-0" />
              <span>More</span>
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-50 mt-0.5 w-52 rounded-xl border border-white/10 bg-surface-900 py-1 shadow-xl">
                {MORE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setMoreOpen(false);
                      onNavigate?.();
                    }}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <item.Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        {!loading && user && isAdmin && (
          <Link
            href="/dashboard/admin"
            onClick={() => onNavigate?.()}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-amber-400/90 transition hover:bg-amber-500/10 hover:text-amber-300"
          >
            <Shield className="h-5 w-5 shrink-0" />
            <span>Admin</span>
          </Link>
        )}
      </nav>
      <div className="shrink-0 border-t border-white/5 p-3">
        {!loading && user ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign out</span>
          </button>
        ) : (
          <Link
            href="/login"
            onClick={() => onNavigate?.()}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-accent-cyan transition hover:bg-accent-cyan/10"
          >
            <span>Sign in</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

function DesktopShellInner({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen min-w-0 bg-surface-950 bg-grid">
      <div
        role="presentation"
        aria-hidden={!mobileNavOpen}
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity lg:hidden ${
          mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileNavOpen(false)}
      />
      <SidebarContent mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden lg:ml-[240px]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/5 bg-surface-950/95 px-3 py-2.5 backdrop-blur-md lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            aria-controls="desktop-app-sidebar"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-lg p-2 text-gray-300 hover:bg-white/10"
          >
            <Menu className="h-6 w-6 shrink-0" />
          </button>
          <Link href="/home" className="min-w-0 truncate font-display text-sm font-semibold text-white">
            VibeMiner
          </Link>
        </header>
        <div className="min-w-0 w-full flex-1">{children}</div>
      </main>
    </div>
  );
}

export function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <DesktopShellProvider inShell={true}>
      <DesktopShellInner>{children}</DesktopShellInner>
    </DesktopShellProvider>
  );
}
