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
  INCENTIVIZED_TESTNET_IDS,
  getResourceTier,
  RESOURCE_TIER_LABELS,
  isNetworkMineable,
  hasNodeConfig,
  type ResourceTier,
} from '@vibeminer/shared';
import { MiningPanel } from '@/components/dashboard/MiningPanel';
import { useMining } from '@/contexts/MiningContext';
import { getMiningWallet } from '@/components/MiningWalletSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { NetworkModal } from '@/components/ui/NetworkModal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NetworkListSkeleton, DashboardSkeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { BrandMark } from '@/components/BrandMark';
import { MiningLoader } from '@/components/ui/MiningLoader';
import { Radio, Zap, Coins, BarChart3 } from 'lucide-react';

export type WorkspaceMode = 'mining' | 'nodes';

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

type NetworkWithMeta = BlockchainNetwork & { listedAt?: string };

const ENV_OPTIONS: { value: NetworkEnvironment; label: string }[] = [
  { value: 'mainnet', label: 'Mainnet' },
  { value: 'devnet', label: 'Devnet' },
];

const DASHBOARD_ENV_KEY = 'vibeminer-dashboard-env';

const SORT_OPTIONS: { value: 'newest' | 'name-asc' | 'name-desc'; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];

const RESOURCE_FILTER_OPTIONS: { value: '' | ResourceTier; label: string }[] = [
  { value: '', label: 'All resources' },
  { value: 'light', label: 'Light (<10 GB)' },
  { value: 'standard', label: 'Standard (10–100 GB)' },
  { value: 'heavy', label: 'Heavy (100+ GB)' },
];

function useStableEnv(searchParams: ReturnType<typeof useSearchParams>): NetworkEnvironment {
  return useMemo(() => {
    const env = searchParams.get('env');
    if (env === 'mainnet' || env === 'devnet') return env;
    return 'mainnet';
  }, [searchParams]);
}

function filterNetworks(
  networks: BlockchainNetwork[],
  query: string,
  resourceFilter?: '' | ResourceTier
): BlockchainNetwork[] {
  let result = networks;
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.symbol.toLowerCase().includes(q) ||
        n.algorithm.toLowerCase().includes(q) ||
        (n.description && n.description.toLowerCase().includes(q))
    );
  }
  if (resourceFilter) {
    result = result.filter((n) => {
      const tier = getResourceTier(n.nodeDiskGb, n.nodeRamMb);
      return tier === resourceFilter;
    });
  }
  return result;
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

interface WorkspaceContentProps {
  mode: WorkspaceMode;
}

