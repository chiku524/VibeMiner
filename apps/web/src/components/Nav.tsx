'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function Nav() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span className="text-2xl">◇</span>
          <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
            Vibe Mine
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/#networks"
            className="text-sm font-medium text-gray-400 transition hover:text-white"
          >
            Networks
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-gray-400 transition hover:text-white"
          >
            How it works
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent-cyan/20 px-4 py-2 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
          >
            Start mining
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
