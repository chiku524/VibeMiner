'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Nav } from '@/components/Nav';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const steps = [
  {
    step: 1,
    title: 'Sign in',
    body: 'Create an account or sign in. Your session is tied to your account so your mining activity and preferences stay in sync across the web app and desktop app.',
  },
  {
    step: 2,
    title: 'Choose Mainnet or Devnet',
    body: 'Pick whether you want to mine on production networks (mainnet) or test networks (devnet). Devnet is ideal for trying things out or contributing to incentivized testnets like Boing.',
  },
  {
    step: 3,
    title: 'Select a network and click Start',
    body: 'Browse the list and click Start. For mineable (PoW) networks, we connect you to the pool. For node-only (PoS) networks, we download and run the node binary. No config files, no terminal—we manage the session.',
  },
  {
    step: 4,
    title: 'Track your session',
    body: 'While mining, you see hashrate, uptime, shares, and estimated earnings. You can add an optional payout address in the panel. When you\'re done, click Stop to end the session.',
  },
  {
    step: 5,
    title: 'Withdraw when ready',
    body: 'When your balance reaches the network\'s minimum payout, you can withdraw to your wallet. A small service fee applies to withdrawals—see the Fees page for full details. You control the payout address; we never hold your private keys.',
  },
];

export function HowMiningWorksContent() {
  const isDesktop = useIsDesktop();
  const homeHref = '/home';

  const reduced = useReducedMotion() ?? false;

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <Nav />
      <div className={`mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6 ${!isDesktop ? 'pt-14 py-16' : 'py-12'}`}>
        <Breadcrumbs
          crumbs={[
            { label: 'Home', href: homeHref },
            { label: 'How it works' },
          ]}
        />
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-6"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How mining &amp; nodes work
          </h1>
          <p className="mt-3 text-lg text-gray-400">
            Mine PoW networks or run PoS nodes—no terminal. Choose a network, click Start, and we handle the rest. Here&apos;s the full flow and how we keep your account secure.
          </p>
        </motion.div>

        <div className="mt-12 space-y-10">
          {steps.map((s, i) => (
            <motion.section
              key={s.step}
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-2xl border border-white/5 bg-surface-900/30 p-6 sm:p-8"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-cyan/20 font-mono text-lg font-bold text-accent-cyan">
                {s.step}
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold text-white">{s.title}</h2>
              <p className="mt-2 text-gray-400 leading-relaxed">{s.body}</p>
            </motion.section>
          ))}
        </div>

        <motion.section
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 rounded-2xl border border-accent-cyan/20 bg-accent-cyan/5 p-6 sm:p-8"
        >
          <h2 className="font-display text-xl font-semibold text-white">Security &amp; privacy</h2>
          <ul className="mt-4 space-y-3 text-gray-400">
            <li className="flex gap-3">
              <span className="text-accent-cyan" aria-hidden>✓</span>
              <span><strong className="text-gray-300">No wallet keys.</strong> We never ask for or store your private keys. You provide a payout address when you want to withdraw; funds go directly to you.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-cyan" aria-hidden>✓</span>
              <span><strong className="text-gray-300">Secure sign-in.</strong> Passwords are hashed with industry-standard algorithms. Sessions use HttpOnly, Secure cookies and expire after a period of inactivity.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-cyan" aria-hidden>✓</span>
              <span><strong className="text-gray-300">Transparent fees.</strong> All fees (e.g. withdrawal fee) are disclosed before you commit. See the <Link href="/fees" className="text-accent-cyan hover:underline">Fees &amp; transparency</Link> page.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-cyan" aria-hidden>✓</span>
              <span><strong className="text-gray-300">Desktop app.</strong> The desktop app runs the same web app in a secure shell. Updates are delivered in-app; we don&apos;t run arbitrary code from the internet.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-cyan" aria-hidden>✓</span>
              <span><strong className="text-gray-300">Node downloads.</strong> When running nodes, we only fetch binaries from allowlisted hosts (e.g. GitHub releases). Optional SHA256 verification ensures integrity.</span>
            </li>
          </ul>
        </motion.section>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-accent-cyan px-6 py-3 font-medium text-surface-950 transition hover:brightness-110"
          >
            Open dashboard
          </Link>
          <Link
            href="/networks"
            className="rounded-xl border border-white/10 px-6 py-3 font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/5"
          >
            Browse networks
          </Link>
          <Link
            href="/pools"
            className="rounded-xl border border-white/10 px-6 py-3 font-medium text-gray-400 transition hover:border-white/20 hover:text-white"
          >
            How pools work
          </Link>
          <Link
            href="/fees"
            className="rounded-xl border border-white/10 px-6 py-3 font-medium text-gray-400 transition hover:border-white/20 hover:text-white"
          >
            Fees
          </Link>
        </div>
      </div>
    </main>
  );
}