export function WorkspaceContent({ mode }: WorkspaceContentProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { accountType, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const envFromUrl = useStableEnv(searchParams);
  const [selectedEnv, setSelectedEnv] = useState<NetworkEnvironment>(envFromUrl);

  useEffect(() => { setSelectedEnv(envFromUrl); }, [envFromUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(DASHBOARD_ENV_KEY, selectedEnv); } catch (_) {}
  }, [selectedEnv]);

  useEffect(() => {
    if (searchParams.get('env') != null) return;
    try {
      const saved = window.localStorage.getItem(DASHBOARD_ENV_KEY);
      if (saved === 'mainnet' || saved === 'devnet') {
        setSelectedEnv(saved);
        const base = mode === 'mining' ? '/dashboard/mining' : '/dashboard/nodes';
        router.replace(`${base}?env=${saved}${searchParams.get('network') ? `&network=${searchParams.get('network')}` : ''}`, { scroll: false });
      }
    } catch (_) {}
  }, [router, searchParams, mode]);

  const setSelectedEnvWithUrl = useCallback(
    (env: NetworkEnvironment) => {
      setSelectedEnv(env);
      const base = mode === 'mining' ? '/dashboard/mining' : '/dashboard/nodes';
      const params = new URLSearchParams(searchParams.toString());
      params.set('env', env);
      router.replace(`${base}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, mode]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 200);
  const [sortBy, setSortBy] = useState<'newest' | 'name-asc' | 'name-desc'>('newest');
  const [resourceFilter, setResourceFilter] = useState<'' | ResourceTier>('');
  const [fetchedMainnet, setFetchedMainnet] = useState<NetworkWithMeta[] | null>(null);
  const [fetchedDevnet, setFetchedDevnet] = useState<NetworkWithMeta[] | null>(null);
  const [networksFetchError, setNetworksFetchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [modalNetwork, setModalNetwork] = useState<BlockchainNetwork | null>(null);
  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const preselectedId = searchParams.get('network');

  useEffect(() => {
    if (!authLoading && accountType === 'network') router.replace('/dashboard/network');
  }, [authLoading, accountType, router]);

  useEffect(() => {
    let cancelled = false;
    setNetworksFetchError(false);
    fetch('/api/networks')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed'))))
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
          setNetworksFetchError(true);
          addToast('Using cached network list. Retry if you need the latest.', 'info');
        }
      });
    return () => { cancelled = true; };
  }, [addToast, retryCount]);

  const networksForEnv = useMemo((): NetworkWithMeta[] => {
    const staticMain = getMainnetNetworksListed() as NetworkWithMeta[];
    const staticDev = getDevnetNetworks() as NetworkWithMeta[];
    const main = fetchedMainnet ?? staticMain;
    const dev = fetchedDevnet ?? staticDev;
    return selectedEnv === 'devnet' ? dev : main;
  }, [selectedEnv, fetchedMainnet, fetchedDevnet]);

  const modeFiltered = useMemo(() => {
    if (mode === 'mining') return networksForEnv.filter(isNetworkMineable);
    return networksForEnv.filter(hasNodeConfig);
  }, [networksForEnv, mode]);

  const sortedNetworks = useMemo(() => sortNetworks(modeFiltered, sortBy), [modeFiltered, sortBy]);
  const filteredNetworks = useMemo(
    () => filterNetworks(sortedNetworks, debouncedSearch, resourceFilter),
    [sortedNetworks, debouncedSearch, resourceFilter]
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
    return byMain ?? byDev ?? getNetworkById(preselectedId);
  }, [preselectedId, fetchedMainnet, fetchedDevnet]);

  const { sessions, startMining, stopMining, isMining } = useMining();

  const handleStart = useCallback(
    async (network: BlockchainNetwork) => {
      if (network.status !== 'live' || isMining(network.id, network.environment)) return;
      setStartingId(network.id);
      const wallet = getMiningWallet();
      const result = await startMining(network, wallet);
      if (result.ok) addToast(`Mining ${network.name} started`);
      else { addToast(result.error ?? 'Failed to start mining', 'error'); setStartingId(null); }
    },
    [startMining, isMining, addToast]
  );

  useEffect(() => { if (sessions.length > 0) setStartingId(null); }, [sessions.length]);

  const handleStop = useCallback(
    (networkId: string, environment?: NetworkEnvironment) => {
      addToast('Mining stopped');
      stopMining(networkId, environment);
    },
    [stopMining, addToast]
  );

  const sessionsWithNetworks = useMemo(() => {
    const main = fetchedMainnet ?? (getMainnetNetworksListed() as NetworkWithMeta[]);
    const dev = fetchedDevnet ?? (getDevnetNetworks() as NetworkWithMeta[]);
    return sessions
      .map((session) => ({
        session,
        network: findInLists(main, dev, session.networkId, session.environment) ?? getNetworkById(session.networkId, session.environment),
      }))
      .filter((item): item is typeof item & { network: NonNullable<typeof item.network> } => item.network != null);
  }, [sessions, fetchedMainnet, fetchedDevnet]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (modalNetwork) setModalNetwork(null);
        else if (sessions.length > 0) handleStop(sessions[0].networkId, sessions[0].environment);
      }
      if (mode === 'mining' && e.key === 's' && !e.ctrlKey && !e.metaKey && sessions.length === 0 && !modalNetwork) {
        const first = filteredNetworks.find((n) => n.status === 'live');
        if (first) handleStart(first);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sessions, modalNetwork, filteredNetworks, handleStart, handleStop, mode]);

  const title = mode === 'mining' ? 'Mining' : 'Run nodes';
  const description = mode === 'mining'
    ? 'Mine PoW networks. Choose Mainnet or Devnet, then select a network. Press S to quick-start.'
    : 'Run full blockchain nodes (PoS). Choose Mainnet or Devnet, then select a network. Desktop app required.';
  const listLabel = mode === 'mining'
    ? `${selectedEnv === 'mainnet' ? 'Mainnet' : 'Devnet'} mineable networks`
    : `${selectedEnv === 'mainnet' ? 'Mainnet' : 'Devnet'} node networks`;

  if (!authLoading && accountType === 'network') {
    return (
      <>
        <main className={`min-h-screen bg-surface-950 bg-grid flex items-center justify-center ${!isDesktop ? 'pt-14' : ''}`}>
          <MiningLoader size="sm" />
        </main>
      </>
    );
  }

  if (authLoading) {
    return (
      <>
        {!isDesktop && (
          <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
              <Link href="/home" className="flex items-center gap-2 font-display text-lg font-semibold">
                <BrandMark className="h-6 w-6 shrink-0" />
                <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">VibeMiner</span>
              </Link>
              <Link href="/home" className="text-sm text-gray-400 transition hover:text-white">← Home</Link>
            </div>
          </header>
        )}
        <div className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 ${!isDesktop ? 'pt-14' : ''}`}>
          <Breadcrumbs crumbs={[{ label: 'Home', href: '/home' }, { label: title }]} />
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
      {!isDesktop && (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/home" className="flex items-center gap-2 font-display text-lg font-semibold">
              <BrandMark className="h-6 w-6 shrink-0" />
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">VibeMiner</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/mining" className="text-sm text-gray-400 transition hover:text-white">Mining</Link>
              <Link href="/dashboard/nodes" className="text-sm text-gray-400 transition hover:text-white">Run nodes</Link>
              <Link href="/dashboard/sessions" className="text-sm text-gray-400 transition hover:text-white">Sessions</Link>
              <Link href="/networks" className="text-sm text-gray-400 transition hover:text-white">Networks</Link>
              <Link href="/dashboard/settings" className="text-sm text-gray-400 transition hover:text-white">Settings</Link>
              <Link href="/home" className="text-sm text-gray-400 transition hover:text-white">← Home</Link>
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${!isDesktop ? 'pt-14 pb-8' : 'pb-8 pt-6'}`}>
        <Breadcrumbs crumbs={[{ label: 'Home', href: '/home' }, { label: title }]} />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 mt-4">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-gray-400">{description}</p>
          <p className="mt-2 text-sm text-gray-500">
            <Link href="/how-mining-works" className="text-accent-cyan hover:underline">How mining &amp; nodes work</Link> →
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
                  <span className={selectedEnv === opt.value ? 'text-white' : 'text-gray-400 hover:text-white'}>{opt.label}</span>
                </button>
              ))}
              <motion.div
                layoutId="env-pill"
                className="absolute top-1 bottom-1 rounded-lg bg-white/10"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ left: selectedEnv === 'mainnet' ? 4 : 'calc(50% + 2px)', width: 'calc(50% - 6px)' }}
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
            {networksFetchError && (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
                <span>Using cached list.</span>
                <button type="button" onClick={() => { setNetworksFetchError(false); setRetryCount((c) => c + 1); }} className="shrink-0 rounded-lg border border-amber-500/30 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/10">Retry</button>
              </div>
            )}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor="sort-networks" className="text-xs text-gray-500">Sort</label>
                <select id="sort-networks" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'name-asc' | 'name-desc')} className="rounded-lg border border-white/10 bg-surface-850 px-3 py-1.5 text-sm text-white focus:border-accent-cyan/50 focus:outline-none" aria-label="Sort networks">
                  {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              {mode === 'nodes' && (
                <div className="flex items-center gap-2">
                  <label htmlFor="resource-filter" className="text-xs text-gray-500">Resources</label>
                  <select id="resource-filter" value={resourceFilter} onChange={(e) => setResourceFilter((e.target.value || '') as '' | ResourceTier)} className="rounded-lg border border-white/10 bg-surface-850 px-3 py-1.5 text-sm text-white focus:border-accent-cyan/50 focus:outline-none" aria-label="Filter by resource tier">
                    {RESOURCE_FILTER_OPTIONS.map((opt) => <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              )}
            </div>
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-500">
              {listLabel}
              <span className="ml-1.5 font-normal normal-case text-gray-600">({filteredNetworks.length})</span>
            </h2>
            <motion.ul className="space-y-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } }, hidden: {} }}>
              {filteredNetworks.map((network) => {
                const isLive = network.status === 'live';
                const mineable = isNetworkMineable(network);
                const canRunNode = hasNodeConfig(network);
                const isActive = isMining(network.id, network.environment);
                const isStarting = startingId === network.id;
                const canStartMining = mode === 'mining' && isLive && mineable && !isActive && !isStarting;
                const canOpenNodeModal = mode === 'nodes' && isLive && canRunNode;
                const nWithMeta = network as NetworkWithMeta;
                const isNewlyListed = nWithMeta.listedAt && (Date.now() - new Date(nWithMeta.listedAt).getTime()) < 30 * 24 * 60 * 60 * 1000;
                return (
                  <motion.li key={`${network.environment}-${network.id}`} variants={{ visible: { opacity: 1, x: 0 }, hidden: { opacity: 0, x: -12 } }} transition={{ duration: 0.25, ease: 'easeOut' }} className="list-none">
                    <div className="flex items-stretch gap-1 rounded-xl border border-transparent">
                      <motion.button
                        onClick={() => {
                          if (canStartMining) handleStart(network);
                          else if (canOpenNodeModal) setModalNetwork(network);
                        }}
                        disabled={!isLive || (!canStartMining && !canOpenNodeModal)}
                        whileHover={(canStartMining || canOpenNodeModal) ? { scale: 1.01 } : undefined}
                        whileTap={(canStartMining || canOpenNodeModal) ? { scale: 0.99 } : undefined}
                        transition={{ duration: 0.15 }}
                        title={canOpenNodeModal ? 'Run node' : undefined}
                        className={`flex flex-1 items-center gap-3 rounded-l-xl border px-4 py-3 text-left transition-colors ${
                          isActive ? 'border-accent-cyan/50 bg-accent-cyan/10' :
                          isStarting ? 'border-accent-cyan/30 bg-accent-cyan/5' :
                          (canStartMining || canOpenNodeModal) ? 'border-white/10 hover:border-white/20 hover:bg-white/5' :
                          isLive ? 'border-white/10 hover:border-white/20 hover:bg-white/5' :
                          'cursor-not-allowed border-white/5 bg-white/5 opacity-60'
                        }`}
                      >
                        <span className="text-xl" aria-hidden="true">{network.icon}</span>
                        <div className="min-w-0 flex-1">
                          {isStarting ? (
                            <p className="font-medium text-accent-cyan flex items-center gap-2">
                              <MiningLoader size="xs" /> Starting…
                            </p>
                          ) : (
                            <>
                              <p className="font-medium text-white flex items-center gap-2">
                                {network.name}
                                {isNewlyListed && <span className="rounded bg-accent-cyan/20 px-1.5 py-0.5 text-xs font-medium text-accent-cyan">New</span>}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {network.symbol} · {network.algorithm}
                                {isNetworkMineable(network) && (
                                  <span className="ml-1.5 rounded bg-emerald-500/20 px-1 py-0.5 text-emerald-300">Mineable</span>
                                )}
                                {hasNodeConfig(network) && !isNetworkMineable(network) && (
                                  <span className="ml-1.5 rounded bg-sky-500/20 px-1 py-0.5 text-sky-300">Node only</span>
                                )}
                                {isNetworkMineable(network) && hasNodeConfig(network) && (
                                  <span className="ml-1.5 rounded bg-amber-500/20 px-1 py-0.5 text-amber-300">Node</span>
                                )}
                                {(network.nodeDiskGb || network.nodeRamMb) && (
                                  <span className="ml-1.5 rounded bg-sky-500/20 px-1 py-0.5 text-sky-300">
                                    {RESOURCE_TIER_LABELS[getResourceTier(network.nodeDiskGb, network.nodeRamMb)]}
                                  </span>
                                )}
                              </p>
                            </>
                          )}
                        </div>
                        {!isStarting && network.environment === 'devnet' && <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-300">Test</span>}
                        {INCENTIVIZED_TESTNET_IDS.includes(network.id) && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-300">Incentivized testnet</span>}
                        {!isStarting && network.status === 'coming-soon' && <span className="text-xs text-gray-500">Soon</span>}
                        {isActive && <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" aria-hidden />}
                      </motion.button>
                      <button onClick={(e) => { modalTriggerRef.current = e.currentTarget as HTMLButtonElement; setModalNetwork(network); }} className="rounded-r-xl border border-white/10 bg-surface-850/80 px-3 py-2 text-xs text-gray-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white" title="Learn more">ℹ</button>
                    </div>
                  </motion.li>
                );
              })}
              {filteredNetworks.length === 0 && (
                <div className="rounded-xl border border-white/5 bg-surface-900/30 py-12 text-center">
                  <p className="text-sm font-medium text-gray-400">No networks match your search</p>
                  <p className="mt-1 text-xs text-gray-500">Try a different term or clear the search.</p>
                  <button type="button" onClick={() => setSearchQuery('')} className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-white/20 hover:text-white">Clear search</button>
                </div>
              )}
            </motion.ul>
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {sessionsWithNetworks.length > 0 ? (
                <div className="space-y-4">
                  <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/5 bg-surface-900/30 p-5"
                  >
                    <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      {mode === 'mining' ? 'Current mining statistics' : 'Current node running'}
                    </h2>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-900/50 px-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-cyan/20 text-accent-cyan">
                          <Radio className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Active {mode === 'mining' ? 'sessions' : 'nodes'}</p>
                          <p className="font-mono text-lg font-semibold text-white">{sessionsWithNetworks.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-900/50 px-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Total hashrate</p>
                          <p className="font-mono text-lg font-semibold text-white">
                            {sessionsWithNetworks.reduce((sum, { session }) => sum + session.hashrate, 0)} H/s
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-900/50 px-4 py-3 sm:col-span-2 sm:col-span-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                          <Coins className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Est. earnings</p>
                          <p className="font-mono text-lg font-semibold text-white truncate">
                            {sessionsWithNetworks
                              .reduce((acc, { session, network }) => acc + parseFloat(session.estimatedEarnings || '0'), 0)
                              .toFixed(6)}{' '}
                            {sessionsWithNetworks.length === 1 ? sessionsWithNetworks[0].network.symbol : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-left text-xs text-gray-500">
                            <th className="pb-2 pr-3 font-medium">Network</th>
                            <th className="pb-2 pr-3 font-medium">Hashrate</th>
                            <th className="pb-2 pr-3 font-medium">Shares</th>
                            <th className="pb-2 pr-3 font-medium">Est. earnings</th>
                            <th className="pb-2 font-medium">Uptime</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionsWithNetworks.map(({ session, network }) => {
                            const elapsed = session.startedAt ? Date.now() - session.startedAt : 0;
                            return (
                              <tr key={`${session.environment}-${session.networkId}`} className="border-b border-white/5">
                                <td className="py-2.5 pr-3 font-medium text-white">{network.name}</td>
                                <td className="py-2.5 pr-3 font-mono text-accent-cyan">{session.hashrate} H/s</td>
                                <td className="py-2.5 pr-3 font-mono text-gray-300">{session.shares}</td>
                                <td className="py-2.5 pr-3 font-mono text-accent-emerald">{session.estimatedEarnings} {network.symbol}</td>
                                <td className="py-2.5 font-mono text-gray-400">{formatDuration(elapsed)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.section>
                  <div className="space-y-3">
                    {sessionsWithNetworks.map(({ session, network }) => (
                      <MiningPanel key={`${session.environment}-${session.networkId}`} session={session} network={network} onStop={() => handleStop(session.networkId, session.environment)} compact={sessionsWithNetworks.length > 1} />
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-surface-900/30 py-20 text-center">
                  <BrandMark className="h-14 w-14 shrink-0 opacity-50" />
                  {mode === 'mining' ? (
                    <>
                      <p className="mt-4 font-medium text-gray-400">No active mining session</p>
                      <p className="mt-2 max-w-sm text-sm text-gray-500">Select a network from the list to start mining. Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">S</kbd> to quick-start.</p>
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {preselected && preselected.status === 'live' && isNetworkMineable(preselected) && (
                          <button onClick={() => handleStart(preselected)} className="rounded-xl bg-accent-cyan/20 px-6 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30">Mine {preselected.name}</button>
                        )}
                        {filteredNetworks.filter((n) => n.status === 'live' && isNetworkMineable(n)).slice(0, 2).map((n) => (
                          <button key={n.id} onClick={() => handleStart(n)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white">{n.name}</button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 font-medium text-gray-400">No node running</p>
                      <p className="mt-2 max-w-sm text-sm text-gray-500">Select a network from the list and click to run a full node. Desktop app required.</p>
                      {preselected && preselected.status === 'live' && hasNodeConfig(preselected) && (
                        <button onClick={() => setModalNetwork(preselected)} className="mt-6 rounded-xl bg-accent-cyan/20 px-6 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30">Run {preselected.name} node</button>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <NetworkModal network={modalNetwork} onClose={() => { setModalNetwork(null); requestAnimationFrame(() => modalTriggerRef.current?.focus()); }} />
    </>
  );
}
