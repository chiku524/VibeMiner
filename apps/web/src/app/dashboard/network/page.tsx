'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RequestListingForm } from '@/components/RequestListingForm';

export default function NetworkDashboardPage() {
  const isDesktop = useIsDesktop();
  const { user, profile, loading } = useAuth();

  if (!loading && !user) {
    return (
      <main className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Sign in to access the network dashboard.</p>
          <Link href="/login" className="mt-4 inline-block text-accent-cyan hover:underline">Sign in</Link>
        </div>
      </main>
    );
  }

  if (!loading && user && profile?.account_type !== 'network') {
    return (
      <main className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">This dashboard is for network accounts. You’re signed in as a miner.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-accent-cyan hover:underline">Go to miner dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={isDesktop ? '/dashboard' : '/'} className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="text-xl" aria-hidden="true">◇</span>
            <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
              VibeMiner
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/networks" className="text-sm text-gray-400 transition hover:text-white">Networks</Link>
            <Link href={isDesktop ? '/dashboard' : '/'} className="text-sm text-gray-400 transition hover:text-white">
              {isDesktop ? '← Home' : '← Back home'}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Network dashboard' }]} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 mt-4"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Network dashboard</h1>
          <p className="mt-1 text-gray-400">
            Manage your blockchain’s presence and request mining service.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/5 bg-surface-900/50 p-8"
        >
          <h2 className="font-display text-lg font-semibold text-white">
            {profile?.network_name || 'Your network'}
          </h2>
          {profile?.network_website && (
            <a
              href={profile.network_website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-accent-cyan hover:underline"
            >
              {profile.network_website}
            </a>
          )}
          <p className="mt-4 text-sm text-gray-400">
            As a registered network, you can request to be listed in our mainnet or devnet showcase.
            We’ll review your chain and add it to the integration so miners can contribute hashrate.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/#networks"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              View all networks
            </Link>
          </div>
        </motion.div>

        <div className="mt-8">
          <RequestListingForm />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 rounded-2xl border border-white/5 bg-surface-900/30 p-8"
        >
          <h3 className="font-display font-semibold text-white">Integration checklist</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-400">
            <li>✓ Account registered as network</li>
            <li>→ Submit your chain details (name, algorithm, pool, etc.) via the request flow</li>
            <li>→ We validate and add your network to the registry (mainnet or devnet)</li>
            <li>→ Miners can then select your network and start contributing</li>
          </ul>
        </motion.div>
      </div>
    </main>
  );
}
