'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopShellProvider } from '@/contexts/DesktopShellContext';
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
} from 'lucide-react';

const MORE_ITEMS = [
  { href: '/how-mining-works', label: 'How mining works', Icon: BookOpen },
  { href: '/pools', label: 'Pools', Icon: Network },
  { href: '/fees', label: 'Fees', Icon: DollarSign },
  { href: '/licenses', label: 'Licenses', Icon: FileText },
];

function SidebarContent() {
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
    await logout();
    router.push('/login');
    router.refresh();
  }

  const isWorkspace = pathname?.startsWith('/dashboard/mining') || pathname?.startsWith('/dashboard/nodes');

  function navLink(href: string, label: string, Icon: React.ComponentType<{ className?: string }>, active?: boolean) {
    return (
      <Link
        href={href}
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
      className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-white/5 bg-surface-900/98 backdrop-blur-md"
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/5 px-4">
        <Link
          href="/home"
          className="flex items-center gap-2 font-display text-base font-semibold tracking-tight text-white transition hover:text-white"
        >
          <span className="text-lg" aria-hidden="true">◇</span>
          <span>VibeMiner</span>
        </Link>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
          App
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
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
                    onClick={() => setMoreOpen(false)}
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
  return (
    <div className="flex min-h-screen bg-surface-950 bg-grid">
      <SidebarContent />
      <main
        className="min-h-screen flex-1 overflow-auto"
        className="ml-[240px]"
      >
        {children}
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
