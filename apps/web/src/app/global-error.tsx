'use client';

import { useEffect } from 'react';

/**
 * Catches errors in the root layout so the app never shows a completely blank screen.
 * Must include its own <html> and <body> (Next.js requirement for global-error).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[VibeMiner] Global error:', error?.message ?? error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0f14] text-gray-100 font-sans antialiased flex flex-col items-center justify-center px-4 py-12">
        <span className="text-5xl opacity-30" aria-hidden="true">
          ◇
        </span>
        <h1 className="mt-6 text-xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-gray-400">
          The app ran into an error. Reload the page to continue.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#22d3ee] px-6 py-2.5 font-medium text-[#0c0e12] transition hover:brightness-110"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="rounded-xl border border-white/20 px-6 py-2.5 font-medium text-gray-200 transition hover:bg-white/10"
          >
            Go home
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-white/20 px-6 py-2.5 font-medium text-gray-200 transition hover:bg-white/10"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
