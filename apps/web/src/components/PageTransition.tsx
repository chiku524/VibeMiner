'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MiningLoader } from '@/components/ui/MiningLoader';

const RECOVERY_DELAY_MS = 6000;

/** Minimal shell so we never show a completely blank page during navigation or if content is missing. */
function LoadingShell({ showRecovery }: { showRecovery: boolean }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-surface-950 px-4">
      <MiningLoader size="md" label="Loading…" />
      {showRecovery && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Taking a while?{' '}
          <Link href="/" className="text-accent-cyan hover:underline">
            Go home
          </Link>
          {' or '}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-accent-cyan hover:underline"
          >
            reload
          </button>
          .
        </p>
      )}
    </div>
  );
}

function isDesktopBootstrapPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/desktop/splash' || pathname === '/desktop/launch';
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [showRecovery, setShowRecovery] = useState(false);
  const hasContent =
    children != null && React.Children.count(children) > 0;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // When we're showing the loading shell (no content), offer recovery after a delay in case navigation/chunk failed.
  useEffect(() => {
    if (isDesktopBootstrapPath(pathname)) return;
    if (!hasContent) {
      setShowRecovery(false);
      const t = setTimeout(() => setShowRecovery(true), RECOVERY_DELAY_MS);
      return () => clearTimeout(t);
    }
    setShowRecovery(false);
  }, [hasContent, pathname]);

  if (isDesktopBootstrapPath(pathname)) {
    return <>{children}</>;
  }

  // No exit animation: avoid a full-screen dark layer (exiting page's wrapper) covering the next page.
  const skipInitialFade = true;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={skipInitialFade ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={undefined}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
        className="min-h-screen w-full bg-surface-950"
      >
        <div className="min-h-screen w-full">
          {hasContent ? children : <LoadingShell showRecovery={showRecovery} />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
