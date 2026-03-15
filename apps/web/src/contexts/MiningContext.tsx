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
import type { BlockchainNetwork, NetworkEnvironment } from '@vibeminer/shared';
import { isNetworkMineable } from '@vibeminer/shared';
import { useToast } from '@/contexts/ToastContext';

function networkKey(networkId: string, environment: NetworkEnvironment): string {
  return `${networkId}:${environment}`;
}

type MiningContextValue = {
  sessions: MiningSession[];
  startMining: (network: BlockchainNetwork, walletAddress?: string) => Promise<{ ok: boolean; error?: string }>;
  stopMining: (networkId: string, environment?: NetworkEnvironment) => void;
  isMining: (networkId: string, environment?: NetworkEnvironment) => boolean;
};

const MiningContext = createContext<MiningContextValue | null>(null);

export function MiningProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<MiningSession[]>([]);
  const realKeysRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMining = useCallback(
    async (network: BlockchainNetwork, walletAddress?: string): Promise<{ ok: boolean; error?: string }> => {
      const env = network.environment ?? 'mainnet';
      const key = networkKey(network.id, env);

      const alreadyMining = sessions.some((s) => s.networkId === network.id && s.environment === env);
      if (alreadyMining) return { ok: false, error: 'Already mining this network' };

      const isDesktop = typeof window !== 'undefined' && window.electronAPI?.isDesktop === true;
      const mineable = isNetworkMineable(network);
      const wallet = (walletAddress ?? '').trim();

      // Real mining: desktop + mineable + wallet
      if (isDesktop && mineable && wallet.length >= 10 && window.electronAPI?.startRealMining) {
        try {
          const result = await window.electronAPI.startRealMining({
            network: {
              id: network.id,
              poolUrl: network.poolUrl!,
              poolPort: network.poolPort!,
              algorithm: network.algorithm,
              environment: env,
            },
            walletAddress: wallet,
          });
          if (!result.ok) return result;
          realKeysRef.current.add(key);
          setSessions((prev) => [
            ...prev,
            {
              networkId: network.id,
              environment: env,
              startedAt: Date.now(),
              hashrate: 0,
              shares: 0,
              estimatedEarnings: '0.00',
              isActive: true,
            },
          ]);
          return { ok: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to start mining';
          return { ok: false, error: msg };
        }
      }

      // Demo mode (web or no wallet or not mineable): show zeros until real stats from desktop + wallet
      if (isDesktop && mineable && wallet.length < 10) {
        addToast('Add mining wallet in Settings for real payouts. Stats will show once you mine from the desktop app.', 'info');
      }
      setSessions((prev) => {
        const exists = prev.some((s) => s.networkId === network.id && s.environment === env);
        if (exists) return prev;
        return [
          ...prev,
          {
            networkId: network.id,
            environment: env,
            startedAt: Date.now(),
            hashrate: 0,
            shares: 0,
            estimatedEarnings: '0.00',
            isActive: true,
          },
        ];
      });
      return { ok: true };
    },
    [sessions, addToast]
  );

  const stopMining = useCallback((networkId: string, environment?: NetworkEnvironment) => {
    setSessions((prev) => {
      const next = prev.filter((s) => {
        if (s.networkId !== networkId) return true;
        if (environment != null && s.environment !== environment) return true;
        const key = networkKey(s.networkId, s.environment);
        if (realKeysRef.current.has(key) && window.electronAPI?.stopRealMining) {
          window.electronAPI.stopRealMining(s.networkId, s.environment);
          realKeysRef.current.delete(key);
        }
        return false;
      });
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

  // Poll: real stats for real sessions, simulated for others
  useEffect(() => {
    if (sessions.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(async () => {
      const hasReal = sessions.some((s) =>
        realKeysRef.current.has(networkKey(s.networkId, s.environment))
      );
      if (hasReal && window.electronAPI?.getRealMiningStats) {
        const updates: Array<{ networkId: string; env: NetworkEnvironment; hashrate: number; shares: number }> = [];
        for (const s of sessions) {
          const key = networkKey(s.networkId, s.environment);
          if (realKeysRef.current.has(key)) {
            const stats = await window.electronAPI.getRealMiningStats(s.networkId, s.environment);
            if (stats) {
              updates.push({
                networkId: s.networkId,
                env: s.environment,
                hashrate: stats.hashrate,
                shares: stats.shares,
              });
            }
          }
        }
        if (updates.length > 0) {
          setSessions((prev) =>
            prev.map((s) => {
              const u = updates.find((x) => x.networkId === s.networkId && x.env === s.environment);
              if (!u) return s;
              const elapsed = (Date.now() - s.startedAt) / 1000 / 3600;
              const estimated = (u.hashrate * elapsed * 0.000001).toFixed(6);
              return {
                ...s,
                hashrate: u.hashrate,
                shares: u.shares,
                estimatedEarnings: estimated,
              };
            })
          );
        }
      }
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
