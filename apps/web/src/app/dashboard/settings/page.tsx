'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDesktopCheck } from '@/hooks/useIsDesktop';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DesktopAppSettings } from '@/components/DesktopAppSettings';
import { MiningWalletSettings } from '@/components/MiningWalletSettings';
import { NetworkListingsSection } from '@/components/NetworkListingsSection';
import { ProfileSettings } from '@/components/ProfileSettings';
import { BrandMark } from '@/components/BrandMark';
import { MiningLoader } from '@/components/ui/MiningLoader';

const AUTH_LOAD_TIMEOUT_MS = 6000;

export default function SettingsPage() {
  const { isDesktop, hasChecked } = useDesktopCheck();
  const { user, accountType, loading } = useAuth();
  const router = useRouter();
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
  }, [loading, user, router]);

  useEffect(() => {
    const t = setTimeout(() => setAuthTimedOut(true), AUTH_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  const loadingOrRedirect = loading || !user;
  const isNetworkAccount = accountType === 'network';

  if (loadingOrRedirect) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className={`flex flex-1 flex-col items-center justify-center px-4 ${!isDesktop ? 'pt-14' : 'pt-6'}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <MiningLoader size="sm" label="Loading…" />
          {authTimedOut && !user && (
            <p className="mt-6 max-w-sm text-center text-sm text-gray-500">
              Taking a while?{' '}
              <Link href="/login" className="text-accent-cyan hover:underline">
                Sign in
              </Link>
              {isDesktop && (
                <>
                  {' or '}
                  <Link href="/app" className="text-accent-cyan hover:underline">
                    open app launcher
                  </Link>
                </>
              )}
              .
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      {hasChecked && !isDesktop && (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface-950/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <BrandMark className="h-6 w-6 shrink-0" />
              <span className="bg-gradient-to-r from-accent-cyan to-emerald-400 bg-clip-text text-transparent">
                VibeMiner
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-gray-400 transition hover:text-white">
                Dashboard
              </Link>
              <Link href="/" className="text-sm text-gray-400 transition hover:text-white">
                ← Back home
              </Link>
            </div>
          </div>
        </header>
      )}

      <div className={`mx-auto w-full min-w-0 max-w-2xl px-4 sm:px-6 ${!isDesktop ? 'pt-14 pb-8' : 'pt-6 pb-8'}`}>
        <Breadcrumbs
          crumbs={[
            { label: 'Home', href: '/home' },
            { label: 'Dashboard', href: isNetworkAccount ? '/dashboard/network' : '/dashboard' },
            { label: 'Settings' },
          ]}
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>
          <p className="mt-1 text-gray-400">
            Manage your profile, desktop app, and preferences.
          </p>

          <div className="mt-10 space-y-8">
            <section>
              <h2 className="font-display text-lg font-semibold text-white mb-3">Profile</h2>
              <ProfileSettings />
            </section>
            {isNetworkAccount && (
              <section>
                <h2 className="font-display text-lg font-semibold text-white mb-3">Your listed networks</h2>
                <NetworkListingsSection />
              </section>
            )}
            {!isNetworkAccount && (
              <>
                <section>
                  <h2 className="font-display text-lg font-semibold text-white mb-3">Desktop app</h2>
                  <DesktopAppSettings />
              <p className="mt-2 text-xs text-gray-500">
                These options only apply when you’re using the VibeMiner desktop app. In the browser they are hidden.
              </p>
            </section>
                <section>
                  <h2 className="font-display text-lg font-semibold text-white mb-3">Mining</h2>
                  <MiningWalletSettings />
                </section>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
