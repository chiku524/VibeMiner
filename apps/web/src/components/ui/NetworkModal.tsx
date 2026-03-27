'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { site } from '@/lib/site';
import type { BlockchainNetwork } from '@vibeminer/shared';
import type { NetworkNodePreset } from '@vibeminer/shared';
import {
  INCENTIVIZED_TESTNET_IDS,
  getResourceTier,
  RESOURCE_TIER_LABELS,
  RESOURCE_TIER_DESCRIPTIONS,
  hasNodeConfig,
  resolveNodePresets,
  effectivePresetNodeBinarySha256,
  effectivePresetNodeDownloadUrl,
  sanitizeNodePresetId,
} from '@vibeminer/shared';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useToast } from '@/contexts/ToastContext';
import { useMining } from '@/contexts/MiningContext';
import { NetworkMark } from '@/components/ui/NetworkMark';

interface NetworkModalProps {
  network: BlockchainNetwork | null;
  onClose: () => void;
}

function pickPresetIdForPlatform(presets: NetworkNodePreset[], platform: string): string {
  if (presets.length === 0) return 'default';
  const os = platform.toLowerCase();
  const token =
    os === 'windows'
      ? 'windows'
      : os === 'macos' || os === 'darwin'
        ? 'macos'
        : os === 'linux'
          ? 'linux'
          : null;
  if (!token) return presets[0].presetId;
  const hit = presets.find((p) => {
    const id = p.presetId.toLowerCase();
    const label = p.label.toLowerCase();
    if (token === 'macos') {
      return (
        id.includes('mac') ||
        id.includes('darwin') ||
        label.includes('mac') ||
        label.includes('darwin')
      );
    }
    return id.includes(token) || label.includes(token);
  });
  return hit?.presetId ?? presets[0].presetId;
}

function getFocusables(container: HTMLElement): HTMLElement[] {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  );
}

