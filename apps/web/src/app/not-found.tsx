'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-950 bg-grid px-4">
      <span className="text-6xl opacity-30" aria-hidden="true">◇</span>
      <h1 className="mt-6 font-display text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-center text-gray-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/home"
          className="rounded-xl bg-accent-cyan/20 px-6 py-2.5 text-sm font-medium text-accent-cyan transition hover:bg-accent-cyan/30"
        >
          Home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/5"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
