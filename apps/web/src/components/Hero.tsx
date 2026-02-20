'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { site } from '@/lib/site';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const reducedTransition = { duration: 0 };

export function Hero() {
  const reduced = useReducedMotion() ?? false;
  const isDesktop = useIsDesktop();
  const t = reduced ? reducedTransition : { duration: 0.6 };
  const tDelay = (d: number) => (reduced ? reducedTransition : { delay: d, duration: 0.5 });

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-16">
      <div className="absolute inset-0 bg-gradient-radial from-accent-cyan/10 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent" />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={t}
        className="relative max-w-3xl text-center"
      >
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={tDelay(0.2)}
          className="mb-4 font-mono text-sm uppercase tracking-widest text-accent-cyan"
        >
          {site.slogan}
        </motion.p>
        <motion.h1
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tDelay(0.3)}
          className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          Mine for networks that{' '}
          <span className="bg-gradient-to-r from-accent-cyan via-emerald-400 to-accent-amber bg-clip-text text-transparent">
            need you
          </span>
        </motion.h1>
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={tDelay(0.5)}
          className="mt-6 text-lg text-gray-400"
        >
          No terminal, no config files. Choose a blockchain, click start, and contribute hashrate
          with a modern, seamless experience—on desktop or web.
        </motion.p>
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tDelay(0.7)}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {!isDesktop && (
            <Link
              href="/download"
              className="inline-flex rounded-xl border border-white/10 px-6 py-3 font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-surface-950"
            >
              Download desktop
            </Link>
          )}
          <Link
            href="/register"
            className="inline-flex rounded-xl border border-accent-amber/30 px-6 py-3 font-medium text-accent-amber/90 transition hover:bg-accent-amber/10 focus:outline-none focus:ring-2 focus:ring-accent-amber/50 focus:ring-offset-2 focus:ring-offset-surface-950"
          >
            Register your blockchain
          </Link>
        </motion.div>
      </motion.div>
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduced ? reducedTransition : { delay: 1, duration: 0.5 }}
        className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-500"
      >
        <span>✓ No terminal</span>
        <span>✓ One-click start</span>
        <span>✓ Web & desktop</span>
        <span>✓ Windows · macOS · Linux</span>
      </motion.div>
    </section>
  );
}
