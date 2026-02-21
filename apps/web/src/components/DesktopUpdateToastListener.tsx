'use client';

import { useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';

/**
 * When running in the desktop app, listens for update-downloaded and shows a toast
 * so the user sees the "restart to install" message from anywhere (not only Settings).
 */
export function DesktopUpdateToastListener() {
  const isDesktop = useIsDesktop();
  const { addToast } = useToast();

  useEffect(() => {
    if (!isDesktop || typeof window === 'undefined' || !window.electronAPI?.onUpdateDownloaded) return;
    window.electronAPI.onUpdateDownloaded(() => {
      addToast('Update ready — quit and reopen the app to install.', 'success');
    });
  }, [isDesktop, addToast]);

  return null;
}
