'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopNav } from '@/components/DesktopNav';

/**
 * Renders only in the desktop app on "/".
 * Redirects to /login if not authenticated, or /home (dedicated home for both account types).
 * Shows DesktopNav + loading until redirect so the user never sees a blank screen.
 */
export function DesktopHomeGate() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace('/home');
  }, [loading, user, router]);

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <DesktopNav />
      <div className="flex min-h-[60vh] flex-col items-center justify-center pt-14">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
        <p className="mt-4 text-sm text-gray-400">Loading…</p>
      </div>
    </main>
  );
}
