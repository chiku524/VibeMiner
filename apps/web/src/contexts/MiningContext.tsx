'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import type { MiningSession } from '@vibeminer/shared';
import type { NetworkEnvironment } from '@vibeminer/shared';

const SIMULATED_BASE_HASHRATE = 500;
const SIMULATED_HASHRATE_VARIANCE = 0.15;

function randomHashrate() {
  const variance = (Math.random() - 0.5) * 2 * SIMULATED_HASHRATE_VARIANCE;
  return Math.round(SIMULATED_BASE_HASHRATE * (1 + variance));
}

type MiningContextValue = {
  sessions: MiningSession[];
  startMining: (networkId: string, environment: NetworkEnvironment) => void;
  stopMining: (networkId: string) => void;
  isMining: (networkId: string, environment?: NetworkEnvironment) => boolean;
};

const MiningContext = createContext<MiningContextValue | null>(null);

export function MiningProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<MiningSession[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMining = useCallback((networkId: string, environment: NetworkEnvironment) => {
    setSessions((prev) => {
      const exists = prev.some(
        (s) => s.networkId === networkId && s.environment === environment
      );
      if (exists) return prev;
      const startedAt = Date.now();
      return [
        ...prev,
        {
          networkId,
          environment,
          startedAt,
          hashrate: randomHashrate(),
          shares: 0,
          estimatedEarnings: '0.00',
          isActive: true,
        },
      ];
    });
  }, []);

  const stopMining = useCallback((networkId: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.networkId !== networkId);
      return next;
    });
  }, []);

  const isMining = useCallback(
    (networkId: string, environment?: NetworkEnvironment) =>
      sessions.some(
        (s) =>
          s.networkId === networkId &&
          s.isActive &&
          (environment == null || s.environment === environment)
      ),
    [sessions]
  );

  // Single interval updates all active sessions
  useEffect(() => {
    if (sessions.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => {
            const elapsed = (Date.now() - s.startedAt) / 1000 / 3600;
            const estimated = (s.hashrate * elapsed * 0.000001).toFixed(6);
            return {
              ...s,
              hashrate: randomHashrate(),
              shares: s.shares + (Math.random() > 0.6 ? 1 : 0),
              estimatedEarnings: estimated,
            };
          })
      );
    }, 2000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessions.length]);

  const value: MiningContextValue = {
    sessions,
    startMining,
    stopMining,
    isMining,
  };

  return <MiningContext.Provider value={value}>{children}</MiningContext.Provider>;
}

export function useMining() {
  const context = useContext(MiningContext);
  if (!context) throw new Error('useMining must be used within MiningProvider');
  return context;
}
