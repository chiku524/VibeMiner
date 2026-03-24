'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MiningLoader } from '@/components/ui/MiningLoader';

/**
 * Renders only in the desktop app on "/".
 * Redirects to /login if not authenticated, or /home (dedicated home for both account types).
 * DesktopShell provides the sidebar; this is just the loading/redirect content.
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center pt-6">
        <MiningLoader size="md" label="Loading…" />
      </div>
    </main>
  );
}
