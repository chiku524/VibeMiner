'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { DesktopHomeGate } from '@/components/DesktopHomeGate';
import { LandingNetworksPreview } from '@/components/LandingNetworksPreview';
import { useIsDesktop } from '@/hooks/useIsDesktop';

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

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" aria-hidden />
      </main>
    );
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