export function NetworkModal({ network, onClose }: NetworkModalProps) {
  const reduced = useReducedMotion() ?? false;
  const router = useRouter();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const { addToast } = useToast();
  const { registerNodeSession, stopSession } = useMining();
  const [nodeRunning, setNodeRunning] = useState(false);
  const [nodeStarting, setNodeStarting] = useState(false);
  const [nodeStatus, setNodeStatus] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('default');

  const nodePresets = useMemo(
    () => (network ? resolveNodePresets(network) : []),
    [network]
  );
  const selectedPreset = useMemo(() => {
    const p = nodePresets.find((x) => x.presetId === selectedPresetId);
    return p ?? nodePresets[0];
  }, [nodePresets, selectedPresetId]);

  useEffect(() => {
    if (!network) return;
    const list = resolveNodePresets(network);
    const fallback = list[0]?.presetId ?? 'default';
    if (isDesktop && window.desktopAPI?.getPlatform) {
      void window.desktopAPI.getPlatform().then((plat) => {
        setSelectedPresetId(pickPresetIdForPlatform(list, plat));
      });
    } else {
      setSelectedPresetId(fallback);
    }
  }, [network, isDesktop]);

  const displayDiskGb = network ? selectedPreset?.nodeDiskGb ?? network.nodeDiskGb : undefined;
  const displayRamMb = network ? selectedPreset?.nodeRamMb ?? network.nodeRamMb : undefined;
  const tier = getResourceTier(displayDiskGb, displayRamMb);
  const hasNode = !!(network && hasNodeConfig(network));
  const canRunNode = hasNode && isDesktop;

  useEffect(() => {
    if (!network || !isDesktop || !window.desktopAPI?.isNodeRunning || !selectedPreset) return;
    window.desktopAPI
      .isNodeRunning(network.id, network.environment ?? 'mainnet', selectedPreset.presetId)
      .then(setNodeRunning);
  }, [network, isDesktop, selectedPreset?.presetId]);

  useEffect(() => {
    if (!network || !isDesktop || !nodeRunning || !window.desktopAPI?.getNodeStatus || !selectedPreset) return;
    const interval = setInterval(() => {
      window.desktopAPI
        ?.getNodeStatus?.(network.id, network.environment ?? 'mainnet', selectedPreset.presetId)
        .then((s) => {
          if (s) setNodeStatus(s.status ?? null);
        });
    }, 3000);
    return () => clearInterval(interval);
  }, [network, isDesktop, nodeRunning, selectedPreset?.presetId]);

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
          className="w-full max-w-lg max-h-[min(90dvh,720px)] overflow-y-auto rounded-2xl border border-white/10 bg-surface-900 p-4 shadow-xl sm:p-6"
        >
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <NetworkMark
                icon={network.icon}
                label={network.name}
                className="h-14 w-14 rounded-xl bg-white/10 text-3xl"
              />
              <div className="min-w-0 flex-1">
                <h2
                  id="network-modal-title"
                  className="font-display break-words text-xl font-semibold text-white"
                >
                  {network.name}
                </h2>
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
                {(displayDiskGb || displayRamMb) && (
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
              className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-surface-900"
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
                <p className="break-all font-mono text-white">
                  {network.poolUrl}
                  {network.poolPort ? `:${network.poolPort}` : ''}
                </p>
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
            {(displayDiskGb || displayRamMb) && (
              <div>
                <span className="text-gray-500">Node resources</span>
                <p className="font-mono text-white">
                  {displayDiskGb ? `${displayDiskGb} GB disk` : ''}
                  {displayDiskGb && displayRamMb ? ' · ' : ''}
                  {displayRamMb ? `${Math.round(displayRamMb / 1024)} GB RAM` : ''}
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
              {hasNode && !isDesktop && (
                <div className="w-full rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
                  <p className="font-medium text-amber-200">Run node needs the desktop app</p>
                  <p className="mt-1 text-xs text-amber-100/80">
                    Browsers cannot download or start the node binary. Install VibeMiner for Windows, macOS, or Linux,
                    sign in with your account, then open this network again and use <strong className="font-semibold">Run node</strong>.
                  </p>
                  <Link
                    href="/download"
                    className="mt-2 inline-block text-sm font-medium text-accent-cyan underline-offset-2 hover:underline"
                  >
                    Download {site.name} →
                  </Link>
                </div>
              )}
              {canRunNode && selectedPreset && (
                <>
                  {nodePresets.length > 1 && (
                    <div className="w-full min-w-0 sm:w-auto">
                      <label htmlFor="node-preset-select" className="sr-only">
                        Node mode
                      </label>
                      <select
                        id="node-preset-select"
                        value={selectedPresetId}
                        disabled={nodeRunning || nodeStarting}
                        onChange={(e) => setSelectedPresetId(e.target.value)}
                        className="w-full max-w-xs rounded-lg border border-white/10 bg-surface-850 px-3 py-2 text-sm text-white focus:border-accent-cyan/50 focus:outline-none disabled:opacity-50"
                      >
                        {nodePresets.map((p) => (
                          <option key={p.presetId} value={p.presetId}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      {selectedPreset.description && (
                        <p className="mt-1 max-w-md text-xs text-gray-500">{selectedPreset.description}</p>
                      )}
                    </div>
                  )}
                  {nodePresets.length === 1 && selectedPreset.description && (
                    <p className="w-full text-xs text-gray-500">{selectedPreset.description}</p>
                  )}
                  {nodeRunning ? (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
                      <span className="text-sm text-accent-emerald">Node running</span>
                      {nodeStatus && <span className="text-xs text-gray-500">({nodeStatus})</span>}
                      <button
                        type="button"
                        onClick={() => {
                          stopSession({
                            kind: 'node',
                            networkId: network.id,
                            environment: network.environment ?? 'mainnet',
                            presetId: sanitizeNodePresetId(selectedPreset.presetId),
                            startedAt: 0,
                            isActive: true,
                          });
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
                        if (!window.desktopAPI?.startNode) {
                          addToast('Desktop bridge not ready. Close this window and try again, or restart the app.', 'error');
                          return;
                        }
                        setNodeStarting(true);
                        try {
                          const effUrl = effectivePresetNodeDownloadUrl(
                            selectedPreset,
                            network.nodeDownloadUrl
                          );
                          const effSha = effectivePresetNodeBinarySha256(
                            selectedPreset,
                            network.nodeBinarySha256
                          );
                          if (!effUrl?.trim()) {
                            addToast('No download URL for this node mode.', 'error');
                            return;
                          }
                          const result = await window.desktopAPI.startNode({
                            network: {
                              id: network.id,
                              environment: network.environment ?? 'mainnet',
                              nodeDownloadUrl: effUrl,
                              nodeCommandTemplate: selectedPreset.commandTemplate,
                              nodeBinarySha256: effSha,
                              nodePresetId: selectedPreset.presetId,
                            },
                          });
                          if (result && typeof result === 'object' && 'ok' in result && result.ok) {
                            setNodeRunning(true);
                            registerNodeSession({
                              networkId: network.id,
                              environment: network.environment ?? 'mainnet',
                              presetId: selectedPreset.presetId,
                            });
                            addToast(`${network.name} node started`);
                            onClose();
                            router.push('/dashboard/sessions');
                          } else {
                            const err =
                              result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
                                ? result.error
                                : 'Could not start node';
                            addToast(err, 'error');
                          }
                        } catch (e) {
                          const msg = e instanceof Error ? e.message : String(e);
                          addToast(msg || 'Could not start node', 'error');
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
