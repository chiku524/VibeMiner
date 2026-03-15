'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { FEE_CONFIG, ALGORITHM_OPTIONS } from '@vibeminer/shared';
import type { NetworkEnvironment } from '@vibeminer/shared';

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
};

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
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [icon, setIcon] = useState('⛓');
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
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name);
    setSymbol(initialData.symbol);
    setIcon(initialData.icon ?? '⛓');
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
    setShowNodeSection(!!(initialData.nodeDownloadUrl || initialData.nodeCommandTemplate));
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
    const iconTrim = icon.trim();
    if (!iconTrim) {
      setStatus('error');
      setErrorMsg('Please enter a network logo (emoji or icon character).');
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
    const hasNode = !!(nodeDownloadUrl.trim() && nodeCommandTemplate.trim());
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
    if (nodeDownloadUrl.trim() && nodeCommandTemplate.trim()) {
      payload.nodeDownloadUrl = nodeDownloadUrl.trim();
      payload.nodeCommandTemplate = nodeCommandTemplate.trim();
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
        <label htmlFor="req-icon" className="block text-sm font-medium text-gray-400">Network logo (required)</label>
        <input
          id="req-icon"
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          required
          maxLength={10}
          placeholder="e.g. ⛓ ◇ 🔷"
          className="mt-1 w-full max-w-[8rem] rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-2xl text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">Single emoji or icon character shown on your network card.</p>
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
          className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-300"
        >
          <span>Node support (optional)</span>
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
