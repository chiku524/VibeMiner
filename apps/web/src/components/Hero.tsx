'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-16">
      <div className="absolute inset-0 bg-gradient-radial from-accent-cyan/10 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl text-center"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 font-mono text-sm uppercase tracking-widest text-accent-cyan"
        >
          Decentralized mining, simplified
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          Mine for networks that{' '}
          <span className="bg-gradient-to-r from-accent-cyan via-emerald-400 to-accent-amber bg-clip-text text-transparent">
            need you
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-lg text-gray-400"
        >
          No terminal, no config files. Choose a blockchain, click start, and contribute hashrate
          with a modern, seamless experience—on desktop or web.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="group relative overflow-hidden rounded-xl bg-accent-cyan px-6 py-3 font-medium text-surface-950 transition hover:brightness-110"
          >
            <span className="relative z-10">Start mining</span>
            <motion.span
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
          </Link>
          <Link
            href="/#networks"
            className="rounded-xl border border-white/10 px-6 py-3 font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/5"
          >
            View networks
          </Link>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="mt-16 flex gap-8 text-sm text-gray-500"
      >
        <span>✓ No terminal</span>
        <span>✓ One-click start</span>
        <span>✓ Web & desktop</span>
      </motion.div>
    </section>
  );
}
