'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import type { BlockchainNetwork } from '@vibeminer/shared';
import { INCENTIVIZED_TESTNET_IDS, getResourceTier, RESOURCE_TIER_LABELS, RESOURCE_TIER_DESCRIPTIONS, hasNodeConfig } from '@vibeminer/shared';
import { useIsDesktop } from '@/hooks/useIsDesktop';

interface NetworkModalProps {
  network: BlockchainNetwork | null;
  onClose: () => void;
}

function getFocusables(container: HTMLElement): HTMLElement[] {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

export function NetworkModal({ network, onClose }: NetworkModalProps) {
  const reduced = useReducedMotion() ?? false;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const [nodeRunning, setNodeRunning] = useState(false);
  const [nodeStarting, setNodeStarting] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<string | null>(null);

  const tier = getResourceTier(network?.nodeDiskGb, network?.nodeRamMb);
  const canRunNode = network && hasNodeConfig(network) && isDesktop;

  useEffect(() => {
    if (!network || !isDesktop || !window.desktopAPI?.isNodeRunning) return;
    window.desktopAPI.isNodeRunning(network.id, network.environment ?? 'mainnet').then(setNodeRunning);
  }, [network, isDesktop]);

  useEffect(() => {
    if (!network || !isDesktop || !nodeRunning || !window.desktopAPI?.getNodeStatus) return;
    const interval = setInterval(() => {
      window.desktopAPI?.getNodeStatus?.(network.id, network.environment ?? 'mainnet').then((s) => {
        if (s) setNodeStatus(s.status ?? null);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [network, isDesktop, nodeRunning]);

  useEffect(() => {
    if (!network) return;
    closeButtonRef.current?.focus({ preventScroll: true });
  }, [network]);

  useEffect(() => {
    if (!network || !contentRef.current) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !contentRef.current) return;
      const focusables = getFocusables(contentRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [network, onClose]);

  return (
    <AnimatePresence>
      {network && (
      <motion.div
        key={network.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="network-modal-title"
      >
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, scale: reduced ? 1 : 0.95, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 0.95 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface-900 p-6 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-3xl">
                {network.icon}
              </span>
              <div>
                <h2 id="network-modal-title" className="font-display text-xl font-semibold text-white">{network.name}</h2>
                <p className="text-sm text-gray-500">{network.symbol} · {network.algorithm}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    network.status === 'live'
                      ? 'bg-accent-emerald/20 text-accent-emerald'
                      : network.status === 'coming-soon'
                        ? 'bg-gray-500/20 text-gray-400'
                        : 'bg-accent-amber/20 text-accent-amber'
                  }`}
                >
                  {network.status === 'live' ? 'Live' : network.status === 'coming-soon' ? 'Coming soon' : 'Request service'}
                </span>
                {network.environment === 'devnet' && (
                  <span className="ml-2 inline-block rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs text-violet-300">
                    Devnet
                  </span>
                )}
                {INCENTIVIZED_TESTNET_IDS.includes(network.id) && (
                  <span className="ml-2 inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                    Incentivized testnet
                  </span>
                )}
                {(network.nodeDiskGb || network.nodeRamMb) && (
                  <span className="ml-2 inline-block rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs text-sky-300" title={RESOURCE_TIER_DESCRIPTIONS[tier]}>
                    {RESOURCE_TIER_LABELS[tier]} node
                  </span>
                )}
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-surface-900"
              aria-label="Close modal"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">{network.description}</p>
          <div className="mt-6 grid gap-3 rounded-xl bg-surface-850/80 p-4 text-sm">
            {network.poolUrl && (
              <div>
                <span className="text-gray-500">Pool</span>
                <p className="font-mono text-white">{network.poolUrl}{network.poolPort ? `:${network.poolPort}` : ''}</p>
              </div>
            )}
            {network.rewardRate && (
              <div>
                <span className="text-gray-500">Est. reward rate</span>
                <p className="font-mono text-accent-cyan">{network.rewardRate}</p>
              </div>
            )}
            {network.minPayout && (
              <div>
                <span className="text-gray-500">Min. payout</span>
                <p className="font-mono text-white">{network.minPayout}</p>
              </div>
            )}
            {(network.nodeDiskGb || network.nodeRamMb) && (
              <div>
                <span className="text-gray-500">Node resources</span>
                <p className="font-mono text-white">
                  {network.nodeDiskGb ? `${network.nodeDiskGb} GB disk` : ''}
                  {network.nodeDiskGb && network.nodeRamMb ? ' · ' : ''}
                  {network.nodeRamMb ? `${Math.round(network.nodeRamMb / 1024)} GB RAM` : ''}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{RESOURCE_TIER_DESCRIPTIONS[tier]}</p>
              </div>
            )}
          {network.website && (
              <a
                href={network.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-cyan hover:underline"
              >
                Visit website →
              </a>
            )}
          </div>
          {network.status === 'live' && (
            <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
              <Link
                href={`/dashboard/mining?env=${network.environment}&network=${network.id}`}
                className="inline-block rounded-xl bg-accent-cyan/20 px-4 py-2 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
              >
                Start mining →
              </Link>
              {canRunNode && (
                <>
                  {nodeRunning ? (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
                      <span className="text-sm text-accent-emerald">Node running</span>
                      {nodeStatus && <span className="text-xs text-gray-500">({nodeStatus})</span>}
                      <button
                        type="button"
                        onClick={async () => {
                          await window.desktopAPI?.stopNode?.(network.id, network.environment ?? 'mainnet');
                          setNodeRunning(false);
                        }}
                        className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10"
                      >
                        Stop node
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={nodeStarting}
                      onClick={async () => {
                        if (!window.desktopAPI?.startNode) return;
                        setNodeStarting(true);
                        try {
                          const result = await window.desktopAPI.startNode({
                            network: {
                              id: network.id,
                              environment: network.environment ?? 'mainnet',
                              nodeDownloadUrl: network.nodeDownloadUrl,
                              nodeCommandTemplate: network.nodeCommandTemplate,
                              nodeBinarySha256: network.nodeBinarySha256,
                            },
                          });
                          if (result.ok) setNodeRunning(true);
                          else alert(result.error);
                        } finally {
                          setNodeStarting(false);
                        }
                      }}
                      className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50"
                    >
                      {nodeStarting ? 'Starting…' : 'Run node'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
