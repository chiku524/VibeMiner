'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const STORAGE_KEY = 'vibeminer-mining-wallet';

export function getMiningWallet(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setMiningWallet(value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value.trim());
  } catch {}
}

export function MiningWalletSettings() {
  const { addToast } = useToast();
  const isDesktop = useIsDesktop();
  const [wallet, setWallet] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) setWallet(getMiningWallet());
  }, [mounted]);

  const handleSave = () => {
    const trimmed = wallet.trim();
    setMiningWallet(trimmed);
    addToast(trimmed ? 'Mining wallet saved' : 'Mining wallet cleared', 'success');
  };

  if (!mounted) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-surface-900/30 px-4 py-4">
      <h3 className="font-display text-base font-semibold text-white">Mining payout address</h3>
      <p className="mt-1 text-xs text-gray-500">
        {isDesktop
          ? 'Used for real mining payouts on mainnet and devnet. Enter your wallet address before starting mining.'
          : 'Set your wallet for real mining when using the desktop app.'}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          onBlur={handleSave}
          placeholder="Your mining wallet address"
          className="flex-1 rounded-lg border border-white/10 bg-surface-850/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
          aria-label="Mining payout wallet address"
        />
        <button
          type="button"
          onClick={handleSave}
          className="shrink-0 rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-4 py-2 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/20"
        >
          Save
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Address must match the network (Monero, Raptoreum, etc.). Stored locally, never sent to our servers.
      </p>
    </div>
  );
}
