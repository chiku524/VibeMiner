'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WebAppHeader } from '@/components/WebAppHeader';
import { MiningLoader } from '@/components/ui/MiningLoader';
import { RequestListingForm, type NetworkListingInitialData } from '@/components/RequestListingForm';
import type { NetworkEnvironment, NetworkNodePreset } from '@vibeminer/shared';

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
  nodePresets?: NetworkNodePreset[];
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
      .then((data: unknown) => {
        if (cancelled) return;
        const { networks = [] } = (data as { networks?: NetworkFromApi[] }) ?? {};
        const list = networks;
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
          nodePresets: net.nodePresets,
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
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
          <p className="text-gray-400">Sign in to edit your network.</p>
          <Link href="/login" className="mt-4 text-accent-cyan hover:underline">Sign in</Link>
        </div>
      </main>
    );
  }

  if (accountType !== 'network' && !loading) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
          <p className="text-gray-400">Only network accounts can edit listings.</p>
          <Link href="/dashboard" className="mt-4 text-accent-cyan hover:underline">Go to dashboard</Link>
        </div>
      </main>
    );
  }

  if (!id) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
          <p className="text-gray-400">No network specified.</p>
          <Link href="/dashboard/settings" className="mt-4 text-accent-cyan hover:underline">Back to settings</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <WebAppHeader
        homeHref="/"
        links={[{ href: '/dashboard/settings', label: '← Settings' }]}
      />
      <div className={`mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6 ${!isDesktop ? 'pb-8 pt-6' : 'pt-6 pb-8'}`}>
        <Breadcrumbs
          crumbs={[
            { label: 'Home', href: '/home' },
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
              <MiningLoader size="sm" />
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
