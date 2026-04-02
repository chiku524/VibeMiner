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

function desktopNodeRowKey(d: DesktopRunningNodeRow): string {
  return sessionListKey({
    kind: 'node',
    networkId: d.networkId,
    environment: d.environment as NetworkEnvironment,
    presetId: sanitizeNodePresetId(d.nodePresetId),
    startedAt: 0,
    isActive: true,
  });
}

/** Mark a single node session as exited so the UI updates immediately (reconciled on next desktop list sync). */
function markNodeSessionProcessExited(prev: MiningSession[], sessionKey: string, at: number): MiningSession[] {
  return prev.map((s) => {
    if (!isMiningSessionNode(s) || sessionListKey(s) !== sessionKey) return s;
    if (s.nodeProcessExitedAt != null) return s;
    return { ...s, nodeProcessExitedAt: at };
  });
}

/**
 * Sync running nodes from the desktop; keep ended node rows (with logs) until dismissed.
 *
 * If the user already stopped a session (`nodeProcessExitedAt` set) but `listRunningNodes` is briefly
 * stale and still returns that node, we must **not** resurrect a "running" row — that kept the dashboard
 * showing a live node after Stop while the process was already gone.
 */
function mergeDesktopNodeRowsIntoSessions(
  prev: MiningSession[],
  rows: DesktopRunningNodeRow[]
): MiningSession[] {
  const mining = prev.filter((s) => !isMiningSessionNode(s));
  const prevNodes = prev.filter(isMiningSessionNode);
  const now = Date.now();

  const exitedKeys = new Set(
    prevNodes.filter((n) => n.nodeProcessExitedAt != null).map((n) => sessionListKey(n))
  );

  const runningNodes: MiningSessionNode[] = rows
    .filter((d) => !exitedKeys.has(desktopNodeRowKey(d)))
    .map((d) => {
      const key = desktopNodeRowKey(d);
      const old = prevNodes.find((s) => sessionListKey(s) === key);
      const presetId = sanitizeNodePresetId(d.nodePresetId);
      return {
        kind: 'node' as const,
        networkId: d.networkId,
        environment: d.environment as NetworkEnvironment,
        presetId,
        startedAt: d.startedAt > 0 ? Number(d.startedAt) : old?.startedAt ?? now,
        isActive: true,
        nodeStatus: old?.nodeStatus,
      };
    });

  const runningKeys = new Set(runningNodes.map((r) => sessionListKey(r)));

  const retained: MiningSessionNode[] = [];
  for (const n of prevNodes) {
    const key = sessionListKey(n);
    if (runningKeys.has(key)) {
      continue;
    }
    if (n.nodeProcessExitedAt != null) {
      retained.push(n);
    } else {
      retained.push({ ...n, nodeProcessExitedAt: now });
    }
  }

  return [...mining, ...runningNodes, ...retained];
}

type MiningContextValue = {
  sessions: MiningSession[];
  startMining: (network: BlockchainNetwork, walletAddress?: string) => Promise<{ ok: boolean; error?: string }>;
  stopMining: (networkId: string, environment?: NetworkEnvironment) => void;
  /** Resolves after desktop stop + session list sync for node sessions. */
  stopSession: (session: MiningSession) => Promise<void>;
  registerNodeSession: (args: {
    networkId: string;
    environment: NetworkEnvironment;
    presetId: string;
    startedAt?: number;
  }) => void;
  dismissNodeSession: (session: MiningSessionNode) => void;
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

  const stopSession = useCallback((session: MiningSession): Promise<void> => {
    if (isMiningSessionNode(session)) {
      const stoppedKey = sessionListKey(session);
      const preset = sanitizeNodePresetId(session.presetId);
      return (async () => {
        try {
          await window.desktopAPI?.stopNode?.(session.networkId, session.environment, preset);
        } catch (e) {
          console.warn('stopNode failed', e);
        }
        const listFn = window.desktopAPI?.listRunningNodes;
        let rows: DesktopRunningNodeRow[] = [];
        if (listFn) {
          try {
            const list = await listFn();
            if (Array.isArray(list)) {
              rows = list as DesktopRunningNodeRow[];
            } else {
              console.warn('listRunningNodes returned non-array', list);
            }
          } catch (e) {
            console.warn('listRunningNodes failed', e);
          }
        }
        const exitedAt = Date.now();
        setSessions((prev) => {
          const marked = markNodeSessionProcessExited(prev, stoppedKey, exitedAt);
          if (listFn) {
            return mergeDesktopNodeRowsIntoSessions(marked, rows);
          }
          return prev.filter((s) => sessionListKey(s) !== stoppedKey);
        });
      })();
    }
    const key = networkKey(session.networkId, session.environment);
    if (realKeysRef.current.has(key) && window.desktopAPI?.stopRealMining) {
      window.desktopAPI.stopRealMining(session.networkId, session.environment);
      realKeysRef.current.delete(key);
    }
    setSessions((prev) => prev.filter((s) => sessionListKey(s) !== sessionListKey(session)));
    return Promise.resolve();
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

  const dismissNodeSession = useCallback((session: MiningSessionNode) => {
    const k = sessionListKey(session);
    setSessions((prev) => prev.filter((s) => sessionListKey(s) !== k));
  }, []);

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
    }, 2500);
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
    .filter((s) => isMiningSessionNode(s) && s.nodeProcessExitedAt == null)
    .map(sessionListKey)
    .sort()
    .join('|');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.desktopAPI?.getNodeStatus) return;
    if (!nodeKeysSerialized) return;

    async function tick() {
      const getNodeStatus = window.desktopAPI?.getNodeStatus;
      if (!getNodeStatus) return;
      const nodeSessions = sessionsRef.current
        .filter(isMiningSessionNode)
        .filter((s) => s.nodeProcessExitedAt == null);
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
    dismissNodeSession,
    isMining,
  };

  return <MiningContext.Provider value={value}>{children}</MiningContext.Provider>;
}

export function useMining() {
  const context = useContext(MiningContext);
  if (!context) throw new Error('useMining must be used within MiningProvider');
  return context;
}
