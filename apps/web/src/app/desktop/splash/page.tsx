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

const INTRO_MS = 1800;

/**
 * Frameless splash window: intro animation → optional in-app update (Tauri updater) → main window.
 */
export default function DesktopSplashPage() {
  const [phase, setPhase] = useState<Phase>(PHASE.INTRO);
  const [introDone, setIntroDone] = useState(false);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => setIntroDone(true), INTRO_MS);
    return () => window.clearTimeout(t);
  }, []);

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
        const { invoke } = await import('@tauri-apps/api/core');
        type CheckResult = {
          updateAvailable?: boolean;
          error?: boolean;
          message?: string;
          latestVersion?: string | null;
        };
        const status = await invoke<CheckResult>('check_for_updates');
        if (cancelledRef.current) return;

        if (status.error) {
          console.warn(
            '[VibeMiner] Update check failed:',
            status.message ?? 'unknown (see docs: latest.json on GitHub release)'
          );
        } else if (status.updateAvailable) {
          const v =
            typeof status.latestVersion === 'string' && status.latestVersion
              ? status.latestVersion
              : null;
          setUpdateVersion(v);
          setPhase(PHASE.DOWNLOADING);
          const result = await invoke<{ ok?: boolean; error?: string }>('install_update_now');
          if (cancelledRef.current) return;
          if (result?.ok) {
            setPhase(PHASE.INSTALLING);
            return;
          }
          console.warn('[VibeMiner] Update install failed:', result?.error ?? 'unknown');
        }
      } catch (e) {
        console.warn('[VibeMiner] Updater unavailable:', e);
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
            <BrandMark className="h-[72px] w-[72px]" fetchPriority="high" />
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
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-iconDisc shadow-[0_0_0_1px_rgba(148,163,184,0.22)]"
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
