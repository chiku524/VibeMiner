import { FEE_CONFIG, formatWithdrawalFee } from '@vibeminer/shared';
import { Nav } from '@/components/Nav';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { site } from '@/lib/site';
import { PLATFORM_WALLET } from '@/lib/platform-wallet';
import type { Metadata } from 'next';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Fees & transparency',
  description: 'Network listing fees and miner withdrawal fees. Transparent pricing. VibeMiner by nico.builds.',
  alternates: { canonical: `${base}/fees` },
  openGraph: { url: `${base}/fees`, title: 'Fees & transparency | VibeMiner', description: 'Transparent fees for network listings and miner withdrawals. No hidden charges.' },
};

const feesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the network listing fee?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `One-time fee of ${FEE_CONFIG.NETWORK_LISTING.amount} to list your blockchain on VibeMiner. Automated and decentralized—no admin approval. Devnet listings are free.`,
      },
    },
    {
      '@type': 'Question',
      name: 'What is the miner withdrawal fee?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Service fee of ${FEE_CONFIG.WITHDRAWAL.percent}% when you withdraw earnings to your wallet. ${FEE_CONFIG.WITHDRAWAL.description}`,
      },
    },
    {
      '@type': 'Question',
      name: 'How does VibeMiner use fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Fees cover infrastructure, pool connectivity, and platform maintenance. No hidden charges.',
      },
    },
  ],
};

export default function FeesPage() {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(feesJsonLd) }} />
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

          <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
            <h2 className="font-display text-xl font-semibold text-white">Where fees are sent</h2>
            <p className="mt-2 text-gray-400">
              Listing fees (mainnet) and withdrawal fees are sent to the VibeMiner platform wallet below. You can verify payouts on-chain.
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">ETH</span>
                <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.ETH}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">SOL</span>
                <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.SOL}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">DOGE (xpub)</span>
                <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.DOGE_XPUB}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">BTC (xpub)</span>
                <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.BTC_XPUB}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-surface-900/50 px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">LTC (xpub)</span>
                <p className="mt-1 font-mono text-sm break-all text-gray-300">{PLATFORM_WALLET.LTC_XPUB}</p>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-12 text-center text-sm text-gray-600">
          Questions? <a href="mailto:support@vibeminer.tech" className="text-accent-cyan hover:underline">support@vibeminer.tech</a>
        </p>
      </div>
    </main>
  );
}
