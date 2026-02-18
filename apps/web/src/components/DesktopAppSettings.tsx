'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      getAutoUpdateEnabled: () => Promise<boolean>;
      setAutoUpdateEnabled: (enabled: boolean) => Promise<boolean>;
      getAppVersion: () => Promise<string>;
    };
  }
}

export function DesktopAppSettings() {
  const [mounted, setMounted] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [version, setVersion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  if (!mounted || typeof window === 'undefined' || !window.electronAPI?.getAutoUpdateEnabled) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-white/10 bg-surface-900/30 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Desktop app settings</p>
          <p className="text-xs text-gray-500">
            {version ? `VibeMiner ${version}` : 'VibeMiner desktop'} · Only in the installed app
          </p>
        </div>
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
  );
}
