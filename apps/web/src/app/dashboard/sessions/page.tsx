'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Zap, Coins } from 'lucide-react';
import {
  getMainnetNetworksListed,
  getDevnetNetworks,
  getNetworkById,
  type BlockchainNetwork,
  isMiningSessionNode,
  isMiningSessionMining,
  sessionListKey,
  sessionRowIsActive,
  type MiningSessionMining,
} from '@vibeminer/shared';
import { MiningPanel } from '@/components/dashboard/MiningPanel';
import { NodeSessionPanel } from '@/components/dashboard/NodeSessionPanel';
import { useMining } from '@/contexts/MiningContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BrandMark } from '@/components/BrandMark';
import { MiningLoader } from '@/components/ui/MiningLoader';

function findNetworkForSession(session: { networkId: string; environment: 'mainnet' | 'devnet' }): BlockchainNetwork | undefined {
  const main = getMainnetNetworksListed();
  const dev = getDevnetNetworks();
  const fromMain = main.find((n) => n.id === session.networkId && n.environment === session.environment);
  if (fromMain) return fromMain;
  const fromDev = dev.find((n) => n.id === session.networkId && n.environment === session.environment);
  if (fromDev) return fromDev;
  return getNetworkById(session.networkId, session.environment);
}

export default function MiningSessionsPage() {
  const isDesktop = useIsDesktop();
  const { user, loading: authLoading } = useAuth();
  const { sessions, stopSession, dismissNodeSession } = useMining();

  const sessionsWithNetworks = useMemo(() => {
    return sessions
      .map((session) => ({ session, network: findNetworkForSession(session) }))
      .filter((item): item is typeof item & { network: NonNullable<typeof item.network> } =>
        item.network != null
      );
  }, [sessions]);

  const miningRows = useMemo(
    () =>
      sessionsWithNetworks.filter(
        (row): row is typeof row & { session: MiningSessionMining } =>
          isMiningSessionMining(row.session)
      ),
    [sessionsWithNetworks]
  );

  const nodeRows = useMemo(
    () => sessionsWithNetworks.filter((row) => isMiningSessionNode(row.session)),
    [sessionsWithNetworks]
  );

  const activeSessionRowCount = useMemo(
    () => sessionsWithNetworks.filter(({ session }) => sessionRowIsActive(session)).length,
    [sessionsWithNetworks]
  );

  if (authLoading || !user) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className={`flex min-h-[60vh] flex-col items-center justify-center ${!isDesktop ? 'pt-14' : 'pt-6'}`}>
          <MiningLoader size="md" label="Loading…" />
        </div>
      </main>
    );
  }

  return (
    <>
      <div className={`mx-auto w-full min-w-0 max-w-4xl px-4 sm:px-6 ${!isDesktop ? 'pt-14 pb-8' : 'pt-6 pb-8'}`}>
        <Breadcrumbs
          crumbs={[
            { label: 'Home', href: '/home' },
            { label: 'Mining', href: '/dashboard/mining' },
            { label: 'Sessions' },
          ]}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 mt-4"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Sessions</h1>
          <p className="mt-1 text-gray-400">
            Active mining and node sessions. If a node exits, its card stays so you can read the log — use Dismiss when
            you are done.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            <Link href="/dashboard/mining" className="text-accent-cyan hover:underline">
              Mining
            </Link>
            {' · '}
            <Link href="/dashboard/nodes" className="text-accent-cyan hover:underline">
              Run nodes
            </Link>
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {sessionsWithNetworks.length > 0 ? (
            <motion.div
              key="sessions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-900/50 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-cyan/20 text-accent-cyan">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Active sessions</p>
                    <p className="font-mono text-lg font-semibold text-white">{activeSessionRowCount}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {miningRows.length} mining
                      {nodeRows.length > 0
                        ? ` · ${nodeRows.length} node${nodeRows.length !== 1 ? 's' : ''}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-900/50 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Mining hashrate</p>
                    <p className="font-mono text-lg font-semibold text-white">
                      {miningRows.reduce((sum, { session }) => sum + session.hashrate, 0)} H/s
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-900/50 px-4 py-3 sm:col-span-2 sm:col-span-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Est. mining earnings</p>
                    <p className="font-mono text-lg font-semibold text-white truncate">
                      {miningRows
                        .reduce((acc, { session }) => acc + parseFloat(session.estimatedEarnings || '0'), 0)
                        .toFixed(6)}{' '}
                      {miningRows.length === 1 ? miningRows[0].network.symbol : '—'}
                    </p>
                  </div>
                </div>
              </motion.div>
              <div className="space-y-3">
                {sessionsWithNetworks.map(({ session, network }) =>
                  isMiningSessionNode(session) ? (
                    <NodeSessionPanel
                      key={sessionListKey(session)}
                      session={session}
                      network={network}
                      onStop={() => stopSession(session)}
                      onDismiss={() => dismissNodeSession(session)}
                      compact={sessionsWithNetworks.length > 1}
                    />
                  ) : (
                    <MiningPanel
                      key={sessionListKey(session)}
                      session={session}
                      network={network}
                      onStop={() => stopSession(session)}
                      compact={sessionsWithNetworks.length > 1}
                    />
                  )
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-surface-900/30 py-20 text-center"
            >
              <BrandMark className="h-14 w-14 shrink-0 opacity-50" />
              <p className="mt-4 font-medium text-gray-400">No active sessions</p>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Start mining or running nodes from{' '}
                <Link href="/dashboard/mining" className="text-accent-cyan hover:underline">
                  Mining
                </Link>
                {' or '}
                <Link href="/dashboard/nodes" className="text-accent-cyan hover:underline">
                  Run nodes
                </Link>
                . Sessions will appear here.
              </p>
              <Link
                href="/dashboard/mining"
                className="mt-6 rounded-xl bg-accent-cyan/20 px-6 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
              >
                Go to dashboard
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
