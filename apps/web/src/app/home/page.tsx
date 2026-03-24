'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Pickaxe,
  Server,
  Radio,
  Network,
  BookOpen,
  Settings,
  LayoutDashboard,
  List,
  Shield,
  FilePlus,
} from 'lucide-react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BrandMark } from '@/components/BrandMark';
import { MiningLoader } from '@/components/ui/MiningLoader';

const MINER_NAV_ITEMS = [
  { href: '/dashboard/mining', label: 'Mining', description: 'Mine PoW networks—choose and start', Icon: Pickaxe },
  { href: '/dashboard/nodes', label: 'Run nodes', description: 'Run full blockchain nodes (PoS)', Icon: Server },
  { href: '/dashboard/sessions', label: 'Sessions', description: 'Active mining and node sessions', Icon: Radio },
  { href: '/networks', label: 'Networks', description: 'Browse mainnet and devnet networks', Icon: Network },
  { href: '/how-mining-works', label: 'How it works', description: 'Mining, nodes, and pools explained', Icon: BookOpen },
  { href: '/dashboard/settings', label: 'Settings', description: 'Desktop app and preferences', Icon: Settings },
];

const NETWORK_NAV_ITEMS = [
  { href: '/dashboard/network', label: 'Network dashboard', description: 'Statistics and metrics for your listings', Icon: LayoutDashboard },
  { href: '/dashboard/network/request', label: 'Request listing', description: 'Submit a new network for mainnet or devnet', Icon: FilePlus },
  { href: '/dashboard/settings', label: 'Your listed networks', description: 'View and edit your network listings', Icon: List },
];

export default function HomePage() {
  const isDesktop = useIsDesktop();
  const { user, accountType, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className={`flex min-h-[60vh] flex-col items-center justify-center ${!isDesktop ? 'pt-14' : ''}`}>
          <MiningLoader size="md" label="Loading…" />
        </div>
      </main>
    );
  }

  const isNetwork = accountType === 'network';
  const items = isNetwork ? NETWORK_NAV_ITEMS : MINER_NAV_ITEMS;

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      {!isDesktop && (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/home" className="flex items-center gap-2 font-display text-lg font-semibold">
              <BrandMark className="h-6 w-6 shrink-0" />
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
                VibeMiner
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/networks" className="text-sm text-gray-400 transition hover:text-white">Networks</Link>
              <Link href="/" className="text-sm text-gray-400 transition hover:text-white">← Landing</Link>
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto max-w-2xl px-4 py-8 sm:px-6 ${!isDesktop ? 'pt-14' : 'pt-6'}`}>
        <Breadcrumbs crumbs={[{ label: 'Home' }]} />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 text-center mb-10"
        >
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-cyan/20">
            <BrandMark className="h-10 w-10" />
          </div>
          <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
            Home
          </h1>
          <p className="mt-2 text-gray-400 text-sm">
            {isNetwork
              ? 'Manage your network and listings.'
              : 'Where would you like to go?'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="grid gap-3 w-full"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface-900/50 p-4 text-left transition hover:border-accent-cyan/30 hover:bg-surface-850"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-cyan/90">
                <item.Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-gray-500 truncate">{item.description}</p>
              </div>
              <span className="text-gray-500 shrink-0" aria-hidden>→</span>
            </Link>
          ))}
          {!isNetwork && isAdmin && (
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left transition hover:border-amber-500/40 hover:bg-amber-500/10"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Shield className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-amber-200">Admin</p>
                <p className="text-sm text-amber-200/70">Platform stats and wallet</p>
              </div>
              <span className="text-amber-500/70 shrink-0" aria-hidden>→</span>
            </Link>
          )}
        </motion.div>

        {!isDesktop && (
          <p className="mt-8 text-xs text-gray-600 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-400">Back to landing</Link>
          </p>
        )}
      </div>
    </main>
  );
}
