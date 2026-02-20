'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  getNetworkById,
  getMainnetNetworksListed,
  getDevnetNetworks,
  type BlockchainNetwork,
  type NetworkEnvironment,
} from '@vibeminer/shared';
import { MiningPanel } from '@/components/dashboard/MiningPanel';
import { useMiningSession } from '@/hooks/useMiningSession';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { NetworkModal } from '@/components/ui/NetworkModal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NetworkListSkeleton, DashboardSkeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopNav } from '@/components/DesktopNav';

/** Network from API may include listedAt for discovery (newest first). */
type NetworkWithMeta = BlockchainNetwork & { listedAt?: string };

const ENV_OPTIONS: { value: NetworkEnvironment; label: string }[] = [
  { value: 'mainnet', label: 'Mainnet' },
  { value: 'devnet', label: 'Devnet' },
];

const SORT_OPTIONS: { value: 'newest' | 'name-asc' | 'name-desc'; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
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
      n.algorithm.toLowerCase().includes(q) ||
      (n.description && n.description.toLowerCase().includes(q))
  );
}

function sortNetworks(
  networks: NetworkWithMeta[],
  sort: 'newest' | 'name-asc' | 'name-desc'
): NetworkWithMeta[] {
  const arr = [...networks];
  if (sort === 'newest') {
    arr.sort((a, b) => {
      const aAt = a.listedAt ? new Date(a.listedAt).getTime() : 0;
      const bAt = b.listedAt ? new Date(b.listedAt).getTime() : 0;
      if (bAt !== aAt) return bAt - aAt;
      return (a.name || '').localeCompare(b.name || '');
    });
  } else if (sort === 'name-asc') {
    arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    arr.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  }
  return arr;
}

function findInLists(
  mainnet: NetworkWithMeta[],
  devnet: NetworkWithMeta[],
  id: string,
  environment?: NetworkEnvironment
): NetworkWithMeta | undefined {
  if (environment === 'mainnet') return mainnet.find((n) => n.id === id);
  if (environment === 'devnet') return devnet.find((n) => n.id === id);
  return mainnet.find((n) => n.id === id) ?? devnet.find((n) => n.id === id);
}

