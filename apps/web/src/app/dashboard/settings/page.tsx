'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DesktopAppSettings } from '@/components/DesktopAppSettings';

export default function SettingsPage() {
  const isDesktop = useIsDesktop();
  const { user, accountType, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!loading && user && accountType === 'network') {
      router.replace('/dashboard/network');
    }
  }, [loading, user, accountType, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      </main>
    );
  }

  if (accountType === 'network') {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
        <p className="mt-4 text-sm text-gray-400">Redirecting…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={isDesktop ? '/app' : '/'} className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="text-xl" aria-hidden="true">◇</span>
            <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
              VibeMiner
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-400 transition hover:text-white">
              Dashboard
            </Link>
            <Link href={isDesktop ? '/app' : '/'} className="text-sm text-gray-400 transition hover:text-white">
              {isDesktop ? '← App home' : '← Back home'}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Breadcrumbs
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Settings' },
          ]}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">User settings</h1>
          <p className="mt-1 text-gray-400">
            Manage desktop app and other preferences.
          </p>

          <div className="mt-10 space-y-8">
            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-3">Desktop app</h2>
              <DesktopAppSettings />
              <p className="mt-2 text-xs text-gray-500">
                These options only apply when you’re using the VibeMiner desktop app. In the browser they are hidden.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
