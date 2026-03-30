'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/BrandMark';
import { MiningLoader } from '@/components/ui/MiningLoader';

type UpdatePhase = 'downloading' | 'installing';

/**
 * Overlay during update download/install from Settings → "Update now" (Rust emits
 * `desktop-update-progress`). Falls back to desktop-bridge stub when not in Tauri.
 */
export function DesktopUpdateOverlay() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<UpdatePhase | null>(null);

  useEffect(() => {
    if (pathname === '/desktop/splash' || pathname === '/desktop/launch') return;
    if (typeof window === 'undefined' || !window.desktopAPI?.isDesktop) return;

    let unlisten: (() => void) | undefined;

    (async () => {
      if (typeof window !== 'undefined' && window.__TAURI__) {
        try {
          const { listen } = await import('@tauri-apps/api/event');
          unlisten = await listen<{ phase?: string }>('desktop-update-progress', (e) => {
            const p = e.payload?.phase;
            if (p === 'downloading' || p === 'installing') setPhase(p);
          });
        } catch {
          /* ignore */
        }
      } else if (window.desktopAPI?.onUpdateProgress) {
        const cleanup = window.desktopAPI.onUpdateProgress((payload) => setPhase(payload.phase));
        unlisten = typeof cleanup === 'function' ? cleanup : undefined;
      }
    })();

    return () => {
      if (unlisten) unlisten();
    };
  }, [pathname]);

  if (pathname === '/desktop/splash' || pathname === '/desktop/launch') return null;

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
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-iconDisc shadow-[0_0_0_1px_rgba(148,163,184,0.22)]"
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
