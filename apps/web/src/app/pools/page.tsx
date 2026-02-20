import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { site } from '@/lib/site';
import type { Metadata } from 'next';

const base = site.baseUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Mining pools',
  description: 'How VibeMiner connects you to mining pools. One-click mining, no config. Start from the dashboard.',
  alternates: { canonical: `${base}/pools` },
};

export default function PoolsPage() {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <Nav />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Breadcrumbs crumbs={[{ label: 'Home', href: '/' }, { label: 'Mining pools' }]} />
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white">
          Mining pools
        </h1>
        <p className="mt-2 text-gray-400">
          We connect you to established pools for each network. No config files—just choose a network and start.
        </p>

        <div className="mt-12 space-y-8">
          <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
            <h2 className="font-display text-xl font-semibold text-white">How it works</h2>
            <p className="mt-2 text-gray-400">
              Each supported network uses one or more mining pools. When you start mining from the dashboard, we connect your session to the right pool for that network. Your hashrate contributes to the pool; rewards are credited to your in-platform balance and you can withdraw to your wallet when you hit the minimum payout.
            </p>
          </section>

          <section className="rounded-2xl border border-white/5 bg-surface-900/30 p-6">
            <h2 className="font-display text-xl font-semibold text-white">Networks & pools</h2>
            <p className="mt-2 text-gray-400">
              Mainnet and devnet networks are listed on the <Link href="/networks" className="text-accent-cyan hover:underline">Networks</Link> page. From there you can go straight to the dashboard to mine. Pool details (e.g. pool URL, port) are managed per network—you don’t need to configure them.
            </p>
          </section>

          <section className="rounded-2xl border border-accent-cyan/20 bg-accent-cyan/5 p-6">
            <h2 className="font-display text-xl font-semibold text-white">Start mining</h2>
            <p className="mt-2 text-gray-400">
              Sign in and open your miner dashboard. Choose a network and click start. The app handles the rest.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-xl bg-accent-cyan/20 px-5 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
            >
              Go to dashboard →
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
