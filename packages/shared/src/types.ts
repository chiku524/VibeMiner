import type { BlockchainNetworkValidated } from './schema';

/** Use the validated type everywhere so only schema-valid data flows through the app. */
export type BlockchainNetwork = BlockchainNetworkValidated;

/** Environment: mainnet for production miners & sync; devnet for testing. */
export type NetworkEnvironment = 'mainnet' | 'devnet';

export type NetworkStatus = 'live' | 'coming-soon' | 'requested';

export interface MiningSession {
  networkId: string;
  environment: NetworkEnvironment;
  startedAt: number;
  hashrate: number;
  shares: number;
  estimatedEarnings: string;
  isActive: boolean;
}
