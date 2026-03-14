'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DesktopNav } from '@/components/DesktopNav';
import { RequestListingForm, type NetworkListingInitialData } from '@/components/RequestListingForm';
import type { NetworkEnvironment } from '@vibeminer/shared';

type NetworkFromApi = {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
  algorithm: string;
  environment: string;
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

export default function EditNetworkPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isDesktop = useIsDesktop();
  const { user, accountType, loading } = useAuth();
  const [initialData, setInitialData] = useState<NetworkListingInitialData | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user || accountType !== 'network') return;
    let cancelled = false;
    fetch('/api/networks/my', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: { networks?: NetworkFromApi[] }) => {
        if (cancelled) return;
        const list = data.networks ?? [];
        const net = list.find((n) => n.id === id);
        if (!net) {
          setInitialData(null);
          setError('Network not found or you do not have permission to edit it.');
          return;
        }
        setInitialData({
          id: net.id,
          name: net.name,
          symbol: net.symbol,
          icon: net.icon,
          algorithm: net.algorithm,
          environment: net.environment as NetworkEnvironment,
          description: net.description,
          poolUrl: net.poolUrl,
          poolPort: net.poolPort,
          website: net.website,
          rewardRate: net.rewardRate,
          minPayout: net.minPayout,
          nodeDownloadUrl: net.nodeDownloadUrl,
          nodeCommandTemplate: net.nodeCommandTemplate,
          nodeDiskGb: net.nodeDiskGb,
          nodeRamMb: net.nodeRamMb,
          nodeBinarySha256: net.nodeBinarySha256,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setInitialData(null);
          setError('Could not load network.');
        }
      });
    return () => { cancelled = true; };
  }, [id, user, accountType]);

  if (!user && !loading) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        {isDesktop && <DesktopNav />}
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${isDesktop ? 'pt-14' : ''}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <p className="text-gray-400">Sign in to edit your network.</p>
          <Link href="/login" className="mt-4 text-accent-cyan hover:underline">Sign in</Link>
        </div>
      </main>
    );
  }

  if (accountType !== 'network' && !loading) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        {isDesktop && <DesktopNav />}
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${isDesktop ? 'pt-14' : ''}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <p className="text-gray-400">Only network accounts can edit listings.</p>
          <Link href="/dashboard" className="mt-4 text-accent-cyan hover:underline">Go to dashboard</Link>
        </div>
      </main>
    );
  }

  if (!id) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        {isDesktop && <DesktopNav />}
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${isDesktop ? 'pt-14' : ''}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <p className="text-gray-400">No network specified.</p>
          <Link href="/dashboard/settings" className="mt-4 text-accent-cyan hover:underline">Back to settings</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      {isDesktop ? <DesktopNav /> : (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="text-xl" aria-hidden="true">◇</span>
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">VibeMiner</span>
            </Link>
            <Link href="/dashboard/settings" className="text-sm text-gray-400 transition hover:text-white">← Settings</Link>
          </div>
        </header>
      )}
      <div className={`mx-auto max-w-3xl px-4 sm:px-6 ${isDesktop ? 'pt-14 pb-8' : 'py-8'}`}>
        <Breadcrumbs
          crumbs={[
            { label: 'Home', href: isDesktop ? '/app' : '/' },
            { label: 'Network dashboard', href: '/dashboard/network' },
            { label: 'Edit listing' },
          ]}
        />
        <div className="mt-6">
          <Link href="/dashboard/settings" className="text-sm text-gray-400 hover:text-white">← Back to your listed networks</Link>
          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>
          )}
          {initialData === undefined && (
            <div className="mt-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
            </div>
          )}
          {initialData !== undefined && initialData !== null && (
            <div className="mt-6">
              <RequestListingForm editId={id} initialData={initialData} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
