'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { MiningSession } from '@crypto-miner/shared';
import type { NetworkEnvironment } from '@crypto-miner/shared';

const SIMULATED_BASE_HASHRATE = 500;
const SIMULATED_HASHRATE_VARIANCE = 0.15;

function randomHashrate() {
  const variance = (Math.random() - 0.5) * 2 * SIMULATED_HASHRATE_VARIANCE;
  return Math.round(SIMULATED_BASE_HASHRATE * (1 + variance));
}

export function useMiningSession() {
  const [session, setSession] = useState<MiningSession | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMining = useCallback((networkId: string, environment: NetworkEnvironment) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const startedAt = Date.now();
    setSession({
      networkId,
      environment,
      startedAt,
      hashrate: randomHashrate(),
      shares: 0,
      estimatedEarnings: '0.00',
      isActive: true,
    });
    intervalRef.current = setInterval(() => {
      setSession((prev) => {
        if (!prev) return null;
        const elapsed = (Date.now() - prev.startedAt) / 1000 / 3600;
        const estimated = (prev.hashrate * elapsed * 0.000001).toFixed(6);
        return {
          ...prev,
          hashrate: randomHashrate(),
          shares: prev.shares + (Math.random() > 0.6 ? 1 : 0),
          estimatedEarnings: estimated,
        };
      });
    }, 2000);
  }, []);

  const stopMining = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSession((prev) => (prev ? { ...prev, isActive: false } : null));
    setTimeout(() => setSession(null), 400);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { session, startMining, stopMining };
}
