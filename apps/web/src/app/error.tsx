'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[VibeMiner] Route error:', error?.message ?? error);
  }, [error]);

  const isDesktop =
    typeof window !== 'undefined' &&
    (window as unknown as { desktopAPI?: { isDesktop?: boolean } }).desktopAPI?.isDesktop;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-950 bg-grid px-4 py-12">
      <BrandMark className="h-16 w-16 shrink-0 opacity-30" />
      <h1 className="mt-6 font-display text-xl font-bold text-white">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-gray-400">
        This page ran into an error. Reload or go home to continue.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-accent-cyan px-6 py-2.5 font-medium text-surface-950 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          Try again
        </button>
        <Link
          href={isDesktop ? '/app' : '/'}
          className="rounded-xl border border-white/20 px-6 py-2.5 font-medium text-gray-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {isDesktop ? 'App launcher' : 'Go home'}
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl border border-white/20 px-6 py-2.5 font-medium text-gray-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          Reload app
        </button>
      </div>
    </main>
  );
}
