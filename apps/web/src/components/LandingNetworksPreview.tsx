'use client';

import Link from 'next/link';
import { getMainnetNetworksListed } from '@vibeminer/shared';
import type { BlockchainNetwork } from '@vibeminer/shared';

const PREVIEW_COUNT = 4;

function MiniNetworkCard({ network }: { network: BlockchainNetwork }) {
  const isLive = network.status === 'live';
  return (
    <Link
      href={`/dashboard?env=mainnet&network=${network.id}`}
      className="block rounded-xl border border-white/5 bg-surface-900/50 p-4 transition hover:border-accent-cyan/20 hover:bg-surface-850/80"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-xl">
          {network.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white truncate">{network.name}</p>
          <p className="text-xs text-gray-500">{network.symbol} · {network.algorithm}</p>
        </div>
        {isLive && (
          <span className="shrink-0 rounded-full bg-accent-emerald/20 px-2 py-0.5 text-xs text-accent-emerald">
            Live
          </span>
        )}
      </div>
    </Link>
  );
}

export function LandingNetworksPreview() {
  const networks = getMainnetNetworksListed().slice(0, PREVIEW_COUNT);

  return (
    <section className="relative border-t border-white/5 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-center">
          Networks &amp; pools
        </h2>
        <p className="mt-2 text-gray-400 text-center max-w-2xl mx-auto">
          Mine on mainnet or devnet. We connect you to pools—no config. Browse all networks or learn how pools work.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {networks.map((network) => (
            <MiniNetworkCard key={network.id} network={network} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/networks"
            className="rounded-xl bg-accent-cyan/20 px-5 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
          >
            View all networks
          </Link>
          <Link
            href="/pools"
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/5"
          >
            Mining pools
          </Link>
        </div>
      </div>
    </section>
  );
}
