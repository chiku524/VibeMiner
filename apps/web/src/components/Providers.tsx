'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { PageTransition } from '@/components/PageTransition';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DesktopUpdateToastListener } from '@/components/DesktopUpdateToastListener';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <DesktopUpdateToastListener />
          <OnboardingProvider>
            <PageTransition>{children}</PageTransition>
          </OnboardingProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
