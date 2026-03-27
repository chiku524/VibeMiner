'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import {
  FEE_CONFIG,
  ALGORITHM_OPTIONS,
  isValidBlockchainNetworkIcon,
  isUploadedNetworkIconPath,
} from '@vibeminer/shared';
import { NetworkMark } from '@/components/ui/NetworkMark';
import type { NetworkEnvironment, NetworkNodePreset } from '@vibeminer/shared';

type RequestStatus = 'idle' | 'pending' | 'listed' | 'error';

export type NetworkListingInitialData = {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  algorithm: string;
  environment: NetworkEnvironment;
  description: string;
  poolUrl?: string;
  poolPort?: number;
  website?: string;
  rewardRate?: string;
  minPayout?: string;
  nodeDownloadUrl?: string;
  nodeCommandTemplate?: string;
  nodeDiskGb?: number;
  nodeRamMb?: number;
  nodeBinarySha256?: string;
  nodePresets?: NetworkNodePreset[];
};

const PRESET_ID_PATTERN = /^[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])?$/;

type PresetRow = {
  presetId: string;
  label: string;
  description: string;
  commandTemplate: string;
  nodeDiskGb: string;
  nodeRamMb: string;
};

function emptyPresetRow(): PresetRow {
  return {
    presetId: '',
    label: '',
    description: '',
    commandTemplate: '',
    nodeDiskGb: '',
    nodeRamMb: '',
  };
}

function presetRowFromApi(p: NetworkNodePreset): PresetRow {
  return {
    presetId: p.presetId,
    label: p.label,
    description: p.description ?? '',
    commandTemplate: p.commandTemplate,
    nodeDiskGb: p.nodeDiskGb != null ? String(p.nodeDiskGb) : '',
    nodeRamMb: p.nodeRamMb != null ? String(p.nodeRamMb) : '',
  };
}

function toNetworkId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'network';
}

type RequestListingFormProps = {
  editId?: string;
  initialData?: NetworkListingInitialData | null;
};

