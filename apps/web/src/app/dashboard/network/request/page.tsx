'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BrandMark } from '@/components/BrandMark';
import { RequestListingForm } from '@/components/RequestListingForm';

export default function RequestNetworkListingPage() {
  const isDesktop = useIsDesktop();
  const { user, profile, loading } = useAuth();

  if (!loading && !user) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${!isDesktop ? 'pt-14' : 'pt-6'}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <p className="text-gray-400">Sign in to request a network listing.</p>
          <Link href="/login" className="mt-4 text-accent-cyan hover:underline">Sign in</Link>
        </div>
      </main>
    );
  }

  if (!loading && user && profile?.account_type !== 'network') {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${!isDesktop ? 'pt-14' : 'pt-6'}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <p className="text-gray-400">Only network accounts can request a listing. Register as a network to continue.</p>
          <Link href="/dashboard" className="mt-4 text-accent-cyan hover:underline">Go to dashboard</Link>
        </div>
      </main>
    );
  }

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
              <Link href="/dashboard/network" className="text-sm text-gray-400 transition hover:text-white">Network dashboard</Link>
              <Link href="/networks" className="text-sm text-gray-400 transition hover:text-white">Networks</Link>
              <Link href="/home" className="text-sm text-gray-400 transition hover:text-white">← Back home</Link>
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto max-w-3xl px-4 sm:px-6 ${!isDesktop ? 'pt-14 pb-8' : 'pt-6 pb-8'}`}>
        <Breadcrumbs
          crumbs={[
            { label: 'Home', href: '/home' },
            { label: 'Network dashboard', href: '/dashboard/network' },
            { label: 'Request listing' },
          ]}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Request a network listing</h1>
          <p className="mt-1 text-gray-400">
            Submit your chain details to be listed on mainnet or devnet. After validation, miners can contribute hashrate.
          </p>
          <Link href="/dashboard/network" className="mt-3 inline-block text-sm text-accent-cyan hover:underline">
            ← Back to network dashboard
          </Link>
        </motion.div>

        <div className="mt-8">
          <RequestListingForm />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 rounded-2xl border border-white/5 bg-surface-900/30 p-6"
        >
          <h2 className="font-display font-semibold text-white">Integration checklist</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-400">
            <li>✓ Account registered as network</li>
            <li>→ Submit your chain details (name, algorithm, pool, etc.) in the form above</li>
            <li>→ We validate and add your network to the registry (mainnet or devnet)</li>
            <li>→ Miners can then select your network and start contributing</li>
          </ul>
        </motion.div>
      </div>
    </main>
  );
}
