'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { RegisterForm } from './RegisterForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DesktopNav } from '@/components/DesktopNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';

function RegisterFallback() {
  return (
    <div className="w-full max-w-md animate-pulse rounded-2xl border border-white/10 bg-surface-900/50 p-8">
      <div className="mb-6 h-8 w-32 rounded bg-white/10" />
      <div className="h-8 w-48 rounded bg-white/10" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-xl bg-white/10" />
        <div className="h-32 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const isDesktop = useIsDesktop();
  const homeHref = isDesktop ? '/app' : '/';
  return (
    <main className="flex min-h-screen flex-col bg-surface-950 bg-grid">
      {isDesktop && <DesktopNav />}
      <div className={`flex flex-1 flex-col items-center px-4 ${isDesktop ? 'pt-14 py-24' : 'py-24'}`}>
        <div className="w-full max-w-md">
          <Breadcrumbs crumbs={[{ label: 'Home', href: homeHref }, { label: 'Register' }]} />
        </div>
        <div className="mt-8 flex w-full max-w-md flex-1 justify-center">
          <Suspense fallback={<RegisterFallback />}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
