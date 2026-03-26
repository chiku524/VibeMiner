'use client';

import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '@/components/BrandMark';
import { MiningLoader } from '@/components/ui/MiningLoader';
import { site } from '@/lib/site';
import './splash.css';

const PHASE = {
  INTRO: 'intro',
  CHECKING: 'checking',
  DOWNLOADING: 'downloading',
  INSTALLING: 'installing',
  OPENING: 'opening',
} as const;

type Phase = (typeof PHASE)[keyof typeof PHASE];

function hasTauriRuntime(): boolean {
  return typeof window !== 'undefined' && typeof window.__TAURI__ !== 'undefined';
}

/**
 * Frameless splash window: intro animation → optional in-app update (Tauri updater) → main window.
 * Uses @tauri-apps/api/core invoke (same as BountyHub) so close works even if __TAURI__ attached late.
 */
export default function DesktopSplashPage() {
  const [phase, setPhase] = useState<Phase>(PHASE.INTRO);
  const [introDone, setIntroDone] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [inTauriShell, setInTauriShell] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (hasTauriRuntime()) {
      setInTauriShell(true);
      return;
    }

    const onReady = () => setInTauriShell(true);
    window.addEventListener('vibeminer-tauri-ready', onReady);

    const t = window.setTimeout(() => {
      if (!hasTauriRuntime()) {
        setIntroDone(true);
      }
    }, 500);

    return () => {
      window.removeEventListener('vibeminer-tauri-ready', onReady);
      window.clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!inTauriShell) return;
    const t = setTimeout(() => setIntroDone(true), 1800);
    return () => clearTimeout(t);
  }, [inTauriShell]);

  useEffect(() => {
    if (!introDone) return;

    cancelledRef.current = false;

    const closeSplash = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('close_splash_and_show_main');
      } catch {
        void 0;
      }
    };

    const run = async () => {
      if (!hasTauriRuntime() && !window.desktopAPI?.isDesktop) {
        return;
      }

      setPhase(PHASE.CHECKING);

      let autoUpdate = true;
      try {
        if (window.desktopAPI?.getAutoUpdateEnabled) {
          autoUpdate = await window.desktopAPI.getAutoUpdateEnabled();
        }
      } catch {
        autoUpdate = true;
      }

      if (!autoUpdate) {
        setPhase(PHASE.OPENING);
        if (!cancelledRef.current) await closeSplash();
        return;
      }

      try {
        const [{ check }, { relaunch }] = await Promise.all([
          import('@tauri-apps/plugin-updater'),
          import('@tauri-apps/plugin-process'),
        ]);
        const update = await check();
        if (cancelledRef.current) return;

        if (update) {
          setUpdateVersion(update.version);
          setPhase(PHASE.DOWNLOADING);
          await update.downloadAndInstall(() => {
            if (cancelledRef.current) return;
          });
          if (cancelledRef.current) return;
          setPhase(PHASE.INSTALLING);
          await relaunch();
          return;
        }
      } catch {
        // Missing updater config, offline, or unsigned dev build — open main app.
      }

      if (cancelledRef.current) return;
      setPhase(PHASE.OPENING);
      await closeSplash();
    };

    void run();
    return () => {
      cancelledRef.current = true;
    };
  }, [introDone]);

  const showUpdateOverlay = phase === PHASE.DOWNLOADING || phase === PHASE.INSTALLING;

  return (
    <>
      <div className="splash-screen splash-screen--intro">
        <div className="splash-screen__content">
          <div className="splash-screen__symbol" aria-hidden>
            <BrandMark className="h-[72px] w-[72px]" />
          </div>
          <h1 className="splash-screen__name">{site.name}</h1>
          <p className="splash-screen__tagline">{site.slogan}</p>
          {phase === PHASE.CHECKING && (
            <div className="splash-screen__loader">
              <MiningLoader size="sm" label="Checking for updates…" />
            </div>
          )}
        </div>
      </div>
      {showUpdateOverlay && (
        <div
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-surface-950/95 backdrop-blur-sm"
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
            <p className="mt-4 font-display text-lg font-semibold text-white">{site.name}</p>
            <div className="mt-4">
              <MiningLoader size="sm" />
            </div>
            <p className="mt-4 text-center text-sm text-gray-400">
              {phase === PHASE.DOWNLOADING
                ? `Downloading update${updateVersion ? ` v${updateVersion}` : ''}…`
                : 'Installing… The app will restart in a moment.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
