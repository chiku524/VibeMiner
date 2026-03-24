'use client';

import { useIsDesktop } from '@/hooks/useIsDesktop';
import { MiningLoader } from '@/components/ui/MiningLoader';

export default function AppLauncherLoading() {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <main className="min-h-screen bg-surface-950 bg-grid">
        <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <MiningLoader size="md" label="Loading…" />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950 bg-grid flex flex-col items-center justify-center">
      <MiningLoader size="md" label="Loading…" />
    </div>
  );
}
