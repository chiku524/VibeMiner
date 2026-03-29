'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { MiningSessionNode } from '@vibeminer/shared';
import type { BlockchainNetwork } from '@vibeminer/shared';
import {
  BOING_RPC_METHOD_GET_QA_REGISTRY,
  isBoingNetworkId,
  resolveNodePresets,
  sanitizeNodePresetId,
} from '@vibeminer/shared';
import { NetworkMark } from '@/components/ui/NetworkMark';
import { NodeProcessLog } from '@/components/dashboard/NodeProcessLog';
import { Server } from 'lucide-react';

interface NodeSessionPanelProps {
  session: MiningSessionNode;
  network: BlockchainNetwork;
  onStop: () => void;
  /** Remove the row after the process exited (logs stay until dismissed). */
  onDismiss?: () => void;
  compact?: boolean;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':');
}

/** Explains that newer Boing RPC (e.g. QA registry read) depends on the downloaded boing-node version. */
function BoingRpcTransparencyHint() {
  return (
    <div className="rounded-lg border border-sky-500/25 bg-sky-500/5 px-3 py-2.5 text-left">
      <p className="text-xs font-medium text-sky-200">Boing RPC &amp; public transparency</p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
        Read-only{' '}
        <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-gray-300">{BOING_RPC_METHOD_GET_QA_REGISTRY}</code>{' '}
        powers{' '}
        <a
          href="https://boing.observer/qa"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 underline-offset-2 hover:underline"
        >
          boing.observer/qa
        </a>
        . If tools return <span className="text-gray-300">Method not found</span>, this binary predates that RPC — build a
        current <span className="text-gray-300">boing-node</span>, publish a new GitHub release, update the network&apos;s
        download URL in the listing, then stop and restart the node here. See VibeMiner{' '}
        <code className="rounded bg-black/40 px-1 font-mono text-[10px] text-gray-500">docs/BOING_QA_RPC_AND_RELEASES.md</code>
        .
      </p>
    </div>
  );
}

export function NodeSessionPanel({ session, network, onStop, onDismiss, compact = false }: NodeSessionPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const processExited = session.nodeProcessExitedAt != null;
  const [compactLogOpen, setCompactLogOpen] = useState(processExited);
  const [elapsed, setElapsed] = useState(() =>
    session.startedAt ? Date.now() - session.startedAt : 0
  );

  const presetLabel =
    resolveNodePresets(network).find((p) => sanitizeNodePresetId(p.presetId) === session.presetId)?.label ??
    session.presetId;

  useEffect(() => {
    if (!session.startedAt || processExited) return;
    const tick = () => setElapsed(Date.now() - session.startedAt);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.startedAt, processExited]);

  useEffect(() => {
    if (processExited) setCompactLogOpen(true);
  }, [processExited]);

  const ranForMs =
    processExited && session.nodeProcessExitedAt != null && session.startedAt
      ? session.nodeProcessExitedAt - session.startedAt
      : elapsed;

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
        className={`overflow-hidden rounded-xl border bg-surface-900/50 ${
          processExited ? 'border-amber-500/30' : 'border-sky-500/25'
        }`}
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
            <span className={`font-mono ${processExited ? 'text-amber-200/90' : 'text-sky-300'}`}>
              {processExited ? formatDuration(ranForMs) : formatDuration(elapsed)}
            </span>
            {session.nodeStatus && !processExited && (
              <span className="text-xs text-gray-400 truncate max-w-[12rem]" title={session.nodeStatus}>
                {session.nodeStatus}
              </span>
            )}
            {processExited && (
              <span className="text-xs font-medium text-amber-200/90">Process stopped — log kept below</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {processExited ? (
              <button
                type="button"
                onClick={() => onDismiss?.()}
                className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-200 hover:bg-white/10"
              >
                Dismiss
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
        {isBoingNetworkId(network.id) && (
          <div className="px-4 pb-2">
            <BoingRpcTransparencyHint />
          </div>
        )}
        <details
          className="border-t border-white/5 px-4 py-2"
          open={compactLogOpen}
          onToggle={(e) => setCompactLogOpen(e.currentTarget.open)}
        >
          <summary className="cursor-pointer select-none text-xs text-gray-500 hover:text-gray-400">
            Node output (read-only)
          </summary>
          <div className="mt-2 pb-2">
            <NodeProcessLog
              networkId={session.networkId}
              environment={session.environment}
              nodePresetId={sanitizeNodePresetId(session.presetId)}
              snapshotRefreshAt={session.nodeProcessExitedAt}
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
      className={`overflow-hidden rounded-2xl border bg-surface-900/50 ${
        processExited ? 'border-amber-500/30' : 'border-sky-500/25'
      }`}
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
            {processExited ? (
              <span className="text-sm font-medium text-amber-200/90">Stopped</span>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-sm font-medium text-sky-300">Running</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="rounded-lg bg-surface-850/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {processExited ? 'Ran for' : 'Uptime'}
          </p>
          <p className={`mt-0.5 font-mono text-lg ${processExited ? 'text-amber-100' : 'text-white'}`}>
            {formatDuration(ranForMs)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-850/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Status</p>
          <p className="mt-0.5 text-sm text-gray-300">
            {processExited
              ? 'Process ended — review the log below, then dismiss this card.'
              : session.nodeStatus?.trim() || '—'}
          </p>
        </div>
      </div>

      {isBoingNetworkId(network.id) && (
        <div className="px-5 pb-4">
          <BoingRpcTransparencyHint />
        </div>
      )}

      <div className="border-t border-white/5 px-5 pb-5">
        <p className="mb-2 text-xs font-medium text-gray-500">Process log</p>
        <NodeProcessLog
          networkId={session.networkId}
          environment={session.environment}
          nodePresetId={sanitizeNodePresetId(session.presetId)}
          snapshotRefreshAt={session.nodeProcessExitedAt}
        />
      </div>

      <div className="border-t border-white/5 px-5 py-3">
        {processExited ? (
          <button
            type="button"
            onClick={() => onDismiss?.()}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-white/10"
          >
            Dismiss
          </button>
        ) : confirming ? (
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
