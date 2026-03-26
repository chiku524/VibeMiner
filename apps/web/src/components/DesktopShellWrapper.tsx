'use client';

import { usePathname } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { DesktopShell } from '@/components/DesktopShell';

/** Tauri bootstrap routes: frameless or minimal windows — no sidebar chrome. */
function isDesktopBootstrapPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/desktop/splash' || pathname === '/desktop/launch';
}

export function DesktopShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDesktop = useIsDesktop();

  if (isDesktop && !isDesktopBootstrapPath(pathname)) {
    return <DesktopShell>{children}</DesktopShell>;
  }

  return <>{children}</>;
}
