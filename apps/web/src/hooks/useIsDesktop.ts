'use client';

import { useState, useEffect } from 'react';

/** True inside the Tauri webview (globals, asset origin, or custom protocol). */
function isTauriEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.__TAURI__ !== 'undefined') return true;
  const { protocol, hostname } = window.location;
  if (protocol === 'tauri:') return true;
  if (hostname === 'tauri.localhost') return true;
  return false;
}

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function getIsDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.desktopAPI?.isDesktop === true) return true;
  return isTauriEnvironment();
}

let hasEverBeenDesktop = false;

/** Once we've seen desktop in this session, keep returning true so layouts don't flip to web on remount. */
function getIsDesktopLatched(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasEverBeenDesktop) return true;
  if (getIsDesktop()) {
    hasEverBeenDesktop = true;
    return true;
  }
  return false;
}

function getDesktopCheckInitial(): { isDesktop: boolean; hasChecked: boolean } {
  if (typeof window === 'undefined') {
    return { isDesktop: false, hasChecked: false };
  }
  if (getIsDesktopLatched()) {
    return { isDesktop: true, hasChecked: true };
  }
  if (!isLocalDevHost() && !isTauriEnvironment()) {
    return { isDesktop: false, hasChecked: true };
  }
  return { isDesktop: false, hasChecked: false };
}

/** Wait for Tauri globals / desktop-bridge on localhost (dev server + `tauri dev`). */
function armLocalhostDesktopResolution(onReady: (isDesktop: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (getIsDesktopLatched()) {
    onReady(true);
    return () => {};
  }

  let settled = false;
  const done = (desktop: boolean) => {
    if (settled) return;
    settled = true;
    onReady(desktop);
  };

  const onTauriReady = () => {
    if (getIsDesktopLatched()) done(true);
  };
  window.addEventListener('vibeminer-tauri-ready', onTauriReady);

  const slow = window.setTimeout(() => {
    done(getIsDesktopLatched());
  }, 2500);

  const poll = window.setInterval(() => {
    if (getIsDesktopLatched()) {
      window.clearTimeout(slow);
      window.clearInterval(poll);
      window.removeEventListener('vibeminer-tauri-ready', onTauriReady);
      done(true);
    }
  }, 20);

  return () => {
    window.removeEventListener('vibeminer-tauri-ready', onTauriReady);
    window.clearTimeout(slow);
    window.clearInterval(poll);
  };
}

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? getIsDesktopLatched() : false
  );

  useEffect(() => {
    setIsDesktop(getIsDesktopLatched());

    if (typeof window === 'undefined') return;

    if (getIsDesktopLatched()) {
      return;
    }

    if (!isLocalDevHost()) {
      setIsDesktop(isTauriEnvironment());
      return;
    }

    return armLocalhostDesktopResolution((d) => {
      if (d) setIsDesktop(true);
    });
  }, []);

  return isDesktop;
}

/**
 * Returns isDesktop and whether we've resolved desktop vs browser (avoids flashing the web landing in Tauri).
 */
export function useDesktopCheck(): { isDesktop: boolean; hasChecked: boolean } {
  const [state, setState] = useState(getDesktopCheckInitial);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (getIsDesktopLatched()) {
      setState({ isDesktop: true, hasChecked: true });
      return;
    }

    if (!isLocalDevHost() && !isTauriEnvironment()) {
      return;
    }

    if (!isLocalDevHost() && isTauriEnvironment()) {
      setState({ isDesktop: true, hasChecked: true });
      return;
    }

    return armLocalhostDesktopResolution((desktop) => {
      setState({ isDesktop: desktop, hasChecked: true });
    });
  }, []);

  return state;
}
