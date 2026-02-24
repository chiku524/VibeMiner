'use client';

import { Suspense, useState, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { DesktopHomeGate } from '@/components/DesktopHomeGate';
import { LandingNetworksPreview } from '@/components/LandingNetworksPreview';
import { useDesktopCheck } from '@/hooks/useIsDesktop';

const HowItWorks = dynamic(
  () => import('@/components/HowItWorks').then((m) => ({ default: m.HowItWorks })),
  { ssr: true }
);

/** Skeleton for below-fold sections when navigating back to home. */
function SectionSkeleton() {
  return (
    <section className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Web-only landing: hero, quick links to Networks/Pools, how it works, CTA. */
function WebLanding() {
  return (
    <>
      <Nav />
      <Hero />
      <LandingNetworksPreview />
      <Suspense fallback={<SectionSkeleton />}>
        <HowItWorks />
      </Suspense>
      <CTA />
      <Footer />
      <BackToTop />
    </>
  );
}

function MinimalShell() {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid" aria-busy="true">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-surface-950/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-display text-base font-semibold text-white/95">
            <span className="text-lg" aria-hidden="true">◇</span>
            <span>VibeMiner</span>
          </a>
          <a href="/app" className="rounded px-2.5 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white">
            App
          </a>
        </nav>
      </header>
      <div className="flex min-h-screen flex-col items-center justify-center pt-14">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
        <p className="mt-4 text-sm text-gray-400">Loading…</p>
      </div>
    </main>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isDesktop, hasChecked } = useDesktopCheck();

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Before mount or before we know desktop: show minimal shell so we never flash web-only content in Electron.
  if (!mounted || !hasChecked) {
    return <MinimalShell />;
  }

  if (isDesktop) {
    return <DesktopHomeGate />;
  }

  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <WebLanding />
    </main>
  );
}
