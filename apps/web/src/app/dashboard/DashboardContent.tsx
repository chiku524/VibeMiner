'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  getNetworkById,
  getMainnetNetworks,
  getDevnetNetworks,
  type BlockchainNetwork,
  type NetworkEnvironment,
} from '@crypto-miner/shared';
import { MiningPanel } from '@/components/dashboard/MiningPanel';
import { useMiningSession } from '@/hooks/useMiningSession';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { NetworkModal } from '@/components/ui/NetworkModal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DesktopAppSettings } from '@/components/DesktopAppSettings';

const ENV_OPTIONS: { value: NetworkEnvironment; label: string }[] = [
  { value: 'mainnet', label: 'Mainnet' },
  { value: 'devnet', label: 'Devnet' },
];

function useStableEnv(searchParams: ReturnType<typeof useSearchParams>): NetworkEnvironment {
  return useMemo(() => {
    const env = searchParams.get('env');
    if (env === 'mainnet' || env === 'devnet') return env;
    return 'mainnet';
  }, [searchParams]);
}

function filterNetworks(networks: BlockchainNetwork[], query: string): BlockchainNetwork[] {
  if (!query.trim()) return networks;
  const q = query.toLowerCase();
  return networks.filter(
    (n) =>
      n.name.toLowerCase().includes(q) ||
      n.symbol.toLowerCase().includes(q) ||
      n.algorithm.toLowerCase().includes(q)
  );
}

