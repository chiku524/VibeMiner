'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MiningSessionNode } from '@vibeminer/shared';
import type { BlockchainNetwork } from '@vibeminer/shared';
import { resolveNodePresets, sanitizeNodePresetId } from '@vibeminer/shared';
import { NetworkMark } from '@/components/ui/NetworkMark';
import { NodeProcessLog } from '@/components/dashboard/NodeProcessLog';
import { Server } from 'lucide-react';

interface NodeSessionPanelProps {
  session: MiningSessionNode;
  network: BlockchainNetwork;
  onStop: () => void;
  compact?: boolean;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

export function NodeSessionPanel({ session, network, onStop, compact = false }: NodeSessionPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [elapsed, setElapsed] = useState(() =>
    session.startedAt ? Date.now() - session.startedAt : 0
  );

  const presetLabel =
    resolveNodePresets(network).find((p) => sanitizeNodePresetId(p.presetId) === session.presetId)?.label ??
    session.presetId;

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

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="overflow-hidden rounded-xl border border-sky-500/25 bg-surface-900/50"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:flex-nowrap">
          <div className="flex min-w-0 items-center gap-2">
            <NetworkMark icon={network.icon} label={network.name} className="h-8 w-8 text-xl" />
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-white truncate flex items-center gap-2">
                <Server className="h-4 w-4 shrink-0 text-sky-400" aria-hidden />
                Node · {network.name}
              </h2>
              <p className="text-xs text-gray-500">
                {network.symbol} · {presetLabel}
              </p>
            </div>
            {network.environment === 'devnet' && (
              <span className="shrink-0 rounded bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-300">Devnet</span>
            )}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-mono text-sky-300">{formatDuration(elapsed)}</span>
            {session.nodeStatus && (
              <span className="text-xs text-gray-400 truncate max-w-[12rem]" title={session.nodeStatus}>
                {session.nodeStatus}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs text-sky-300">Running</span>
            {confirming ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Stop?</span>
                <button
                  type="button"
                  onClick={handleStopClick}
                  className="rounded-lg border border-red-500/50 bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-gray-400"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStopClick}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400"
              >
                Stop
              </button>
            )}
          </div>
        </div>
        <details className="border-t border-white/5 px-4 py-2">
          <summary className="cursor-pointer select-none text-xs text-gray-500 hover:text-gray-400">
            Node output (read-only)
          </summary>
          <div className="mt-2 pb-2">
            <NodeProcessLog
              networkId={session.networkId}
              environment={session.environment}
              nodePresetId={sanitizeNodePresetId(session.presetId)}
            />
          </div>
        </details>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="overflow-hidden rounded-2xl border border-sky-500/25 bg-surface-900/50"
    >
      <div className="border-b border-white/5 bg-surface-850/80 px-5 py-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <NetworkMark icon={network.icon} label={network.name} className="h-10 w-10 text-2xl" />
            <div className="min-w-0">
              <h2 className="font-display flex items-center gap-2 truncate text-lg font-semibold text-white">
                <Server className="h-5 w-5 shrink-0 text-sky-400" aria-hidden />
                Node · {network.name}
              </h2>
              <p className="truncate text-sm text-gray-500">
                {network.symbol} · {presetLabel}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {network.environment === 'devnet' && (
              <span className="rounded bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-300">Devnet</span>
            )}
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-sm font-medium text-sky-300">Running</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="rounded-lg bg-surface-850/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Uptime</p>
          <p className="mt-0.5 font-mono text-lg text-white">{formatDuration(elapsed)}</p>
        </div>
        <div className="rounded-lg bg-surface-850/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Status</p>
          <p className="mt-0.5 text-sm text-gray-300">{session.nodeStatus?.trim() || '—'}</p>
        </div>
      </div>

      <div className="border-t border-white/5 px-5 pb-5">
        <p className="mb-2 text-xs font-medium text-gray-500">Process log</p>
        <NodeProcessLog
          networkId={session.networkId}
          environment={session.environment}
          nodePresetId={sanitizeNodePresetId(session.presetId)}
        />
      </div>

      <div className="border-t border-white/5 px-5 py-3">
        {confirming ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-gray-400">Stop this node?</span>
            <button
              type="button"
              onClick={handleStopClick}
              className="rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400"
            >
              Yes, stop
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStopClick}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400"
          >
            Stop node
          </button>
        )}
      </div>
    </motion.div>
  );
}
