'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

declare global {
  interface Window {
    electronAPI?: {
      isDesktop?: boolean;
      getAutoUpdateEnabled: () => Promise<boolean>;
      setAutoUpdateEnabled: (enabled: boolean) => Promise<boolean>;
      getAppVersion: () => Promise<string>;
      reload?: () => Promise<void>;
      checkForUpdates?: () => Promise<{ updateAvailable: boolean; error?: boolean }>;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.electronAPI?.getAutoUpdateEnabled) return;
    window.electronAPI.getAutoUpdateEnabled().then(setAutoUpdate).catch(() => {});
    window.electronAPI.getAppVersion?.().then(setVersion).catch(() => {});
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
      if (result.error) {
        addToast('Could not check for updates', 'error');
      } else if (result.updateAvailable) {
        addToast('Update available — quit and reopen the app to install', 'success');
      } else {
        addToast('You’re up to date', 'success');
      }
    } finally {
      setChecking(false);
    }
  };

  if (!mounted || typeof window === 'undefined' || !window.electronAPI?.getAutoUpdateEnabled) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-surface-900/30 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Desktop app settings</p>
          <p className="text-xs text-gray-500">
            {version ? `VibeMiner ${version}` : 'VibeMiner desktop'} · Updates run on startup and every 4 hours; install when you quit the app.
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
