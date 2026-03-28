'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import type { MiningSession, MiningSessionNode } from '@vibeminer/shared';
import type { BlockchainNetwork, NetworkEnvironment } from '@vibeminer/shared';
import { isMiningSessionNode, sessionListKey, sanitizeNodePresetId } from '@vibeminer/shared';
import { isNetworkMineable } from '@vibeminer/shared';
import { useToast } from '@/contexts/ToastContext';

function networkKey(networkId: string, environment: NetworkEnvironment): string {
  return `${networkId}:${environment}`;
}

type DesktopRunningNodeRow = {
  networkId: string;
  environment: string;
  nodePresetId: string;
  startedAt: number;
};

function mergeDesktopNodeRowsIntoSessions(
  prev: MiningSession[],
  rows: DesktopRunningNodeRow[]
): MiningSession[] {
  const mining = prev.filter((s) => !isMiningSessionNode(s));
  const nodes: MiningSessionNode[] = rows.map((d) => ({
    kind: 'node',
    networkId: d.networkId,
    environment: d.environment as NetworkEnvironment,
    presetId: d.nodePresetId,
    startedAt: d.startedAt > 0 ? Number(d.startedAt) : Date.now(),
    isActive: true,
  }));
  const withStatus = nodes.map((n) => {
    const old = prev.find(
      (s): s is MiningSessionNode =>
        isMiningSessionNode(s) && sessionListKey(s) === sessionListKey(n)
    );
    return old?.nodeStatus != null ? { ...n, nodeStatus: old.nodeStatus } : n;
  });
  return [...mining, ...withStatus];
}

type MiningContextValue = {
  sessions: MiningSession[];
  startMining: (network: BlockchainNetwork, walletAddress?: string) => Promise<{ ok: boolean; error?: string }>;
  stopMining: (networkId: string, environment?: NetworkEnvironment) => void;
  stopSession: (session: MiningSession) => void;
  registerNodeSession: (args: {
    networkId: string;
    environment: NetworkEnvironment;
    presetId: string;
    startedAt?: number;
  }) => void;
  isMining: (networkId: string, environment?: NetworkEnvironment) => boolean;
};

const MiningContext = createContext<MiningContextValue | null>(null);

