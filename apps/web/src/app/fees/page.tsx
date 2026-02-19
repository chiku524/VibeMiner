import { FEE_CONFIG, formatWithdrawalFee } from '@vibeminer/shared';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata = {
  title: 'Fees & transparency',
  description: 'Network listing fees and miner withdrawal fees. Transparent pricing. VibeMiner by nico.builds.',
};

export default function FeesPage() {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <Nav />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Breadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Fees & transparency' }]} />
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white">
          Fees & transparency
        </h1>
        <p className="mt-2 text-gray-400">
          All fees are transparent and disclosed before you commit.
        </p>

        <div className="mt-12 space-y-10">
          <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
            <h2 className="font-display text-xl font-semibold text-white">Network listing (blockchains)</h2>
            <p className="mt-2 text-gray-400">
              One-time fee to list your blockchain on VibeMiner. <strong className="text-white">Automated and decentralized</strong>—no admin approval.
            </p>
            <div className="mt-4 rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 px-4 py-3">
              <p className="font-mono text-lg font-medium text-accent-cyan">
                {FEE_CONFIG.NETWORK_LISTING.amount}
              </p>
              <p className="mt-1 text-sm text-gray-400">{FEE_CONFIG.NETWORK_LISTING.description}</p>
              {FEE_CONFIG.NETWORK_LISTING.devnetFree && (
                <p className="mt-2 text-sm text-accent-emerald">Devnet listings are free.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
            <h2 className="font-display text-xl font-semibold text-white">Withdrawal fee (miners)</h2>
            <p className="mt-2 text-gray-400">
              Service fee when you withdraw earnings to your wallet.
            </p>
            <div className="mt-4 rounded-lg border border-accent-amber/20 bg-accent-amber/5 px-4 py-3">
              <p className="font-mono text-lg font-medium text-accent-amber">
                {FEE_CONFIG.WITHDRAWAL.percent}%
              </p>
              <p className="mt-1 text-sm text-gray-400">{FEE_CONFIG.WITHDRAWAL.description}</p>
              <p className="mt-2 text-sm text-gray-500">{formatWithdrawalFee()}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
            <h2 className="font-display text-xl font-semibold text-white">How we use fees</h2>
            <p className="mt-2 text-gray-400">
              Fees cover infrastructure, pool connectivity, and platform maintenance. No hidden charges.
            </p>
          </section>
        </div>

        <p className="mt-12 text-center text-sm text-gray-600">
          Questions? <a href="mailto:support@vibeminer.tech" className="text-accent-cyan hover:underline">support@vibeminer.tech</a>
        </p>
      </div>
    </main>
  );
}
