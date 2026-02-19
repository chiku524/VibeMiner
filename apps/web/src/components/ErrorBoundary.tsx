'use client';

import React from 'react';
import Link from 'next/link';

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 px-4 py-12 text-center">
          <h1 className="font-display text-xl font-bold text-white">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-sm text-gray-400">
            An unexpected error occurred. Reload the page or go home to try again.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-accent-cyan px-6 py-2.5 font-medium text-surface-950 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-surface-950"
            >
              Reload
            </button>
            <Link
              href="/"
              className="rounded-xl border border-white/20 px-6 py-2.5 font-medium text-gray-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-surface-950"
            >
              Go home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
