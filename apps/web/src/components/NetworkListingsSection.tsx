'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NetworkMark } from '@/components/ui/NetworkMark';
import { useToast } from '@/contexts/ToastContext';

type NetworkSummary = {
  id: string;
  name: string;
  symbol: string;
  algorithm: string;
  environment: string;
  status: string;
  icon?: string;
  description?: string;
  listedAt?: string;
};

export function NetworkListingsSection() {
  const [networks, setNetworks] = useState<NetworkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/networks/my', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: unknown) => {
        const list = (data as { networks?: NetworkSummary[] })?.networks;
        if (!cancelled && Array.isArray(list)) {
          setNetworks(list);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your networks.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleDelete(n: NetworkSummary) {
    if (!window.confirm(`Delete "${n.name}" from VibeMiner? This cannot be undone.`)) {
      return;
    }
    setDeletingId(n.id);
    try {
      const res = await fetch(`/api/networks/${encodeURIComponent(n.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        addToast(data.error ?? 'Could not delete listing', 'error');
        return;
      }
      addToast('Listing deleted', 'info');
      setNetworks((prev) => prev.filter((x) => x.id !== n.id));
    } catch {
      addToast('Could not delete listing', 'error');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-900/30 p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-lg bg-white/5" />
          <div className="h-16 animate-pulse rounded-lg bg-white/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
    );
  }

  if (networks.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-surface-900/30 p-6">
        <p className="text-sm text-gray-400">You haven’t listed any networks yet.</p>
        <Link
          href="/dashboard/network"
          className="mt-3 inline-block text-sm font-medium text-accent-cyan hover:underline"
        >
          Request a listing →
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {networks.map((n) => (
        <li key={n.id}>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-surface-900/30 p-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
              <NetworkMark
                icon={n.icon ?? '⛓'}
                label={n.name}
                className="h-10 w-10 rounded-lg bg-white/5 text-xl"
              />
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{n.name}</p>
                <p className="text-xs text-gray-500 truncate">{n.symbol} · {n.algorithm}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                n.status === 'live' ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {n.status === 'live' ? 'Live' : n.status}
              </span>
              {n.environment === 'devnet' && (
                <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">
                  Devnet
                </span>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/network/edit?id=${encodeURIComponent(n.id)}`}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(n)}
                disabled={deletingId === n.id}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                {deletingId === n.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
