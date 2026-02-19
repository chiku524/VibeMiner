'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { MiningSession as SessionType } from '@vibeminer/shared';
import type { BlockchainNetwork } from '@vibeminer/shared';
import { FEE_CONFIG } from '@vibeminer/shared';

interface MiningPanelProps {
  session: SessionType;
  network: BlockchainNetwork;
  onStop: () => void;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

export function MiningPanel({ session, network, onStop }: MiningPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [elapsed, setElapsed] = useState(() =>
    session.startedAt ? Date.now() - session.startedAt : 0
  );

  useEffect(() => {
    if (!session.startedAt) return;
    const tick = () => setElapsed(Date.now() - session.startedAt);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.startedAt]);

  function handleStopClick() {
    if (confirming) {
      onStop();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="overflow-hidden rounded-2xl border border-accent-cyan/20 bg-surface-900/50 mining-glow"
    >
      <div className="border-b border-white/5 bg-surface-850/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{network.icon}</span>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">
                Mining {network.name}
              </h2>
              <p className="text-sm text-gray-500">{network.symbol} · {network.algorithm}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

      <div className="grid gap-6 p-6 sm:grid-cols-2">
        <div className="rounded-xl bg-surface-850/80 p-4 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Session stats (simulated)</p>
          <p className="mt-1 text-sm text-gray-400">In production, total earned and history would appear here.</p>
        </div>
        <div className="rounded-xl bg-surface-850/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Hash rate
          </p>
          <p className="mt-1 font-mono text-2xl text-accent-cyan">
            {session.hashrate} <span className="text-sm text-gray-400">H/s</span>
          </p>
        </div>
        <div className="rounded-xl bg-surface-850/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Uptime
          </p>
          <p className="mt-1 font-mono text-2xl text-white">
            {formatDuration(elapsed)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-850/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Shares
          </p>
          <p className="mt-1 font-mono text-2xl text-white">{session.shares}</p>
        </div>
        <div className="rounded-xl bg-surface-850/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Est. earnings
          </p>
          <p className="mt-1 font-mono text-2xl text-accent-emerald">
            {session.estimatedEarnings} <span className="text-sm text-gray-400">{network.symbol}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-4">
        <p className="mb-3 text-xs text-gray-500">
          In production, this panel would show live data from your miner or pool. Min. payout: {network.minPayout ?? '—'}
        </p>
        <p className="mb-3 text-xs text-gray-500">
          Withdrawal fee: <strong className="text-gray-400">{FEE_CONFIG.WITHDRAWAL.percent}%</strong>.{' '}
          <Link href="/fees" className="text-accent-cyan hover:underline">See fees</Link>
        </p>
        <div className="mb-3 rounded-lg border border-white/5 bg-surface-850/50 px-3 py-2">
          <label htmlFor="payout-address" className="block text-xs text-gray-500">Payout address (optional)</label>
          <input
            id="payout-address"
            type="text"
            placeholder="Wallet address for payouts"
            className="mt-1 w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
            aria-label="Payout wallet address"
          />
        </div>
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">Stop mining session?</span>
            <button
              onClick={handleStopClick}
              className="rounded-xl border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/30"
            >
              Yes, stop
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleStopClick}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
          >
            Stop mining
          </button>
        )}
      </div>
    </motion.div>
  );
}
