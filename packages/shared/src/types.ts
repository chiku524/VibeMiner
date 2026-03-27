import type { BlockchainNetworkValidated } from './schema';

/** Use the validated type everywhere so only schema-valid data flows through the app. */
export type BlockchainNetwork = BlockchainNetworkValidated;

/** Environment: mainnet for production miners & sync; devnet for testing. */
export type NetworkEnvironment = 'mainnet' | 'devnet';

export type NetworkStatus = 'live' | 'coming-soon' | 'requested';

/** Pool mining session (in-app stats; desktop may back real mining). */
export interface MiningSessionMining {
  kind?: 'mining';
  networkId: string;
  environment: NetworkEnvironment;
  startedAt: number;
  hashrate: number;
  shares: number;
  estimatedEarnings: string;
  isActive: boolean;
}

/** Full node process started from the desktop app. */
export interface MiningSessionNode {
  kind: 'node';
  networkId: string;
  environment: NetworkEnvironment;
  startedAt: number;
  isActive: boolean;
  presetId: string;
  /** Last status line from desktop getNodeStatus, if any */
  nodeStatus?: string | null;
}

export type MiningSession = MiningSessionMining | MiningSessionNode;

export function isMiningSessionNode(session: MiningSession): session is MiningSessionNode {
  return session.kind === 'node';
}

export function isMiningSessionMining(session: MiningSession): session is MiningSessionMining {
  return !isMiningSessionNode(session);
}

/** Unique key for lists (same network may have mining + node, or multiple presets). */
export function sessionListKey(session: MiningSession): string {
  if (isMiningSessionNode(session)) {
    return `node:${session.environment}:${session.networkId}:${session.presetId}`;
  }
  return `mining:${session.environment}:${session.networkId}`;
}
