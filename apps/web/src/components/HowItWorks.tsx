'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    step: '1',
    title: 'Choose a network',
    description: 'Browse networks that need hashrate. Each card shows algorithm, rewards, and status.',
  },
  {
    step: '2',
    title: 'Start mining',
    description: 'Click start—no config files or terminal. We connect you to the pool and manage the session.',
  },
  {
    step: '3',
    title: 'Earn & withdraw',
    description: 'Track hashrate and estimated earnings. Withdraw when you hit the minimum payout.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-gray-400">
            Three steps to contributing to decentralized networks.
          </p>
        </motion.div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-white/5 bg-surface-900/30 p-8"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-cyan/20 font-mono text-lg font-bold text-accent-cyan">
                {s.step}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-gray-400">{s.description}</p>
              {i < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-gray-600 md:block">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
