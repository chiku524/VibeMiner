'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Renders only in the desktop app on "/".
 * Redirects to /login if not authenticated, or /dashboard (miner) / /dashboard/network (network) if authenticated.
 * Shows a loading spinner until redirect. Never renders the landing page.
 */
export function DesktopHomeGate() {
  const router = useRouter();
  const { user, accountType, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (accountType === 'network') {
      router.replace('/dashboard/network');
      return;
    }
    router.replace('/dashboard');
  }, [loading, user, accountType, router]);

  return (
    <main className="min-h-screen bg-surface-950 bg-grid flex flex-col items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      <p className="mt-4 text-sm text-gray-400">Loading…</p>
    </main>
  );
}
