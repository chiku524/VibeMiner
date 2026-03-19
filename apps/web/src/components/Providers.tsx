'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { MiningProvider } from '@/contexts/MiningContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { PageTransition } from '@/components/PageTransition';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DesktopUpdateToastListener } from '@/components/DesktopUpdateToastListener';
import { DesktopUpdateOverlay } from '@/components/DesktopUpdateOverlay';
import { DesktopShellWrapper } from '@/components/DesktopShellWrapper';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <MiningProvider>
          <DesktopUpdateToastListener />
          <DesktopUpdateOverlay />
          <OnboardingProvider>
            <DesktopShellWrapper>
              <PageTransition>{children}</PageTransition>
            </DesktopShellWrapper>
          </OnboardingProvider>
          </MiningProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
