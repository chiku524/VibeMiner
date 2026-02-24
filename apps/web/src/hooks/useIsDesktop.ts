'use client';

import { useState, useEffect } from 'react';

function getIsDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.electronAPI?.isDesktop === true;
}

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);

  useEffect(() => {
    setIsDesktop(getIsDesktop());
  }, []);

  return isDesktop;
}

/** Returns isDesktop and whether we've run the check (so we can avoid showing web-only content in desktop before check). */
export function useDesktopCheck(): { isDesktop: boolean; hasChecked: boolean } {
  const [state, setState] = useState({ isDesktop: false, hasChecked: false });

  useEffect(() => {
    setState({ isDesktop: getIsDesktop(), hasChecked: true });
  }, []);

  return state;
}