export function DashboardContent() {
  const router = useRouter();
  const { accountType, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const envFromUrl = useStableEnv(searchParams);
  const [selectedEnv, setSelectedEnv] = useState<NetworkEnvironment>(envFromUrl);

  useEffect(() => {
    setSelectedEnv(envFromUrl);
  }, [envFromUrl]);

  const setSelectedEnvWithUrl = useCallback(
    (env: NetworkEnvironment) => {
      setSelectedEnv(env);
      const params = new URLSearchParams(searchParams.toString());
      params.set('env', env);
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [modalNetwork, setModalNetwork] = useState<BlockchainNetwork | null>(null);
  const preselectedId = searchParams.get('network');

  useEffect(() => {
    if (!authLoading && accountType === 'network') {
      router.replace('/dashboard/network');
    }
  }, [authLoading, accountType, router]);

  const networksForEnv = useMemo(() => {
    return selectedEnv === 'devnet' ? getDevnetNetworks() : getMainnetNetworks();
  }, [selectedEnv]);

  const filteredNetworks = useMemo(
    () => filterNetworks(networksForEnv, searchQuery),
    [networksForEnv, searchQuery]
  );

  const preselected = useMemo(() => {
    if (!preselectedId) return null;
    const byMain = getNetworkById(preselectedId, 'mainnet');
    const byDev = getNetworkById(preselectedId, 'devnet');
    if (byMain) return byMain;
    if (byDev) return byDev;
    return getNetworkById(preselectedId);
  }, [preselectedId]);

  const { session, startMining, stopMining } = useMiningSession();

  const handleStart = useCallback(
    (network: BlockchainNetwork) => {
      if (network.status === 'live') {
        startMining(network.id, network.environment);
        addToast(`Mining ${network.name} started`);
      }
    },
    [startMining, addToast]
  );

  const handleStop = useCallback(() => {
    addToast('Mining stopped');
    stopMining();
  }, [stopMining, addToast]);

  const currentNetwork = useMemo(() => {
    if (!session) return null;
    return getNetworkById(session.networkId, session.environment);
  }, [session]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (modalNetwork) setModalNetwork(null);
        else if (session) handleStop();
      }
      if (e.key === 's' && !e.ctrlKey && !e.metaKey && !session && !modalNetwork) {
        const first = filteredNetworks.find((n) => n.status === 'live');
        if (first) handleStart(first);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [session, modalNetwork, filteredNetworks, handleStart, handleStop]);

  if (!authLoading && accountType === 'network') {
    return (
      <main className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </main>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="text-xl">◇</span>
            <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
              VibeMiner
            </span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 transition hover:text-white">
            ← Back home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Miner dashboard' }]} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 mt-4"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Mining dashboard</h1>
          <p className="mt-1 text-gray-400">
            Choose Mainnet or Devnet, then select a network. Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">S</kbd> to quick-start first network, <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">Esc</kbd> to stop.
          </p>
        </motion.div>

        <DesktopAppSettings />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="mb-4 flex gap-2 rounded-xl bg-surface-900/50 p-1">
              {ENV_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedEnvWithUrl(opt.value)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    selectedEnv === opt.value
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Search networks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/10 bg-surface-850 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
              aria-label="Search networks"
            />
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-500">
              {selectedEnv === 'mainnet' ? 'Mainnet' : 'Devnet'} networks
            </h2>
            <ul className="space-y-2">
              {filteredNetworks.map((network) => {
                const isLive = network.status === 'live';
                const isActive =
                  session?.networkId === network.id && session?.environment === network.environment;
                return (
                  <motion.li
                    key={`${network.environment}-${network.id}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="list-none"
                  >
                    <div className="flex items-stretch gap-1 rounded-xl border border-transparent">
                      <button
                        onClick={() => handleStart(network)}
                        disabled={!isLive || !!isActive}
                        className={`flex flex-1 items-center gap-3 rounded-l-xl border px-4 py-3 text-left transition ${
                          isActive
                            ? 'border-accent-cyan/50 bg-accent-cyan/10'
                            : isLive
                              ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                              : 'cursor-not-allowed border-white/5 bg-white/5 opacity-60'
                        }`}
                      >
                        <span className="text-xl">{network.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">{network.name}</p>
                          <p className="text-xs text-gray-500">
                            {network.symbol} · {network.algorithm}
                          </p>
                        </div>
                        {network.environment === 'devnet' && (
                          <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-300">
                            Test
                          </span>
                        )}
                        {network.status === 'coming-soon' && (
                          <span className="text-xs text-gray-500">Soon</span>
                        )}
                        {isActive && (
                          <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
                        )}
                      </button>
                      <button
                        onClick={() => setModalNetwork(network)}
                        className="rounded-r-xl border border-white/10 bg-surface-850/80 px-3 py-2 text-xs text-gray-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                        title="Learn more"
                      >
                        ℹ
                      </button>
                    </div>
                  </motion.li>
                );
              })}
              {filteredNetworks.length === 0 && (
                <div className="rounded-xl border border-white/5 bg-surface-900/30 py-12 text-center">
                  <p className="text-sm font-medium text-gray-400">No networks match your search</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Try a different term, or clear the search to see all {selectedEnv} networks.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-white/20 hover:text-white"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {session && currentNetwork ? (
                <MiningPanel
                  key={`${session.environment}-${session.networkId}`}
                  session={session}
                  network={currentNetwork}
                  onStop={handleStop}
                />
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-surface-900/30 py-20 text-center"
                >
                  <span className="text-5xl opacity-50">◇</span>
                  <p className="mt-4 font-medium text-gray-400">No active mining session</p>
                  <p className="mt-2 max-w-sm text-sm text-gray-500">
                    Select Mainnet or Devnet above, then pick a network to start mining. Or press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">S</kbd> to quick-start the first available network.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {preselected && preselected.status === 'live' && (
                      <button
                        onClick={() => handleStart(preselected)}
                        className="rounded-xl bg-accent-cyan/20 px-6 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
                      >
                        Mine {preselected.name}
                      </button>
                    )}
                    {filteredNetworks
                      .filter((n) => n.status === 'live' && n.id !== preselected?.id)
                      .slice(0, 2)
                      .map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleStart(n)}
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                        >
                          {n.name}
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <NetworkModal network={modalNetwork} onClose={() => setModalNetwork(null)} />
    </>
  );
}
