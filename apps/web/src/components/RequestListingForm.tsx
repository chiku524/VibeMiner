'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { FEE_CONFIG } from '@vibeminer/shared';
import type { NetworkEnvironment } from '@vibeminer/shared';

type RequestStatus = 'idle' | 'pending' | 'listed' | 'error';

function toNetworkId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'network';
}

export function RequestListingForm() {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [algorithm, setAlgorithm] = useState('');
  const [environment, setEnvironment] = useState<NetworkEnvironment>('devnet');
  const [poolUrl, setPoolUrl] = useState('');
  const [poolPort, setPoolPort] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [feeConfirmed, setFeeConfirmed] = useState(false);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addToast } = useToast();

  const isMainnet = environment === 'mainnet';
  const requiresFee = isMainnet && FEE_CONFIG.NETWORK_LISTING.devnetFree;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('pending');
    setErrorMsg(null);

    const baseId = toNetworkId(name);
    const desc = description.trim();
    const portNum = poolPort ? Number(poolPort) : undefined;
    if (desc.length < 20) {
      setStatus('error');
      setErrorMsg('Please provide a clear description of your network and its use case (at least 20 characters).');
      return;
    }
    if (!poolUrl.trim()) {
      setStatus('error');
      setErrorMsg('Pool URL is required so miners can connect to your network.');
      return;
    }
    if (portNum == null || portNum < 1 || portNum > 65535) {
      setStatus('error');
      setErrorMsg('Please enter a valid pool port (1–65535).');
      return;
    }

    const payload = {
      id: baseId,
      name,
      symbol,
      algorithm,
      environment,
      description: desc,
      icon: '⛓',
      poolUrl: poolUrl.trim(),
      poolPort: portNum,
      website: website || undefined,
      status: 'live',
      ...(requiresFee && { feeConfirmed }),
    };

    try {
      const res = await fetch('/api/networks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      addToast('Network listed automatically. No admin approval required.');
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
      <h3 className="font-display font-semibold text-white">Request listing</h3>
      <p className="text-sm text-gray-400">
        Automated onboarding—no admin approval. Submit valid chain details; your network is listed immediately after validation.
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
            placeholder="e.g. MYC"
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>
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
        <label htmlFor="req-algorithm" className="block text-sm font-medium text-gray-400">Mining algorithm</label>
        <input
          id="req-algorithm"
          type="text"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          required
          placeholder="e.g. SHA256, RandomX"
          className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="req-pool" className="block text-sm font-medium text-gray-400">Pool URL (required)</label>
          <input
            id="req-pool"
            type="text"
            value={poolUrl}
            onChange={(e) => setPoolUrl(e.target.value)}
            placeholder="pool.example.com"
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Miners connect here; required for listing.</p>
        </div>
        <div>
          <label htmlFor="req-port" className="block text-sm font-medium text-gray-400">Pool port (required)</label>
          <input
            id="req-port"
            type="number"
            value={poolPort}
            onChange={(e) => setPoolPort(e.target.value)}
            placeholder="3333"
            min={1}
            max={65535}
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="req-website" className="block text-sm font-medium text-gray-400">Website (optional)</label>
        <input
          id="req-website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="req-desc" className="block text-sm font-medium text-gray-400">Description (required)</label>
        <textarea
          id="req-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          minLength={20}
          placeholder="Describe your network and why miners would contribute (e.g. use case, rewards, testnet goals). Min. 20 characters."
          required
          className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-surface-850 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">Helps miners discover and choose your network. At least 20 characters.</p>
      </div>

      {requiresFee && (
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
        disabled={status === 'pending' || (requiresFee && !feeConfirmed)}
        className="rounded-xl bg-accent-cyan/20 px-6 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30 disabled:opacity-50"
      >
        {status === 'pending' ? 'Submitting…' : 'Submit (automated listing)'}
      </button>
    </motion.form>
  );
}
