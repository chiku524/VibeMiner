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
