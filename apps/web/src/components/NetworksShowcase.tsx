'use client';

import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { getMainnetNetworks, getDevnetNetworks } from '@vibeminer/shared';
import type { BlockchainNetwork } from '@vibeminer/shared';

function filterNetworks(networks: BlockchainNetwork[], query: string): BlockchainNetwork[] {
  if (!query.trim()) return networks;
  const q = query.toLowerCase();
  return networks.filter(
    (n) =>
      n.name.toLowerCase().includes(q) ||
      n.symbol.toLowerCase().includes(q) ||
      n.algorithm.toLowerCase().includes(q)
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function NetworkCard({ network }: { network: BlockchainNetwork }) {
  const isLive = network.status === 'live';
  const isRequest = network.status === 'requested';
  const isDevnet = network.environment === 'devnet';

  return (
    <motion.article
      variants={item}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-surface-900/50 p-6 transition hover:border-accent-cyan/20 hover:bg-surface-850/80"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl">
            {network.icon}
          </span>
          <div>
            <h3 className="font-display font-semibold text-white">{network.name}</h3>
            <p className="text-sm text-gray-500">
              {network.symbol} · {network.algorithm}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isDevnet && (
            <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-300">
              Devnet
            </span>
          )}
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isLive
                ? 'bg-accent-emerald/20 text-accent-emerald'
                : isRequest
                  ? 'bg-accent-amber/20 text-accent-amber'
                  : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {network.status === 'live'
              ? 'Live'
              : network.status === 'coming-soon'
                ? 'Soon'
                : 'Request service'}
          </span>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-gray-400">{network.description}</p>
      {network.rewardRate && (
        <p className="mt-2 font-mono text-xs text-accent-cyan">{network.rewardRate}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {isLive && (
          <Link
            href={`/dashboard?env=${network.environment}&network=${network.id}`}
            className="rounded-lg bg-accent-cyan/20 px-3 py-1.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
          >
            Mine
          </Link>
        )}
        {network.website && (
          <a
            href={network.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-400 transition hover:border-white/20 hover:text-white"
          >
            Website
          </a>
        )}
        {isRequest && (
          <Link
            href="/#request-service"
            className="rounded-lg bg-accent-amber/20 px-3 py-1.5 text-sm font-medium text-accent-amber transition hover:bg-accent-amber/30"
          >
            Request service
          </Link>
        )}
      </div>
    </motion.article>
  );
}

function NetworkGrid({
  networks,
  title,
  subtitle,
  id,
  searchQuery,
  onClearSearch,
  reducedMotion,
}: {
  networks: BlockchainNetwork[];
  title: string;
  subtitle: string;
  id: string;
  searchQuery?: string;
  onClearSearch?: () => void;
  reducedMotion?: boolean;
}) {
  const isEmpty = networks.length === 0;
  const hasSearch = !!searchQuery?.trim();
  const reduced = reducedMotion ?? false;

  return (
    <div id={id} className="scroll-mt-24">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: reduced ? 0 : 0.35 }}
        className="mb-8"
      >
        <h3 className="font-display text-2xl font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-gray-400">{subtitle}</p>
      </motion.div>
      {isEmpty && hasSearch ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-white/5 bg-surface-900/30 py-12 text-center"
        >
          <p className="text-sm font-medium text-gray-400">No {title.toLowerCase()} networks match &quot;{searchQuery}&quot;</p>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-white/20 hover:text-white"
            >
              Clear search
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {networks.map((network) => (
            <NetworkCard key={`${network.environment}-${network.id}`} network={network} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function NetworksShowcase() {
  const reduced = useReducedMotion() ?? false;
  const [searchQuery, setSearchQuery] = useState('');
  const mainnetNetworks = useMemo(() => getMainnetNetworks(), []);
  const devnetNetworks = useMemo(() => getDevnetNetworks(), []);
  const filteredMainnet = useMemo(() => filterNetworks(mainnetNetworks, searchQuery), [mainnetNetworks, searchQuery]);
  const filteredDevnet = useMemo(() => filterNetworks(devnetNetworks, searchQuery), [devnetNetworks, searchQuery]);

  return (
    <section id="networks" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: reduced ? 0 : 0.4 }}
          className="mb-8 text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Networks requesting our service
          </h2>
          <p className="mt-3 text-gray-400">
            Mainnet for production mining and sync; devnet for testing. Pick one and start.
          </p>
        </motion.div>
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          className="mb-12"
        >
          <input
            type="search"
            placeholder="Search networks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mx-auto block w-full max-w-md rounded-xl border border-white/10 bg-surface-900/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/50"
            aria-label="Search networks"
          />
        </motion.div>

        <NetworkGrid
          id="mainnet"
          title="Mainnet"
          subtitle="Production networks. Miners and chains stay in sync here. Real rewards."
          networks={filteredMainnet}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          reducedMotion={reduced}
        />

        <div className="mt-16 border-t border-white/5 pt-16">
          <NetworkGrid
            id="devnet"
            title="Devnet"
            subtitle="Test networks for integration and validation. No real value—for developers and networks testing our service."
            networks={filteredDevnet}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            reducedMotion={reduced}
          />
        </div>
      </div>
    </section>
  );
}
