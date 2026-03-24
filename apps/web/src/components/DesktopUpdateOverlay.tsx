'use client';

import { useEffect, useState } from 'react';
import { BrandMark } from '@/components/BrandMark';
import { MiningLoader } from '@/components/ui/MiningLoader';

type UpdatePhase = 'downloading' | 'installing';

/**
 * Shows an in-app overlay during update download/install so we don't open a separate
 * popup window. Listens for main process update-progress and displays a themed
 * "Downloading…" / "Installing…" overlay in the main window (industry standard).
 */
export function DesktopUpdateOverlay() {
  const [phase, setPhase] = useState<UpdatePhase | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.desktopAPI?.isDesktop || !window.desktopAPI?.onUpdateProgress) return;
    const cleanup = window.desktopAPI.onUpdateProgress((payload) => setPhase(payload.phase));
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  if (!phase) return null;

  const label = phase === 'downloading' ? 'Downloading update…' : 'Installing… The app will be restarting in a moment.';

  return (
    <div
      className="fixed inset-0 z-[99998] flex flex-col items-center justify-center bg-surface-950/95 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface-900/90 px-10 py-8 shadow-xl">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/25 to-emerald-500/20"
          aria-hidden
        >
          <BrandMark className="h-9 w-9" />
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-white">VibeMiner</p>
        <div className="mt-4">
          <MiningLoader size="sm" />
        </div>
        <p className="mt-4 text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}
