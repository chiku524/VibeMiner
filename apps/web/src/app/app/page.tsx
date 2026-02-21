'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopNav } from '@/components/DesktopNav';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Mining dashboard', description: 'Choose a network and start mining', icon: '◇' },
  { href: '/networks', label: 'Networks', description: 'Browse mainnet and devnet networks', icon: '⛓' },
  { href: '/pools', label: 'Pools', description: 'How mining pools work', icon: '◈' },
  { href: '/dashboard/settings', label: 'Settings', description: 'Desktop app and preferences', icon: '⚙' },
];

export default function AppLauncherPage() {
  const isDesktop = useIsDesktop();
  const { user, accountType, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (accountType === 'network') {
      router.replace('/dashboard/network');
      return;
    }
  }, [loading, user, accountType, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        {isDesktop && <DesktopNav />}
        <div className={`flex flex-col items-center justify-center min-h-[60vh] ${isDesktop ? 'pt-14' : ''}`}>
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
          <p className="mt-4 text-sm text-gray-400">Loading…</p>
        </div>
      </main>
    );
  }

  if (accountType === 'network') {
    return null;
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      {isDesktop && <DesktopNav />}
      <div className={`flex flex-col items-center justify-center px-4 py-12 min-h-screen ${isDesktop ? 'pt-20' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-cyan/20 text-3xl mb-4">
          ◇
        </div>
        <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
          VibeMiner
        </h1>
        <p className="mt-2 text-gray-400 text-sm">
          Where would you like to go?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="grid gap-3 w-full max-w-md"
      >
        {NAV_ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface-900/50 p-4 text-left transition hover:border-accent-cyan/30 hover:bg-surface-850"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{item.label}</p>
              <p className="text-sm text-gray-500 truncate">{item.description}</p>
            </div>
            <span className="text-gray-500" aria-hidden>→</span>
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left transition hover:border-amber-500/40 hover:bg-amber-500/10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-xl">
              ◆
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-amber-200">Admin</p>
              <p className="text-sm text-amber-200/70">Platform stats and wallet</p>
            </div>
            <span className="text-amber-500/70" aria-hidden>→</span>
          </Link>
        )}
      </motion.div>

      {!isDesktop && (
        <p className="mt-8 text-xs text-gray-600">
          This launcher is also available in the desktop app.
        </p>
      )}
      </div>
    </main>
  );
}
