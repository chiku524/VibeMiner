'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DesktopNav } from '@/components/DesktopNav';
import { PLATFORM_WALLET } from '@/lib/platform-wallet';

type Stats = { users: number; network_listings: number } | null;

export default function AdminDashboardPage() {
  const isDesktop = useIsDesktop();
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!loading && user && !isAdmin) {
      router.replace('/dashboard');
      return;
    }
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetch('/api/admin/stats', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json() as Promise<Stats>;
      })
      .then(setStats)
      .catch(() => setStatsError('Could not load stats'));
  }, [user, isAdmin]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      {isDesktop ? <DesktopNav /> : (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="text-xl" aria-hidden="true">◇</span>
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
                VibeMiner
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-gray-400 transition hover:text-white">
                Dashboard
              </Link>
              <Link href="/fees" className="text-sm text-gray-400 transition hover:text-white">
                Fees
              </Link>
              <Link href="/" className="text-sm text-gray-400 transition hover:text-white">
                ← Back home
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto max-w-4xl px-4 sm:px-6 ${isDesktop ? 'pt-14 pb-8' : 'py-8'}`}>
        <Breadcrumbs
          crumbs={[
            { label: 'Home', href: isDesktop ? '/app' : '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin' },
          ]}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin dashboard</h1>
          <p className="mt-1 text-gray-400">
            Platform overview and controls. All fees go to the platform wallet below.
          </p>

          {statsError && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
              {statsError}
            </p>
          )}

          <div className="mt-10 space-y-10">
            <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
              <h2 className="font-display text-lg font-semibold text-white">Platform stats</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-surface-900/50 px-4 py-3">
                  <p className="text-sm text-gray-500">Registered users</p>
                  <p className="font-mono text-2xl font-semibold text-white">{stats?.users ?? '—'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-surface-900/50 px-4 py-3">
                  <p className="text-sm text-gray-500">Network listings</p>
                  <p className="font-mono text-2xl font-semibold text-white">{stats?.network_listings ?? '—'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
              <h2 className="font-display text-lg font-semibold text-white">Platform wallet (fee destination)</h2>
              <p className="mt-2 text-sm text-gray-400">
                Listing fees and withdrawal fees are sent to this wallet. To deposit or withdraw funds, use your wallet app or exchange linked to these addresses — the app does not hold private keys.
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">ETH</span>
                  <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.ETH}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">SOL</span>
                  <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.SOL}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">DOGE (xpub)</span>
                  <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.DOGE_XPUB}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">BTC (xpub)</span>
                  <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.BTC_XPUB}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-500">LTC (xpub)</span>
                  <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.LTC_XPUB}</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
              <h2 className="font-display text-lg font-semibold text-white">Admin controls</h2>
              <p className="mt-2 text-sm text-gray-400">
                User and network management, fee reports, and further controls can be added here. Admin access is granted via the <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">admin_users</code> table (add your user id after signup).
              </p>
              <Link
                href="/fees"
                className="mt-4 inline-block rounded-lg bg-accent-cyan/20 px-4 py-2 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
              >
                View fees & transparency →
              </Link>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
