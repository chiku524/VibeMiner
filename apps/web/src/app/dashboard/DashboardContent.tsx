'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
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

export function DashboardContent() {
  const searchParams = useSearchParams();
  const envFromUrl = useStableEnv(searchParams);
  const [selectedEnv, setSelectedEnv] = useState<NetworkEnvironment>(envFromUrl);
  const preselectedId = searchParams.get('network');

  const networksForEnv = useMemo(() => {
    return selectedEnv === 'devnet' ? getDevnetNetworks() : getMainnetNetworks();
  }, [selectedEnv]);

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
      if (network.status === 'live') startMining(network.id, network.environment);
    },
    [startMining]
  );

  const currentNetwork = useMemo(() => {
    if (!session) return null;
    return getNetworkById(session.networkId, session.environment);
  }, [session]);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="text-xl">◇</span>
            <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
              Vibe Mine
            </span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 transition hover:text-white">
            ← Back home
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Mining dashboard</h1>
          <p className="mt-1 text-gray-400">
            Choose Mainnet or Devnet, then select a network. No terminal required.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="mb-4 flex gap-2 rounded-xl bg-surface-900/50 p-1">
              {ENV_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedEnv(opt.value)}
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
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-500">
              {selectedEnv === 'mainnet' ? 'Mainnet' : 'Devnet'} networks
            </h2>
            <ul className="space-y-2">
              {networksForEnv.map((network) => {
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
                    <button
                      onClick={() => handleStart(network)}
                      disabled={!isLive || !!isActive}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
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
                  </motion.li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {session && currentNetwork ? (
                <MiningPanel
                  key={`${session.environment}-${session.networkId}`}
                  session={session}
                  network={currentNetwork}
                  onStop={stopMining}
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
                  <p className="mt-1 text-sm text-gray-500">
                    Select Mainnet or Devnet, then choose a network to start.
                  </p>
                  {preselected && preselected.status === 'live' && (
                    <button
                      onClick={() => handleStart(preselected)}
                      className="mt-6 rounded-xl bg-accent-cyan/20 px-6 py-2 text-sm font-medium text-accent-cyan hover:bg-accent-cyan/30"
                    >
                      Mine {preselected.name}
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
