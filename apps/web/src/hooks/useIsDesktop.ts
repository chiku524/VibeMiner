'use client';

import { useState, useEffect } from 'react';

function getIsDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.electronAPI?.isDesktop === true;
}

/** Once we've seen desktop in this session, keep returning true so layouts don't flip to web on remount. */
function getIsDesktopLatched(): boolean {
  if (typeof window === 'undefined') return false;
  const key = '__vibeminer_desktop_latched';
  const w = window as Window & { [key: string]: boolean };
  if (w[key] === true) return true;
  if (getIsDesktop()) {
    w[key] = true;
    return true;
  }
  return false;
}

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);

  useEffect(() => {
    setIsDesktop(getIsDesktop());
  }, []);

  return isDesktop;
}

/**
 * Returns isDesktop and whether we've run the check.
 * Uses a session latch: once isDesktop has been true (desktop app), we keep it true so we never
 * flip to the web layout on remount (e.g. navigating back to /networks), which would show a blank page.
 */
export function useDesktopCheck(): { isDesktop: boolean; hasChecked: boolean } {
  const [state, setState] = useState(() => ({
    isDesktop: getIsDesktopLatched(),
    hasChecked: typeof window !== 'undefined',
  }));

  useEffect(() => {
    setState({ isDesktop: getIsDesktopLatched(), hasChecked: true });
  }, []);

  return state;
}
