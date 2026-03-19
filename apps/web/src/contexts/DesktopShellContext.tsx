'use client';

import { createContext, useContext, type ReactNode } from 'react';

const DesktopShellContext = createContext<boolean>(false);

export function DesktopShellProvider({ inShell, children }: { inShell: boolean; children: ReactNode }) {
  return (
    <DesktopShellContext.Provider value={inShell}>
      {children}
    </DesktopShellContext.Provider>
  );
}

export function useDesktopShell(): boolean {
  return useContext(DesktopShellContext);
}
