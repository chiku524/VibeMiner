'use client';

import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DesktopNav } from '@/components/DesktopNav';
import { useIsDesktop } from '@/hooks/useIsDesktop';

function LoginFallback() {
  return (
    <div className="w-full max-w-sm animate-pulse rounded-2xl border border-white/10 bg-surface-900/50 p-8">
      <div className="mb-6 h-8 w-32 rounded bg-white/10" />
      <div className="h-8 w-48 rounded bg-white/10" />
      <div className="mt-6 space-y-4">
        <div className="h-12 rounded-lg bg-white/10" />
        <div className="h-12 rounded-lg bg-white/10" />
        <div className="h-12 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const isDesktop = useIsDesktop();
  const homeHref = isDesktop ? '/app' : '/';
  return (
    <main className="flex min-h-screen flex-col bg-surface-950 bg-grid">
      {isDesktop && <DesktopNav />}
      <div className={`flex flex-1 flex-col items-center px-4 ${isDesktop ? 'pt-14 py-24' : 'py-24'}`}>
        <div className="w-full max-w-sm">
          <Breadcrumbs crumbs={[{ label: 'Home', href: homeHref }, { label: 'Sign in' }]} />
        </div>
        <div className="mt-8 flex w-full max-w-sm flex-1 justify-center">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
        </div>
      </div>
    </main>
  );
}
