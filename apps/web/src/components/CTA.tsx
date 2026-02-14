'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function CTA() {
  return (
    <section id="request-service" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-accent-cyan/20 bg-gradient-to-b from-accent-cyan/10 to-transparent p-12"
        >
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Ready to mine without the terminal?
          </h2>
          <p className="mt-3 text-gray-400">
            Start contributing hashrate in one click. Available on web and desktop.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-xl bg-accent-cyan px-8 py-3 font-medium text-surface-950 transition hover:brightness-110"
          >
            Open dashboard
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
