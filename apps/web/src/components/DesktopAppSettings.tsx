'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

type UpdateAvailableInfo = {
  latestVersion: string;
  releasePageUrl: string;
  directDownloadUrl: string;
};

declare global {
  interface Window {
    electronAPI?: {
      isDesktop?: boolean;
      getAutoUpdateEnabled: () => Promise<boolean>;
      setAutoUpdateEnabled: (enabled: boolean) => Promise<boolean>;
      getAppVersion: () => Promise<string>;
      reload?: () => Promise<void>;
      checkForUpdates?: () => Promise<{
        updateAvailable: boolean;
        latestVersion?: string | null;
        releasePageUrl?: string;
        directDownloadUrl?: string;
        error?: boolean;
        message?: string;
      }>;
      getUpdateDownloaded?: () => Promise<boolean>;
      getUpdateAvailableInfo?: () => Promise<UpdateAvailableInfo | null>;
      openExternal?: (url: string) => Promise<void>;
      onUpdateDownloaded?: (callback: () => void) => void;
      onUpdateAvailable?: (callback: (info: UpdateAvailableInfo) => void) => void;
    };
  }
}

export function DesktopAppSettings() {
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [version, setVersion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateAvailableInfo | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.electronAPI?.getAutoUpdateEnabled) return;
    window.electronAPI.getAutoUpdateEnabled().then(setAutoUpdate).catch(() => {});
    window.electronAPI.getAppVersion?.().then(setVersion).catch(() => {});
    window.electronAPI.getUpdateDownloaded?.().then(setUpdateDownloaded).catch(() => {});
    window.electronAPI.getUpdateAvailableInfo?.().then(setUpdateInfo).catch(() => {});
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.electronAPI?.onUpdateDownloaded) return;
    window.electronAPI.onUpdateDownloaded(() => setUpdateDownloaded(true));
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.electronAPI?.onUpdateAvailable) return;
    window.electronAPI.onUpdateAvailable((info) => setUpdateInfo(info));
  }, [mounted]);

  const handleToggle = async () => {
    if (!window.electronAPI?.setAutoUpdateEnabled || saving) return;
    setSaving(true);
    try {
      const next = !autoUpdate;
      await window.electronAPI.setAutoUpdateEnabled(next);
      setAutoUpdate(next);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckNow = async () => {
    if (!window.electronAPI?.checkForUpdates || checking) return;
    setChecking(true);
    addToast('Checking for updates…', 'info');
    try {
      const result = await window.electronAPI.checkForUpdates();
      if (result?.error) {
        const msg = result.message ? `Could not check: ${result.message}` : 'Could not check for updates';
        addToast(msg, 'error');
      } else if (result?.updateAvailable) {
        const v = result.latestVersion ? ` (v${result.latestVersion})` : '';
        addToast(`Update available${v}. Use “Download installer” below, or quit and reopen if already downloaded.`, 'success');
        if (result.latestVersion && result.releasePageUrl) {
          setUpdateInfo({
            latestVersion: result.latestVersion,
            releasePageUrl: result.releasePageUrl,
            directDownloadUrl: result.directDownloadUrl ?? result.releasePageUrl,
          });
        }
      } else {
        addToast('You’re up to date', 'success');
      }
    } catch {
      addToast('Could not check for updates', 'error');
    } finally {
      setChecking(false);
    }
  };

  if (!mounted || typeof window === 'undefined' || !window.electronAPI?.getAutoUpdateEnabled) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-surface-900/30 px-4 py-3">
      {updateDownloaded && (
        <p className="mb-3 rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-2 text-sm text-accent-cyan">
          Update ready — quit and reopen the app to install.
        </p>
      )}
      {updateInfo && !updateDownloaded && (
        <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Update available (v{updateInfo.latestVersion}). Click{' '}
          <button
            type="button"
            onClick={() => window.electronAPI?.openExternal?.(updateInfo.directDownloadUrl)}
            className="font-medium text-accent-cyan underline hover:no-underline"
          >
            Download installer
          </button>
          {' '}to get the latest version, or quit and reopen the app if the update was already downloaded.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Desktop app settings</p>
          <p className="text-xs text-gray-500">
            {version ? `VibeMiner ${version}` : 'VibeMiner desktop'} · Update check on startup and every 4 hours; install when you quit the app.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCheckNow}
            disabled={checking}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/5 disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Check for updates'}
          </button>
          <label className="flex cursor-pointer items-center gap-2">
            <span className="text-sm text-gray-400">Auto-updates</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoUpdate}
              disabled={saving}
              onClick={handleToggle}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:ring-offset-2 focus:ring-offset-surface-950 ${
                autoUpdate ? 'bg-accent-cyan' : 'bg-white/20'
              } ${saving ? 'opacity-70' : ''}`}
            >
              <span
                className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  autoUpdate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
}