export function DashboardContent() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
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
  const debouncedSearch = useDebouncedValue(searchQuery, 200);
  const [sortBy, setSortBy] = useState<'newest' | 'name-asc' | 'name-desc'>('newest');
  const [fetchedMainnet, setFetchedMainnet] = useState<NetworkWithMeta[] | null>(null);
  const [fetchedDevnet, setFetchedDevnet] = useState<NetworkWithMeta[] | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [modalNetwork, setModalNetwork] = useState<BlockchainNetwork | null>(null);
  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const preselectedId = searchParams.get('network');

  useEffect(() => {
    if (!authLoading && accountType === 'network') {
      router.replace('/dashboard/network');
    }
  }, [authLoading, accountType, router]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/networks')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch'))))
      .then((data: unknown) => {
        if (cancelled) return;
        const parsed = data as { mainnet?: NetworkWithMeta[]; devnet?: NetworkWithMeta[] };
        setFetchedMainnet(Array.isArray(parsed.mainnet) ? parsed.mainnet : null);
        setFetchedDevnet(Array.isArray(parsed.devnet) ? parsed.devnet : null);
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedMainnet(null);
          setFetchedDevnet(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const networksForEnv = useMemo((): NetworkWithMeta[] => {
    const staticMain = getMainnetNetworksListed() as NetworkWithMeta[];
    const staticDev = getDevnetNetworks() as NetworkWithMeta[];
    const main = fetchedMainnet ?? staticMain;
    const dev = fetchedDevnet ?? staticDev;
    return selectedEnv === 'devnet' ? dev : main;
  }, [selectedEnv, fetchedMainnet, fetchedDevnet]);

  const sortedNetworks = useMemo(
    () => sortNetworks(networksForEnv, sortBy),
    [networksForEnv, sortBy]
  );

  const filteredNetworks = useMemo(
    () => filterNetworks(sortedNetworks, debouncedSearch),
    [sortedNetworks, debouncedSearch]
  );

  const preselected = useMemo(() => {
    if (!preselectedId) return null;
    const fromApi = findInLists(
      fetchedMainnet ?? getMainnetNetworksListed() as NetworkWithMeta[],
      fetchedDevnet ?? getDevnetNetworks() as NetworkWithMeta[],
      preselectedId
    );
    if (fromApi) return fromApi;
    const byMain = getNetworkById(preselectedId, 'mainnet');
    const byDev = getNetworkById(preselectedId, 'devnet');
    if (byMain) return byMain;
    if (byDev) return byDev;
    return getNetworkById(preselectedId);
  }, [preselectedId, fetchedMainnet, fetchedDevnet]);

  const { session, startMining, stopMining } = useMiningSession();

  const handleStart = useCallback(
    (network: BlockchainNetwork) => {
      if (network.status === 'live') {
        setStartingId(network.id);
        startMining(network.id, network.environment);
        addToast(`Mining ${network.name} started`);
      }
    },
    [startMining, addToast]
  );

  useEffect(() => {
    if (session) setStartingId(null);
  }, [session]);

  const handleStop = useCallback(() => {
    addToast('Mining stopped');
    stopMining();
  }, [stopMining, addToast]);

  const currentNetwork = useMemo(() => {
    if (!session) return null;
    const main = fetchedMainnet ?? getMainnetNetworksListed() as NetworkWithMeta[];
    const dev = fetchedDevnet ?? getDevnetNetworks() as NetworkWithMeta[];
    const found = findInLists(main, dev, session.networkId, session.environment);
    if (found) return found;
    return getNetworkById(session.networkId, session.environment);
  }, [session, fetchedMainnet, fetchedDevnet]);

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      </main>
    );
  }

  if (authLoading) {
    return (
      <>
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href={isDesktop ? '/app' : '/'} className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="text-xl" aria-hidden="true">◇</span>
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">VibeMiner</span>
            </Link>
            <Link href={isDesktop ? '/app' : '/'} className="text-sm text-gray-400 transition hover:text-white">← App home</Link>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Breadcrumbs crumbs={[{ label: 'Home', href: isDesktop ? '/app' : '/' }, { label: 'Miner dashboard' }]} />
          <div className="mb-8 mt-4 h-16 w-64 rounded-lg bg-white/5 animate-pulse" aria-hidden />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
              <NetworkListSkeleton />
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/5 bg-surface-900/30 p-8">
                <DashboardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isDesktop ? (
        <DesktopNav />
      ) : (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="text-xl" aria-hidden="true">◇</span>
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
                VibeMiner
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/networks" className="text-sm text-gray-400 transition hover:text-white">
                Networks
              </Link>
              <Link href="/dashboard/settings" className="text-sm text-gray-400 transition hover:text-white">
                Settings
              </Link>
              <Link href="/" className="text-sm text-gray-400 transition hover:text-white">
                ← Back home
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${isDesktop ? 'pt-14 pb-8' : 'py-8'}`}>
        <Breadcrumbs crumbs={[{ label: 'Home', href: isDesktop ? '/app' : '/' }, { label: 'Miner dashboard' }]} />
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

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="relative mb-4 flex rounded-xl bg-surface-900/50 p-1">
              {ENV_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedEnvWithUrl(opt.value)}
                  className="relative z-10 flex flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:ring-offset-2 focus:ring-offset-surface-950"
                  style={{ color: selectedEnv === opt.value ? undefined : 'rgb(156 163 175)' }}
                >
                  <span className={selectedEnv === opt.value ? 'text-white' : 'text-gray-400 hover:text-white'}>
                    {opt.label}
                  </span>
                </button>
              ))}
              <motion.div
                layoutId="env-pill"
                className="absolute top-1 bottom-1 rounded-lg bg-white/10"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  left: selectedEnv === 'mainnet' ? 4 : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)',
                }}
              />
            </div>
            <input
              type="search"
              placeholder="Search by name, symbol, algorithm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3 w-full rounded-xl border border-white/10 bg-surface-850 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
              aria-label="Search networks"
            />
            <div className="mb-4 flex items-center justify-between gap-2">
              <label htmlFor="sort-networks" className="text-xs text-gray-500">Sort</label>
              <select
                id="sort-networks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'name-asc' | 'name-desc')}
                className="rounded-lg border border-white/10 bg-surface-850 px-3 py-1.5 text-sm text-white focus:border-accent-cyan/50 focus:outline-none"
                aria-label="Sort networks"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-500">
              {selectedEnv === 'mainnet' ? 'Mainnet' : 'Devnet'} networks
              <span className="ml-1.5 font-normal normal-case text-gray-600">
                ({filteredNetworks.length})
              </span>
            </h2>
            <motion.ul
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
                hidden: {},
              }}
            >
              {filteredNetworks.map((network) => {
                const isLive = network.status === 'live';
                const isActive =
                  session?.networkId === network.id && session?.environment === network.environment;
                const isStarting = startingId === network.id;
                const nWithMeta = network as NetworkWithMeta;
                const isNewlyListed =
                  nWithMeta.listedAt &&
                  (Date.now() - new Date(nWithMeta.listedAt).getTime()) < 30 * 24 * 60 * 60 * 1000;
                return (
                  <motion.li
                    key={`${network.environment}-${network.id}`}
                    variants={{
                      visible: { opacity: 1, x: 0 },
                      hidden: { opacity: 0, x: -12 },
                    }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="list-none"
                  >
                    <div className="flex items-stretch gap-1 rounded-xl border border-transparent">
                      <motion.button
                        onClick={() => handleStart(network)}
                        disabled={!isLive || !!isActive || !!isStarting}
                        whileHover={isLive && !isActive && !isStarting ? { scale: 1.01 } : undefined}
                        whileTap={isLive && !isActive && !isStarting ? { scale: 0.99 } : undefined}
                        transition={{ duration: 0.15 }}
                        className={`flex flex-1 items-center gap-3 rounded-l-xl border px-4 py-3 text-left transition-colors ${
                          isActive
                            ? 'border-accent-cyan/50 bg-accent-cyan/10'
                            : isStarting
                              ? 'border-accent-cyan/30 bg-accent-cyan/5'
                              : isLive
                                ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                : 'cursor-not-allowed border-white/5 bg-white/5 opacity-60'
                        }`}
                      >
                        <span className="text-xl" aria-hidden="true">{network.icon}</span>
                        <div className="min-w-0 flex-1">
                          {isStarting ? (
                            <p className="font-medium text-accent-cyan flex items-center gap-2">
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
                              Starting…
                            </p>
                          ) : (
                            <>
                              <p className="font-medium text-white flex items-center gap-2">
                                {network.name}
                                {isNewlyListed && (
                                  <span className="rounded bg-accent-cyan/20 px-1.5 py-0.5 text-xs font-medium text-accent-cyan">
                                    New
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {network.symbol} · {network.algorithm}
                              </p>
                            </>
                          )}
                        </div>
                        {!isStarting && network.environment === 'devnet' && (
                          <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-300">
                            Test
                          </span>
                        )}
                        {!isStarting && network.status === 'coming-soon' && (
                          <span className="text-xs text-gray-500">Soon</span>
                        )}
                        {isActive && (
                          <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" aria-hidden />
                        )}
                      </motion.button>
                      <button
                        onClick={(e) => {
                          modalTriggerRef.current = e.currentTarget as HTMLButtonElement;
                          setModalNetwork(network);
                        }}
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
            </motion.ul>
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
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-surface-900/30 py-20 text-center"
                >
                  <span className="text-5xl opacity-50" aria-hidden="true">◇</span>
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

      <NetworkModal
        network={modalNetwork}
        onClose={() => {
          setModalNetwork(null);
          requestAnimationFrame(() => {
            modalTriggerRef.current?.focus();
          });
        }}
      />
    </>
  );
}