export function RequestListingForm({ editId, initialData }: RequestListingFormProps = {}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [iconEmoji, setIconEmoji] = useState('⛓');
  const [iconImagePath, setIconImagePath] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState('');
  const [environment, setEnvironment] = useState<NetworkEnvironment>('devnet');
  const [poolUrl, setPoolUrl] = useState('');
  const [poolPort, setPoolPort] = useState('');
  const [website, setWebsite] = useState('');
  const [rewardRate, setRewardRate] = useState('');
  const [minPayout, setMinPayout] = useState('');
  const [description, setDescription] = useState('');
  const [feeConfirmed, setFeeConfirmed] = useState(false);
  const [showNodeSection, setShowNodeSection] = useState(false);
  const [nodeDownloadUrl, setNodeDownloadUrl] = useState('');
  const [nodeCommandTemplate, setNodeCommandTemplate] = useState('');
  const [nodeDiskGb, setNodeDiskGb] = useState('');
  const [nodeRamMb, setNodeRamMb] = useState('');
  const [nodeBinarySha256, setNodeBinarySha256] = useState('');
  const [useMultiPresets, setUseMultiPresets] = useState(false);
  const [presetRows, setPresetRows] = useState<PresetRow[]>(() => [emptyPresetRow()]);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [iconUploading, setIconUploading] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name);
    setSymbol(initialData.symbol);
    const ic = initialData.icon ?? '⛓';
    if (isUploadedNetworkIconPath(ic)) {
      setIconImagePath(ic);
      setIconEmoji('⛓');
    } else {
      setIconImagePath(null);
      setIconEmoji(ic);
    }
    setAlgorithm(initialData.algorithm);
    setEnvironment(initialData.environment);
    setDescription(initialData.description);
    setPoolUrl(initialData.poolUrl ?? '');
    setPoolPort(initialData.poolPort != null ? String(initialData.poolPort) : '');
    setWebsite(initialData.website ?? '');
    setRewardRate(initialData.rewardRate ?? '');
    setMinPayout(initialData.minPayout ?? '');
    setNodeDownloadUrl(initialData.nodeDownloadUrl ?? '');
    setNodeCommandTemplate(initialData.nodeCommandTemplate ?? '');
    setNodeDiskGb(initialData.nodeDiskGb != null ? String(initialData.nodeDiskGb) : '');
    setNodeRamMb(initialData.nodeRamMb != null ? String(initialData.nodeRamMb) : '');
    setNodeBinarySha256(initialData.nodeBinarySha256 ?? '');
    const stored = initialData.nodePresets;
    const hasMulti = Array.isArray(stored) && stored.length > 0;
    setUseMultiPresets(hasMulti);
    setPresetRows(hasMulti ? stored.map(presetRowFromApi) : [emptyPresetRow()]);
    setShowNodeSection(
      !!(initialData.nodeDownloadUrl || initialData.nodeCommandTemplate || hasMulti)
    );
  }, [initialData]);

  const isMainnet = environment === 'mainnet';
  const requiresFee = isMainnet && FEE_CONFIG.NETWORK_LISTING.devnetFree;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('pending');
    setErrorMsg(null);

    const baseId = toNetworkId(name);
    const desc = description.trim();
    const portNum = poolPort ? Number(poolPort) : undefined;
    const iconTrim = (iconImagePath ?? iconEmoji).trim();
    if (!isValidBlockchainNetworkIcon(iconTrim)) {
      setStatus('error');
      setErrorMsg('Upload a PNG or JPEG logo, or enter a short emoji (max 64 characters).');
      return;
    }
    if (!algorithm.trim()) {
      setStatus('error');
      setErrorMsg('Please select or enter an algorithm (e.g. RandomX for mining, PoS for proof-of-stake).');
      return;
    }
    if (desc.length < 20) {
      setStatus('error');
      setErrorMsg('Please provide a clear description of your network and its use case (at least 20 characters).');
      return;
    }
    const urlOk = !!nodeDownloadUrl.trim();
    let hasNode = false;
    if (useMultiPresets) {
      const filled = presetRows.filter(
        (r) => r.presetId.trim() && r.label.trim() && r.commandTemplate.trim()
      );
      if (urlOk && filled.length > 0) {
        for (const r of filled) {
          if (!PRESET_ID_PATTERN.test(r.presetId.trim())) {
            setStatus('error');
            setErrorMsg(
              `Invalid node mode id "${r.presetId.trim()}": use lowercase letters, numbers, and hyphens only (1–48 chars).`
            );
            return;
          }
        }
        hasNode = true;
      }
    } else {
      hasNode = !!(urlOk && nodeCommandTemplate.trim());
    }
    const hasPool = !!(poolUrl.trim() && portNum != null && portNum >= 1 && portNum <= 65535);
    if (!hasPool && !hasNode) {
      setStatus('error');
      setErrorMsg('Provide either a mining pool (URL + port) for PoW, or node config (download URL + command) for PoS/node networks.');
      return;
    }
    if (poolUrl.trim() && (portNum == null || portNum < 1 || portNum > 65535)) {
      setStatus('error');
      setErrorMsg('When providing a pool URL, a valid pool port (1–65535) is required.');
      return;
    }

    const payload: Record<string, unknown> = {
      id: editId ?? baseId,
      name,
      symbol,
      algorithm: algorithm.trim(),
      environment,
      description: desc,
      icon: iconTrim,
      poolUrl: poolUrl.trim() || undefined,
      poolPort: hasPool ? portNum : undefined,
      website: website || undefined,
      rewardRate: rewardRate.trim() || undefined,
      minPayout: minPayout.trim() || undefined,
      status: 'live',
      ...(!editId && requiresFee && { feeConfirmed }),
    };
    if (urlOk && useMultiPresets) {
      const filled = presetRows.filter(
        (r) => r.presetId.trim() && r.label.trim() && r.commandTemplate.trim()
      );
      if (filled.length > 0) {
        payload.nodeDownloadUrl = nodeDownloadUrl.trim();
        const presets: NetworkNodePreset[] = filled.map((r) => {
          const disk = r.nodeDiskGb ? Number(r.nodeDiskGb) : undefined;
          const ram = r.nodeRamMb ? Number(r.nodeRamMb) : undefined;
          return {
            presetId: r.presetId.trim(),
            label: r.label.trim(),
            description: r.description.trim() || undefined,
            commandTemplate: r.commandTemplate.trim(),
            ...(disk && disk >= 1 && disk <= 2000 ? { nodeDiskGb: disk } : {}),
            ...(ram && ram >= 256 && ram <= 65536 ? { nodeRamMb: ram } : {}),
          };
        });
        payload.nodePresets = presets;
        if (nodeBinarySha256.trim() && /^[a-fA-F0-9]{64}$/.test(nodeBinarySha256.trim())) {
          payload.nodeBinarySha256 = nodeBinarySha256.trim();
        }
      }
    } else if (urlOk && nodeCommandTemplate.trim()) {
      payload.nodeDownloadUrl = nodeDownloadUrl.trim();
      payload.nodeCommandTemplate = nodeCommandTemplate.trim();
      payload.nodePresets = [];
      const disk = nodeDiskGb ? Number(nodeDiskGb) : undefined;
      const ram = nodeRamMb ? Number(nodeRamMb) : undefined;
      if (disk && disk >= 1 && disk <= 2000) payload.nodeDiskGb = disk;
      if (ram && ram >= 256 && ram <= 65536) payload.nodeRamMb = ram;
      if (nodeBinarySha256.trim() && /^[a-fA-F0-9]{64}$/.test(nodeBinarySha256.trim())) {
        payload.nodeBinarySha256 = nodeBinarySha256.trim();
      }
    }

    const url = editId ? `/api/networks/${encodeURIComponent(editId)}` : '/api/networks/register';
    const method = editId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; seeAlso?: string };

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error ?? 'Registration failed');
        if (data.seeAlso) {
          addToast('See /fees for fee details');
        }
        return;
      }

      setStatus('listed');
      addToast(editId ? 'Network updated.' : 'Network listed automatically. No admin approval required.');
    } catch {
      setStatus('error');
      setErrorMsg('Network unreachable. Try again.');
    }
  }

  async function handleIconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIconUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const res = await fetch('/api/networks/icon', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
      if (!res.ok) {
        addToast(data.error ?? 'Logo upload failed', 'error');
        return;
      }
      if (data.path) {
        setIconImagePath(data.path);
        addToast('Logo uploaded', 'info');
      }
    } catch {
      addToast('Logo upload failed', 'error');
    } finally {
      setIconUploading(false);
    }
  }

  async function handleDeleteListing() {
    if (!editId) return;
    if (
      !window.confirm(
        'Delete this network listing permanently? It will be removed from VibeMiner and miners will no longer see it. This cannot be undone.'
      )
    ) {
      return;
    }
    setDeletePending(true);
    try {
      const res = await fetch(`/api/networks/${encodeURIComponent(editId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        addToast(data.error ?? 'Could not delete listing', 'error');
        return;
      }
      addToast('Listing deleted', 'info');
      router.push('/dashboard/settings');
      router.refresh();
    } catch {
      addToast('Could not delete listing', 'error');
    } finally {
      setDeletePending(false);
    }
  }

  if (status === 'listed') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-6"
      >
        <h3 className="font-display font-semibold text-accent-emerald">Listed automatically</h3>
        <p className="mt-2 text-sm text-gray-400">
          Your network passed validation and is now live. No admin approval required—automated, decentralized onboarding.
        </p>
        <span className="mt-4 inline-block rounded-full bg-accent-emerald/20 px-3 py-1 text-sm font-medium text-accent-emerald">
          Status: Live
        </span>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-white/5 bg-surface-900/30 p-6"
    >
      <h3 className="font-display font-semibold text-white">{editId ? 'Edit listing' : 'Request listing'}</h3>
      <p className="text-sm text-gray-400">
        {editId ? 'Update your network details below.' : 'Automated onboarding—no admin approval. Submit valid chain details; your network is listed immediately after validation.'}
      </p>

      {status === 'error' && errorMsg && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{errorMsg}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="req-name" className="block text-sm font-medium text-gray-400">Network name</label>
          <input
            id="req-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={128}
            placeholder="e.g. My Chain"
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="req-symbol" className="block text-sm font-medium text-gray-400">Symbol</label>
          <input
            id="req-symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
            maxLength={16}
            placeholder="e.g. MYC"
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-400">Network logo (required)</span>
        <p className="mt-1 text-xs text-gray-500">
          Upload PNG, JPEG, or WebP (max 512 KB), or enter a short emoji below.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <NetworkMark
            icon={iconImagePath ?? iconEmoji}
            label={name.trim() || 'Network logo preview'}
            className="h-14 w-14 text-2xl"
          />
          <div className="flex flex-col gap-2">
            <input
              ref={iconFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              aria-label="Upload logo image"
              onChange={handleIconFileChange}
              disabled={iconUploading}
            />
            <button
              type="button"
              onClick={() => iconFileRef.current?.click()}
              disabled={iconUploading}
              className="rounded-lg border border-white/10 bg-surface-850 px-4 py-2 text-sm text-white transition hover:border-accent-cyan/40 hover:bg-white/5 disabled:opacity-50"
            >
              {iconUploading ? 'Uploading…' : 'Upload image'}
            </button>
            {iconImagePath && (
              <button
                type="button"
                onClick={() => setIconImagePath(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-white/20 hover:text-white"
              >
                Remove image
              </button>
            )}
          </div>
        </div>
        <label htmlFor="req-icon" className="mt-4 block text-xs font-medium text-gray-500">
          Or emoji / text (max 64 characters){iconImagePath ? ' — ignored while an image is set' : ''}
        </label>
        <input
          id="req-icon"
          type="text"
          value={iconEmoji}
          onChange={(e) => setIconEmoji(e.target.value)}
          maxLength={64}
          disabled={!!iconImagePath}
          placeholder="e.g. ⛓"
          className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-2xl text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="req-env" className="block text-sm font-medium text-gray-400">Environment</label>
        <select
          id="req-env"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as NetworkEnvironment)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white focus:border-accent-cyan/50 focus:outline-none"
        >
          <option value="devnet">Devnet (free, for testing)</option>
          <option value="mainnet">Mainnet (listing fee applies)</option>
        </select>
      </div>

      <div>
        <label htmlFor="req-algorithm" className="block text-sm font-medium text-gray-400">Algorithm</label>
        <select
          id="req-algorithm"
          value={ALGORITHM_OPTIONS.some((o) => o.value === algorithm) ? algorithm : '__other__'}
          onChange={(e) => setAlgorithm(e.target.value === '__other__' ? '' : e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white focus:border-accent-cyan/50 focus:outline-none"
        >
          <option value="">Select algorithm…</option>
          {ALGORITHM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          <option value="__other__">Other (custom)</option>
        </select>
        {!ALGORITHM_OPTIONS.some((o) => o.value === algorithm) && (
          <input
            type="text"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            placeholder="e.g. PoS + HotStuff BFT, or describe your consensus"
            required
            maxLength={256}
            className="mt-2 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
          />
        )}
        <p className="mt-1 text-xs text-gray-500">e.g. RandomX for mining, PoS for proof-of-stake.</p>
      </div>
      <div className="rounded-lg border border-white/10 bg-surface-850/50 p-4">
        <h4 className="text-sm font-medium text-gray-300">Mining pool (for PoW networks)</h4>
        <p className="mt-0.5 text-xs text-gray-500">Required for mineable chains. Omit for PoS/node-only networks.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="req-pool" className="block text-xs font-medium text-gray-500">Pool URL</label>
            <input
              id="req-pool"
              type="text"
              value={poolUrl}
              onChange={(e) => setPoolUrl(e.target.value)}
              placeholder="Pool hostname"
              maxLength={256}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="req-port" className="block text-xs font-medium text-gray-500">Pool port</label>
            <input
              id="req-port"
              type="number"
              value={poolPort}
              onChange={(e) => setPoolPort(e.target.value)}
              placeholder="3333"
              min={1}
              max={65535}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="req-website" className="block text-sm font-medium text-gray-400">Website (optional)</label>
          <input
            id="req-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
            maxLength={256}
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="req-reward" className="block text-sm font-medium text-gray-400">Reward rate (optional)</label>
          <input
            id="req-reward"
            type="text"
            value={rewardRate}
            onChange={(e) => setRewardRate(e.target.value)}
            placeholder="e.g. Variable, ~0.001/day"
            maxLength={128}
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="req-minpayout" className="block text-sm font-medium text-gray-400">Min. payout (optional)</label>
        <input
          id="req-minpayout"
          type="text"
          value={minPayout}
          onChange={(e) => setMinPayout(e.target.value)}
          placeholder="e.g. 0.01 XMR, N/A"
          maxLength={64}
          className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
        />
      </div>
      <div className="rounded-lg border border-white/10 bg-surface-850/50 p-4">
        <button
          type="button"
          onClick={() => setShowNodeSection(!showNodeSection)}
          className="flex w-full min-w-0 items-center justify-between gap-2 text-left text-sm font-medium text-gray-300"
        >
          <span className="min-w-0">Node support (optional)</span>
          <span className="text-gray-500">{showNodeSection ? '▼' : '▶'}</span>
        </button>
        <p className="mt-1 text-xs text-gray-500">
          Let users run your network&apos;s full node via the VibeMiner UI. Download URLs must be from allowed hosts (GitHub, official sites). Commands are validated for safety.
        </p>
        {showNodeSection && (
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="req-node-url" className="block text-xs font-medium text-gray-500">Node download URL (HTTPS)</label>
              <input
                id="req-node-url"
                type="url"
                value={nodeDownloadUrl}
                onChange={(e) => setNodeDownloadUrl(e.target.value)}
                placeholder="https://github.com/.../releases/..."
                maxLength={512}
                className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={useMultiPresets}
                onChange={() => {
                  if (!useMultiPresets) {
                    setUseMultiPresets(true);
                    if (nodeCommandTemplate.trim()) {
                      setPresetRows([
                        {
                          presetId: 'default',
                          label: 'Node',
                          description: '',
                          commandTemplate: nodeCommandTemplate,
                          nodeDiskGb,
                          nodeRamMb,
                        },
                      ]);
                    }
                  } else {
                    setUseMultiPresets(false);
                    const first = presetRows.find((r) => r.commandTemplate.trim());
                    if (first) {
                      setNodeCommandTemplate(first.commandTemplate);
                      setNodeDiskGb(first.nodeDiskGb);
                      setNodeRamMb(first.nodeRamMb);
                    }
                  }
                }}
                className="mt-1 rounded border-white/20"
              />
              <span>
                Offer multiple node modes (users pick e.g. full node vs validator). Up to 8 modes; each has its own command and optional resource hints.
              </span>
            </label>
            {useMultiPresets ? (
              <div className="space-y-4">
                {presetRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-white/10 bg-surface-900/80 p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-400">Node mode {idx + 1}</span>
                      {presetRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPresetRows((rows) => rows.filter((_, i) => i !== idx))}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs text-gray-500">Mode id (lowercase, hyphens)</label>
                        <input
                          type="text"
                          value={row.presetId}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPresetRows((rows) =>
                              rows.map((r, i) => (i === idx ? { ...r, presetId: v } : r))
                            );
                          }}
                          placeholder="e.g. full-node"
                          maxLength={48}
                          className="mt-1 w-full rounded border border-white/10 bg-surface-950 px-2 py-1.5 font-mono text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Label (shown in app)</label>
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPresetRows((rows) =>
                              rows.map((r, i) => (i === idx ? { ...r, label: v } : r))
                            );
                          }}
                          placeholder="e.g. Full node"
                          maxLength={80}
                          className="mt-1 w-full rounded border border-white/10 bg-surface-950 px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Description (optional)</label>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPresetRows((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, description: v } : r))
                          );
                        }}
                        placeholder="Short hint for users"
                        maxLength={256}
                        className="mt-1 w-full rounded border border-white/10 bg-surface-950 px-2 py-1.5 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">
                        Command ({`{dataDir}`} / {`{data_dir}`} = data path)
                      </label>
                      <input
                        type="text"
                        value={row.commandTemplate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPresetRows((rows) =>
                            rows.map((r, i) => (i === idx ? { ...r, commandTemplate: v } : r))
                          );
                        }}
                        placeholder="mychaind --data-dir {dataDir}"
                        maxLength={1024}
                        className="mt-1 w-full rounded border border-white/10 bg-surface-950 px-2 py-1.5 font-mono text-sm text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500">Disk (GB)</label>
                        <input
                          type="number"
                          value={row.nodeDiskGb}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPresetRows((rows) =>
                              rows.map((r, i) => (i === idx ? { ...r, nodeDiskGb: v } : r))
                            );
                          }}
                          min={1}
                          max={2000}
                          placeholder="optional"
                          className="mt-1 w-full rounded border border-white/10 bg-surface-950 px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">RAM (MB)</label>
                        <input
                          type="number"
                          value={row.nodeRamMb}
                          onChange={(e) => {
                            const v = e.target.value;
                            setPresetRows((rows) =>
                              rows.map((r, i) => (i === idx ? { ...r, nodeRamMb: v } : r))
                            );
                          }}
                          min={256}
                          max={65536}
                          placeholder="optional"
                          className="mt-1 w-full rounded border border-white/10 bg-surface-950 px-2 py-1.5 text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {presetRows.length < 8 && (
                  <button
                    type="button"
                    onClick={() => setPresetRows((rows) => [...rows, emptyPresetRow()])}
                    className="text-sm text-accent-cyan hover:underline"
                  >
                    + Add node mode
                  </button>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="req-node-cmd" className="block text-xs font-medium text-gray-500">Command template (use {`{dataDir}`} or {`{data_dir}`} for data path)</label>
                  <input
                    id="req-node-cmd"
                    type="text"
                    value={nodeCommandTemplate}
                    onChange={(e) => setNodeCommandTemplate(e.target.value)}
                    placeholder="monerod --data-dir {dataDir} --non-interactive"
                    maxLength={1024}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="req-node-disk" className="block text-xs font-medium text-gray-500">Disk (GB)</label>
                    <input
                      id="req-node-disk"
                      type="number"
                      value={nodeDiskGb}
                      onChange={(e) => setNodeDiskGb(e.target.value)}
                      placeholder="e.g. 50"
                      min={1}
                      max={2000}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="req-node-ram" className="block text-xs font-medium text-gray-500">RAM (MB)</label>
                    <input
                      id="req-node-ram"
                      type="number"
                      value={nodeRamMb}
                      onChange={(e) => setNodeRamMb(e.target.value)}
                      placeholder="e.g. 4096"
                      min={256}
                      max={65536}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label htmlFor="req-node-sha256" className="block text-xs font-medium text-gray-500">Binary SHA256 (optional, for integrity)</label>
              <input
                id="req-node-sha256"
                type="text"
                value={nodeBinarySha256}
                onChange={(e) => setNodeBinarySha256(e.target.value)}
                placeholder="64 hex chars"
                maxLength={64}
                className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="req-desc" className="block text-sm font-medium text-gray-400">Description (required)</label>
        <textarea
          id="req-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          minLength={20}
          maxLength={1024}
          placeholder="Describe your network and why miners would contribute (e.g. use case, rewards, testnet goals). Min. 20 characters."
          required
          className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">Helps miners discover and choose your network. 20–1024 characters.</p>
      </div>

      {editId && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h4 className="text-sm font-medium text-red-300">Delete listing</h4>
          <p className="mt-1 text-xs text-gray-500">
            Remove this network from VibeMiner. Uploaded logos are deleted from storage. You can submit a new listing later if you change your mind.
          </p>
          <button
            type="button"
            onClick={handleDeleteListing}
            disabled={deletePending || status === 'pending'}
            className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {deletePending ? 'Deleting…' : 'Delete this listing'}
          </button>
        </div>
      )}

      {!editId && requiresFee && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-200">
            Mainnet listing fee: <strong>{FEE_CONFIG.NETWORK_LISTING.amount}</strong>.{' '}
            <Link href="/fees" className="text-accent-cyan underline hover:no-underline">See fees</Link>.
          </p>
          <label className="mt-2 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={feeConfirmed}
              onChange={(e) => setFeeConfirmed(e.target.checked)}
              className="rounded border-white/20"
            />
            <span className="text-sm text-gray-400">I confirm I have paid (or will pay) the listing fee</span>
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'pending' || (!editId && requiresFee && !feeConfirmed)}
        className="rounded-xl bg-accent-cyan/20 px-6 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30 disabled:opacity-50"
      >
        {status === 'pending' ? (editId ? 'Saving…' : 'Submitting…') : (editId ? 'Save changes' : 'Submit (automated listing)')}
      </button>
    </motion.form>
  );
}
