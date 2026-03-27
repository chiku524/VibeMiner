'use client';

import Link from 'next/link';
import { getMainnetNetworksListed, getDevnetNetworks } from '@vibeminer/shared';
import type { BlockchainNetwork } from '@vibeminer/shared';
import { NetworkMark } from '@/components/ui/NetworkMark';

const PREVIEW_COUNT = 4;

function MiniNetworkCard({ network, env }: { network: BlockchainNetwork; env: 'mainnet' | 'devnet' }) {
  const isLive = network.status === 'live';
  return (
    <Link
      href={`/dashboard/mining?env=${env}&network=${network.id}`}
      className="block rounded-xl border border-white/5 bg-surface-900/50 p-4 transition hover:border-accent-cyan/20 hover:bg-surface-850/80"
    >
      <div className="flex items-center gap-3">
        <NetworkMark
          icon={network.icon}
          label={network.name}
          className="h-10 w-10 rounded-lg bg-white/5 text-xl"
        />
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
  const mainnet = getMainnetNetworksListed().slice(0, PREVIEW_COUNT);
  const boing = getDevnetNetworks().find((n) => n.id === 'boing-devnet');

  return (
    <section className="relative border-t border-white/5 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-center">
          Networks &amp; pools
        </h2>
        <p className="mt-2 text-gray-400 text-center max-w-2xl mx-auto">
          Mine PoW networks or run PoS nodes—mainnet and devnet. One click, no config. Browse networks or learn how pools work.
        </p>
        {boing && (
          <div className="mt-8 mx-auto max-w-xl rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <p className="text-sm text-amber-200 font-medium">Incentivized testnet</p>
            <p className="mt-0.5 text-xs text-gray-400">Try Boing: run a validator or full node with one click.</p>
            <Link
              href="/dashboard/nodes?env=devnet&network=boing-devnet"
              className="mt-3 inline-block rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/30"
            >
              Start Boing testnet →
            </Link>
          </div>
        )}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mainnet.map((network) => (
            <MiniNetworkCard key={network.id} network={network} env="mainnet" />
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