export function MiningProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<MiningSession[]>([]);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const realKeysRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMining = useCallback(
    async (network: BlockchainNetwork, walletAddress?: string): Promise<{ ok: boolean; error?: string }> => {
      const env = network.environment ?? 'mainnet';
      const key = networkKey(network.id, env);

      const alreadyMining = sessions.some(
        (s) => !isMiningSessionNode(s) && s.networkId === network.id && s.environment === env
      );
      if (alreadyMining) return { ok: false, error: 'Already mining this network' };

      const isDesktop = typeof window !== 'undefined' && window.desktopAPI?.isDesktop === true;
      const mineable = isNetworkMineable(network);
      const wallet = (walletAddress ?? '').trim();

      if (isDesktop && mineable && wallet.length >= 10 && window.desktopAPI?.startRealMining) {
        try {
          const result = await window.desktopAPI.startRealMining({
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

      if (isDesktop && mineable && wallet.length < 10) {
        addToast('Add mining wallet in Settings for real payouts. Stats will show once you mine from the desktop app.', 'info');
      }
      setSessions((prev) => {
        const exists = prev.some(
          (s) => !isMiningSessionNode(s) && s.networkId === network.id && s.environment === env
        );
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
        if (isMiningSessionNode(s)) return true;
        if (s.networkId !== networkId) return true;
        if (environment != null && s.environment !== environment) return true;
        const key = networkKey(s.networkId, s.environment);
        if (realKeysRef.current.has(key) && window.desktopAPI?.stopRealMining) {
          window.desktopAPI.stopRealMining(s.networkId, s.environment);
          realKeysRef.current.delete(key);
        }
        return false;
      });
      return next;
    });
  }, []);

  const stopSession = useCallback((session: MiningSession) => {
    if (isMiningSessionNode(session)) {
      void (async () => {
        try {
          await window.desktopAPI?.stopNode?.(
            session.networkId,
            session.environment,
            sanitizeNodePresetId(session.presetId)
          );
        } catch (e) {
          console.warn('stopNode failed', e);
        }
        const listFn = window.desktopAPI?.listRunningNodes;
        if (listFn) {
          try {
            const list = await listFn();
            if (Array.isArray(list)) {
              setSessions((prev) => mergeDesktopNodeRowsIntoSessions(prev, list as DesktopRunningNodeRow[]));
            }
          } catch (e) {
            console.warn('listRunningNodes failed', e);
            setSessions((prev) => prev.filter((s) => sessionListKey(s) !== sessionListKey(session)));
          }
        } else {
          setSessions((prev) => prev.filter((s) => sessionListKey(s) !== sessionListKey(session)));
        }
      })();
      return;
    }
    const key = networkKey(session.networkId, session.environment);
    if (realKeysRef.current.has(key) && window.desktopAPI?.stopRealMining) {
      window.desktopAPI.stopRealMining(session.networkId, session.environment);
      realKeysRef.current.delete(key);
    }
    setSessions((prev) => prev.filter((s) => sessionListKey(s) !== sessionListKey(session)));
  }, []);

  const registerNodeSession = useCallback(
    (args: { networkId: string; environment: NetworkEnvironment; presetId: string; startedAt?: number }) => {
      const row: MiningSessionNode = {
        kind: 'node',
        networkId: args.networkId,
        environment: args.environment,
        presetId: sanitizeNodePresetId(args.presetId),
        startedAt: args.startedAt ?? Date.now(),
        isActive: true,
      };
      setSessions((prev) => {
        const mining = prev.filter((s) => !isMiningSessionNode(s));
        const otherNodes = prev.filter(
          (s) => isMiningSessionNode(s) && sessionListKey(s) !== sessionListKey(row)
        );
        return [...mining, ...otherNodes, row];
      });
    },
    []
  );

  const isMining = useCallback(
    (networkId: string, environment?: NetworkEnvironment) =>
      sessions.some(
        (s) =>
          !isMiningSessionNode(s) &&
          s.networkId === networkId &&
          s.isActive &&
          (environment == null || s.environment === environment)
      ),
    [sessions]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.desktopAPI?.listRunningNodes) return;
    let cancelled = false;

    async function syncNodesFromDesktop() {
      try {
        const listFn = window.desktopAPI?.listRunningNodes;
        if (!listFn) return;
        const list = (await listFn()) as unknown;
        if (cancelled || !Array.isArray(list)) return;
        const rows = list as DesktopRunningNodeRow[];
        setSessions((prev) => mergeDesktopNodeRowsIntoSessions(prev, rows));
      } catch {
        /* desktop IPC unavailable */
      }
    }

    void syncNodesFromDesktop();
    const id = setInterval(() => {
      void syncNodesFromDesktop();
    }, 5000);
    const onFocus = () => {
      void syncNodesFromDesktop();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const nodeKeysSerialized = sessions
    .filter(isMiningSessionNode)
    .map(sessionListKey)
    .sort()
    .join('|');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.desktopAPI?.getNodeStatus) return;
    if (!nodeKeysSerialized) return;

    async function tick() {
      const getNodeStatus = window.desktopAPI?.getNodeStatus;
      if (!getNodeStatus) return;
      const nodeSessions = sessionsRef.current.filter(isMiningSessionNode);
      if (nodeSessions.length === 0) return;
      const updates: Array<{ key: string; status: string | null }> = [];
      for (const s of nodeSessions) {
        try {
          const st = await getNodeStatus(s.networkId, s.environment, s.presetId);
          const status =
            st && typeof st === 'object' && 'status' in st && typeof st.status === 'string'
              ? st.status
              : null;
          updates.push({ key: sessionListKey(s), status });
        } catch {
          updates.push({ key: sessionListKey(s), status: null });
        }
      }
      setSessions((prev) =>
        prev.map((s) => {
          if (!isMiningSessionNode(s)) return s;
          const u = updates.find((x) => x.key === sessionListKey(s));
          if (!u) return s;
          return { ...s, nodeStatus: u.status };
        })
      );
    }

    void tick();
    const poll = setInterval(() => {
      void tick();
    }, 3000);
    return () => clearInterval(poll);
  }, [nodeKeysSerialized]);

  useEffect(() => {
    if (sessions.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(async () => {
      const cur = sessionsRef.current;
      const hasReal = cur.some(
        (s) =>
          !isMiningSessionNode(s) && realKeysRef.current.has(networkKey(s.networkId, s.environment))
      );
      if (hasReal && window.desktopAPI?.getRealMiningStats) {
        const updates: Array<{ networkId: string; env: NetworkEnvironment; hashrate: number; shares: number }> = [];
        for (const s of cur) {
          if (isMiningSessionNode(s)) continue;
          const key = networkKey(s.networkId, s.environment);
          if (realKeysRef.current.has(key)) {
            const stats = await window.desktopAPI.getRealMiningStats(s.networkId, s.environment);
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
              if (isMiningSessionNode(s)) return s;
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
    stopSession,
    registerNodeSession,
    isMining,
  };

  return <MiningContext.Provider value={value}>{children}</MiningContext.Provider>;
}

export function useMining() {
  const context = useContext(MiningContext);
  if (!context) throw new Error('useMining must be used within MiningProvider');
  return context;
}
