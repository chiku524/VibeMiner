'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BrandMark } from '@/components/BrandMark';
import { NetworkMark } from '@/components/ui/NetworkMark';
import { Network, Layers, Globe, FilePlus, List, BarChart3, Users, Coins, Calendar } from 'lucide-react';

type ListingSummary = {
  id: string;
  name: string;
  symbol: string;
  environment: 'mainnet' | 'devnet';
  status: string;
  listedAt?: string;
  icon?: string;
  minerCount?: number;
  totalBalanceRaw?: string;
  currency?: string;
};

type MyNetworksResponse = { networks?: ListingSummary[]; error?: string };

export default function NetworkDashboardPage() {
  const isDesktop = useIsDesktop();
  const { user, profile, loading } = useAuth();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || profile?.account_type !== 'network') return;
    fetch('/api/networks/my', { credentials: 'include' })
      .then((res) => res.json() as Promise<MyNetworksResponse>)
      .then((data) => {
        if (data.error) {
          setFetchError(data.error);
          return;
        }
        setListings(Array.isArray(data.networks) ? data.networks : []);
      })
      .catch(() => setFetchError('Failed to load your networks'));
  }, [user, profile?.account_type]);

  if (!loading && !user) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${!isDesktop ? 'pt-14' : 'pt-6'}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <div className="text-center">
            <p className="text-gray-400">Sign in to access the network dashboard.</p>
            <Link href="/login" className="mt-4 inline-block text-accent-cyan hover:underline">Sign in</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!loading && user && profile?.account_type !== 'network') {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${!isDesktop ? 'pt-14' : 'pt-6'}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <div className="text-center">
            <p className="text-gray-400">This dashboard is for network accounts. You’re signed in as a miner.</p>
            <Link href="/dashboard" className="mt-4 inline-block text-accent-cyan hover:underline">Go to miner dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  const total = listings.length;
  const mainnet = listings.filter((n) => n.environment === 'mainnet');
  const devnet = listings.filter((n) => n.environment === 'devnet');
  const live = listings.filter((n) => n.status === 'live');
  const comingSoon = listings.filter((n) => n.status === 'coming-soon');

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      {!isDesktop && (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <BrandMark className="h-6 w-6 shrink-0" />
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
                VibeMiner
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/network/request" className="text-sm text-gray-400 transition hover:text-white">Request listing</Link>
              <Link href="/networks" className="text-sm text-gray-400 transition hover:text-white">Networks</Link>
              <Link href="/home" className="text-sm text-gray-400 transition hover:text-white">← Back home</Link>
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto w-full min-w-0 max-w-6xl px-4 sm:px-6 ${!isDesktop ? 'pt-14 pb-8' : 'pt-6 pb-8'}`}>
        <Breadcrumbs crumbs={[{ label: 'Home', href: '/home' }, { label: 'Network dashboard' }]} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 mt-4"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Network dashboard</h1>
          <p className="mt-1 text-gray-400">
            Statistics and metrics for your network presence. Request new listings or manage existing ones.
          </p>
          {profile?.network_name && (
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Globe className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="min-w-0 break-words text-gray-400">{profile.network_name}</span>
              {profile.network_website && (
                <a
                  href={profile.network_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 max-w-full truncate text-accent-cyan hover:underline sm:max-w-md"
                  title={profile.network_website}
                >
                  {profile.network_website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}
        </motion.div>

        {fetchError && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            {fetchError}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex min-w-0 items-center gap-4 rounded-xl border border-white/10 bg-surface-900/50 p-5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-cyan/20 text-accent-cyan">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Total listings</p>
              <p className="font-mono text-2xl font-semibold text-white">{total}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex min-w-0 items-center gap-4 rounded-xl border border-white/10 bg-surface-900/50 p-5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Network className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Mainnet</p>
              <p className="font-mono text-2xl font-semibold text-white">{mainnet.length}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex min-w-0 items-center gap-4 rounded-xl border border-white/10 bg-surface-900/50 p-5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
              <Layers className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Devnet</p>
              <p className="font-mono text-2xl font-semibold text-white">{devnet.length}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex min-w-0 items-center gap-4 rounded-xl border border-white/10 bg-surface-900/50 p-5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500">Live</p>
              <p className="font-mono text-2xl font-semibold text-white">{live.length}</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 rounded-2xl border border-white/5 bg-surface-900/30 p-6"
        >
          <h2 className="font-display text-lg font-semibold text-white">Actions</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/dashboard/network/request"
              className="flex items-center gap-2 rounded-xl border border-accent-cyan/30 bg-accent-cyan/10 px-5 py-3 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/20"
            >
              <FilePlus className="h-4 w-4" />
              Request a network listing
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-850 px-5 py-3 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
            >
              <List className="h-4 w-4" />
              Your listed networks
            </Link>
            <Link
              href="/networks"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-850 px-5 py-3 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
            >
              <Globe className="h-4 w-4" />
              Browse all networks
            </Link>
          </div>
        </motion.div>

        {total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h2 className="font-display text-lg font-semibold text-white">Metrics by network</h2>
            <p className="mt-1 text-sm text-gray-400">Personalized statistics for each of your listed networks.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((n, idx) => {
                const balance = n.totalBalanceRaw != null ? parseFloat(n.totalBalanceRaw) : 0;
                const balanceStr = Number.isFinite(balance) ? balance.toFixed(6) : '0';
                const curr = n.currency ?? n.symbol ?? '—';
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="rounded-2xl border border-white/5 bg-surface-900/30 p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <NetworkMark
                          icon={n.icon ?? '⛓'}
                          label={n.name}
                          className="h-10 w-10 rounded-lg bg-white/10 text-lg"
                        />
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-white truncate">{n.name}</h3>
                          <p className="text-xs text-gray-500">{n.symbol} · {n.environment}</p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                          n.status === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {n.status === 'live' ? 'Live' : 'Coming soon'}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-surface-850/80 px-3 py-2">
                        <Users className="h-4 w-4 text-accent-cyan/80" />
                        <div>
                          <p className="text-xs text-gray-500">Miners</p>
                          <p className="font-mono text-sm font-semibold text-white">{n.minerCount ?? 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-surface-850/80 px-3 py-2">
                        <Coins className="h-4 w-4 text-amber-400/80" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Total balance</p>
                          <p className="font-mono text-sm font-semibold text-white truncate" title={`${balanceStr} ${curr}`}>
                            {balanceStr} {curr}
                          </p>
                        </div>
                      </div>
                    </div>
                    {n.listedAt && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        Listed {new Date(n.listedAt).toLocaleDateString()}
                      </p>
                    )}
                    <Link
                      href={`/dashboard/network/edit?id=${encodeURIComponent(n.id)}`}
                      className="mt-3 inline-block text-sm text-accent-cyan hover:underline"
                    >
                      Edit listing →
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            {listings.length > 10 && (
              <p className="mt-4 text-sm text-gray-500">
                <Link href="/dashboard/settings" className="text-accent-cyan hover:underline">
                  View all {listings.length} in Settings →
                </Link>
              </p>
            )}
          </motion.div>
        )}

        {comingSoon.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-6 text-sm text-gray-500"
          >
            {comingSoon.length} listing{comingSoon.length !== 1 ? 's' : ''} marked as coming soon.
          </motion.p>
        )}
      </div>
    </main>
  );
}
