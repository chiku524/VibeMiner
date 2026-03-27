'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { MiningSession as SessionType } from '@vibeminer/shared';
import type { BlockchainNetwork } from '@vibeminer/shared';
import { FEE_CONFIG } from '@vibeminer/shared';
import { Sparkline } from '@/components/ui/Sparkline';
import { NetworkMark } from '@/components/ui/NetworkMark';

interface MiningPanelProps {
  session: SessionType;
  network: BlockchainNetwork;
  onStop: () => void;
  /** Compact layout for lists with multiple sessions — denser, less scroll */
  compact?: boolean;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

const HASHRATE_HISTORY_LENGTH = 24;

export function MiningPanel({ session, network, onStop, compact = false }: MiningPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [elapsed, setElapsed] = useState(() =>
    session.startedAt ? Date.now() - session.startedAt : 0
  );
  const [hashrateHistory, setHashrateHistory] = useState<number[]>([]);
  const lastPushRef = useRef<number>(0);

  useEffect(() => {
    if (!session.startedAt) return;
    const tick = () => setElapsed(Date.now() - session.startedAt);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.startedAt]);

  useEffect(() => {
    const now = Date.now();
    const isFirst = lastPushRef.current === 0;
    if (!isFirst && now - lastPushRef.current < 1800) return;
    lastPushRef.current = now;
    setHashrateHistory((prev) => {
      const next = [...prev, session.hashrate].slice(-HASHRATE_HISTORY_LENGTH);
      return next;
    });
  }, [session.hashrate]);

  function handleStopClick() {
    if (confirming) {
      onStop();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="overflow-hidden rounded-xl border border-accent-cyan/20 bg-surface-900/50 mining-glow"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:flex-nowrap">
          <div className="flex min-w-0 items-center gap-2">
            <NetworkMark icon={network.icon} label={network.name} className="h-8 w-8 text-xl" />
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-white truncate">
                Mining {network.name}
              </h2>
              <p className="text-xs text-gray-500">{network.symbol} · {network.algorithm}</p>
            </div>
            {network.environment === 'devnet' && (
              <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-300">
                Devnet
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-mono text-accent-cyan">{session.hashrate} H/s</span>
            <span className="text-gray-400">{formatDuration(elapsed)}</span>
            <span className="text-gray-400">{session.shares} shares</span>
            <span className="font-mono text-accent-emerald">{session.estimatedEarnings} {network.symbol}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
            <span className="text-xs text-accent-emerald">Active</span>
            {confirming ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Stop?</span>
                <button
                  onClick={handleStopClick}
                  className="rounded-lg border border-red-500/50 bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={handleStopClick}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="overflow-hidden rounded-2xl border border-accent-cyan/20 bg-surface-900/50 mining-glow"
    >
      <div className="border-b border-white/5 bg-surface-850/80 px-5 py-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <NetworkMark icon={network.icon} label={network.name} className="h-10 w-10 text-2xl" />
            <div className="min-w-0">
              <h2 className="font-display truncate text-lg font-semibold text-white">
                Mining {network.name}
              </h2>
              <p className="truncate text-sm text-gray-500">{network.symbol} · {network.algorithm}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {network.environment === 'devnet' && (
              <span className="rounded bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-300">
                Devnet
              </span>
            )}
            <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
            <span className="text-sm font-medium text-accent-emerald">Active</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-4">
        <div className="rounded-lg bg-surface-850/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Hash rate</p>
          <p className="mt-0.5 font-mono text-lg text-accent-cyan">{session.hashrate} <span className="text-xs text-gray-400">H/s</span></p>
          {hashrateHistory.length >= 2 && (
            <div className="mt-2 text-accent-cyan/70">
              <Sparkline data={hashrateHistory} width={88} height={32} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="rounded-lg bg-surface-850/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Uptime</p>
          <p className="mt-0.5 font-mono text-lg text-white">{formatDuration(elapsed)}</p>
        </div>
        <div className="rounded-lg bg-surface-850/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Shares</p>
          <p className="mt-0.5 font-mono text-lg text-white">{session.shares}</p>
        </div>
        <div className="rounded-lg bg-surface-850/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Est. earnings</p>
          <p className="mt-0.5 font-mono text-lg text-accent-emerald">{session.estimatedEarnings} <span className="text-xs text-gray-400">{network.symbol}</span></p>
        </div>
      </div>

      <div className="border-t border-white/5 px-5 py-3">
        <p className="mb-2 text-xs text-gray-500">
          Min. payout: {network.minPayout ?? '—'}. Withdrawal fee: <strong className="text-gray-400">{FEE_CONFIG.WITHDRAWAL.percent}%</strong>.{' '}
          <Link href="/fees" className="text-accent-cyan hover:underline">See fees</Link>
        </p>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            Payout address is set in <Link href="/dashboard/settings" className="text-accent-cyan hover:underline">Settings</Link>
          </p>
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Stop?</span>
              <button
                onClick={handleStopClick}
                className="rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={handleStopClick}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400"
            >
              Stop mining
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
