'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopShell } from '@/components/DesktopShell';

export function DesktopShellWrapper({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DesktopShell>{children}</DesktopShell>;
  }

  return <>{children}</>;
}
