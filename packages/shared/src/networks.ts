import type { BlockchainNetwork } from './types';
import type { NetworkEnvironment } from './schema';
import { parseNetwork, parseNetworkList } from './schema';
import {
  BOING_TESTNET_DEFAULT_LINUX_COMMAND_TEMPLATE,
  BOING_TESTNET_DEFAULT_LINUX_DOWNLOAD_URL,
  BOING_TESTNET_DEFAULT_LINUX_VALIDATOR_COMMAND_TEMPLATE,
  BOING_TESTNET_DEFAULT_MACOS_AARCH64_COMMAND_TEMPLATE,
  BOING_TESTNET_DEFAULT_MACOS_AARCH64_DOWNLOAD_URL,
  BOING_TESTNET_DEFAULT_MACOS_AARCH64_VALIDATOR_COMMAND_TEMPLATE,
  BOING_TESTNET_DEFAULT_WINDOWS_COMMAND_TEMPLATE,
  BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL,
  BOING_TESTNET_DEFAULT_WINDOWS_VALIDATOR_COMMAND_TEMPLATE,
  BOING_TESTNET_PUBLIC_RPC_URL,
  BOING_TESTNET_SUGGESTED_NODE_DISK_GB,
  BOING_TESTNET_SUGGESTED_NODE_RAM_MB,
} from './boing-testnet-node';

/** Raw mainnet networks (production). Miners and networks stay in sync here. */
const MAINNET_NETWORKS_RAW: unknown[] = [
  {
    id: 'monero',
    name: 'Monero',
    symbol: 'XMR',
    description: 'Privacy-focused cryptocurrency. CPU mining with RandomX. Networks need hash rate for security.',
    icon: '⟠',
    algorithm: 'RandomX',
    environment: 'mainnet',
    poolUrl: 'pool.supportxmr.com',
    poolPort: 3333,
    website: 'https://www.getmonero.org',
    status: 'live',
    rewardRate: '~0.0003 XMR/day (est.)',
    minPayout: '0.003 XMR',
    nodeDiskGb: 150,
    nodeRamMb: 4096,
  },
  {
    id: 'raptoreum',
    name: 'Raptoreum',
    symbol: 'RTM',
    description: 'Smart chain with Ghostrider algorithm. Community-driven, welcomes new miners.',
    icon: '🦖',
    algorithm: 'Ghostrider',
    environment: 'mainnet',
    poolUrl: 'rtm.pukkapool.com',
    poolPort: 3052,
    website: 'https://raptoreum.com',
    status: 'live',
    rewardRate: 'Variable',
    minPayout: '10 RTM',
    nodeDiskGb: 15,
    nodeRamMb: 2048,
  },
  {
    id: 'ergo',
    name: 'Ergo',
    symbol: 'ERG',
    description: 'DeFi and contracts on a proof-of-work chain. Autolykos2 GPU-friendly algorithm.',
    icon: '🟢',
    algorithm: 'Autolykos2',
    environment: 'mainnet',
    poolUrl: 'erg.2miners.com',
    poolPort: 8888,
    website: 'https://ergoplatform.org',
    status: 'live',
    rewardRate: 'Variable',
    minPayout: '0.01 ERG',
    nodeDiskGb: 50,
    nodeRamMb: 4096,
  },
  {
    id: 'kaspa',
    name: 'Kaspa',
    symbol: 'KAS',
    description: 'Fast layer-1 with blockDAG. kHeavyHash supports GPU and CPU mining.',
    icon: '◈',
    algorithm: 'kHeavyHash',
    environment: 'mainnet',
    poolUrl: 'kas.2miners.com',
    poolPort: 2020,
    website: 'https://kaspa.org',
    status: 'live',
    rewardRate: 'Variable',
    minPayout: '100 KAS',
    nodeDiskGb: 12,
    nodeRamMb: 4096,
  },
  {
    id: 'nexa',
    name: 'Nexa',
    symbol: 'NEXA',
    description: 'Scalable Bitcoin-style chain. SHA256 and custom mining for broad participation.',
    icon: '◆',
    algorithm: 'SHA256 / NexaHash',
    environment: 'mainnet',
    website: 'https://nexa.org',
    status: 'coming-soon',
    rewardRate: 'TBD',
    minPayout: 'TBD',
  },
  {
    id: 'custom-request',
    name: 'Your Network',
    symbol: '—',
    description: 'Blockchain projects can request our mining service. We onboard new networks to grow decentralization.',
    icon: '✦',
    algorithm: '—',
    environment: 'mainnet',
    status: 'requested',
    requestedBy: 'Network teams',
  },
];

/** Raw devnet networks (testing). For networks and miners to test integration before mainnet. */
const DEVNET_NETWORKS_RAW: unknown[] = [
  {
    id: 'monero-devnet',
    name: 'Monero (Devnet)',
    symbol: 'XMR',
    description: 'Monero test network for pool and miner integration testing. No real value.',
    icon: '⟠',
    algorithm: 'RandomX',
    environment: 'devnet',
    poolUrl: 'pool.supportxmr.com',
    poolPort: 3333,
    website: 'https://www.getmonero.org',
    status: 'live',
    rewardRate: 'Test only',
    minPayout: 'N/A',
  },
  {
    id: 'kaspa-devnet',
    name: 'Kaspa (Devnet)',
    symbol: 'KAS',
    description: 'Kaspa testnet for validating mining and sync before switching to mainnet.',
    icon: '◈',
    algorithm: 'kHeavyHash',
    environment: 'devnet',
    poolUrl: 'kas.2miners.com',
    poolPort: 2020,
    website: 'https://kaspa.org',
    status: 'live',
    rewardRate: 'Test only',
    minPayout: 'N/A',
  },
  {
    id: 'ergo-devnet',
    name: 'Ergo (Devnet)',
    symbol: 'ERG',
    description: 'Ergo test network for developers and miners to test tooling and pools.',
    icon: '🟢',
    algorithm: 'Autolykos2',
    environment: 'devnet',
    poolUrl: 'erg.2miners.com',
    poolPort: 8888,
    website: 'https://ergoplatform.org',
    status: 'live',
    rewardRate: 'Test only',
    minPayout: 'N/A',
  },
  // Boing testnet — integration spec: github.com/chiku524/boing.network docs/VIBEMINER-INTEGRATION.md
  {
    id: 'boing-devnet',
    name: 'Boing (Testnet)',
    symbol: 'BOING',
    description:
      'Boing testnet: full node or validator (boing-node) via presets below. Local RPC on 8545 with --faucet-enable; bootnodes match boing.network testnet config. Public RPC for faucets/explorer: see testnet join page. Use a current release (e.g. testnet-v0.1.3+) for boing_getQaRegistry and related JSON-RPC. PoS—stake BOING to validate.',
    icon: '◎',
    algorithm: 'PoS',
    environment: 'devnet',
    website: 'https://boing.network',
    status: 'live',
    rewardRate: 'Test only',
    minPayout: 'N/A',
    nodeDownloadUrl: BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL,
    nodeCommandTemplate: BOING_TESTNET_DEFAULT_WINDOWS_COMMAND_TEMPLATE,
    nodeDiskGb: BOING_TESTNET_SUGGESTED_NODE_DISK_GB,
    nodeRamMb: BOING_TESTNET_SUGGESTED_NODE_RAM_MB,
    nodePresets: [
      {
        presetId: 'windows',
        label: 'Windows (x86_64) — full node',
        description: `Testnet zip; bootnodes match boing.network. Public RPC: ${BOING_TESTNET_PUBLIC_RPC_URL}`,
        commandTemplate: BOING_TESTNET_DEFAULT_WINDOWS_COMMAND_TEMPLATE,
      },
      {
        presetId: 'windows-validator',
        label: 'Windows (x86_64) — validator',
        description: 'Same binary; adds --validator for block production (stake BOING).',
        commandTemplate: BOING_TESTNET_DEFAULT_WINDOWS_VALIDATOR_COMMAND_TEMPLATE,
      },
      {
        presetId: 'linux',
        label: 'Linux (x86_64) — full node',
        nodeDownloadUrl: BOING_TESTNET_DEFAULT_LINUX_DOWNLOAD_URL,
        commandTemplate: BOING_TESTNET_DEFAULT_LINUX_COMMAND_TEMPLATE,
      },
      {
        presetId: 'linux-validator',
        label: 'Linux (x86_64) — validator',
        nodeDownloadUrl: BOING_TESTNET_DEFAULT_LINUX_DOWNLOAD_URL,
        commandTemplate: BOING_TESTNET_DEFAULT_LINUX_VALIDATOR_COMMAND_TEMPLATE,
      },
      {
        presetId: 'macos-arm64',
        label: 'macOS (Apple Silicon) — full node',
        nodeDownloadUrl: BOING_TESTNET_DEFAULT_MACOS_AARCH64_DOWNLOAD_URL,
        commandTemplate: BOING_TESTNET_DEFAULT_MACOS_AARCH64_COMMAND_TEMPLATE,
      },
      {
        presetId: 'macos-arm64-validator',
        label: 'macOS (Apple Silicon) — validator',
        nodeDownloadUrl: BOING_TESTNET_DEFAULT_MACOS_AARCH64_DOWNLOAD_URL,
        commandTemplate: BOING_TESTNET_DEFAULT_MACOS_AARCH64_VALIDATOR_COMMAND_TEMPLATE,
      },
    ],
  },
];

function validateAndGetNetworks(raw: unknown[], label: string): BlockchainNetwork[] {
  const { valid, errors } = parseNetworkList(raw);
  if (errors.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(`[${label}] Some entries failed validation:`, errors);
  }
  return valid;
}

/** Validated mainnet networks only. Use for production mining and display. */
const MAINNET_NETWORKS: BlockchainNetwork[] = validateAndGetNetworks(MAINNET_NETWORKS_RAW, 'mainnet');

/** Validated devnet networks only. Use for testing section and devnet mining. */
const DEVNET_NETWORKS: BlockchainNetwork[] = validateAndGetNetworks(DEVNET_NETWORKS_RAW, 'devnet');

/** All validated networks (mainnet + devnet). Order: mainnet first, then devnet. */
export const BLOCKCHAIN_NETWORKS: BlockchainNetwork[] = [...MAINNET_NETWORKS, ...DEVNET_NETWORKS];

/** Get all mainnet networks. Safe to use in UI and dashboard. */
export function getMainnetNetworks(): BlockchainNetwork[] {
  return MAINNET_NETWORKS;
}

/** Mainnet networks that are actually listed (excludes "Your Network" / request CTA). Use for mining grid and API. */
export function getMainnetNetworksListed(): BlockchainNetwork[] {
  return MAINNET_NETWORKS.filter((n) => n.status !== 'requested');
}

/** Get all devnet networks. Safe to use in UI and dashboard. */
export function getDevnetNetworks(): BlockchainNetwork[] {
  return DEVNET_NETWORKS;
}

/** Get network by id. Optional environment ensures mainnet/devnet uniqueness (e.g. monero vs monero-devnet). */
export function getNetworkById(
  id: string,
  environment?: NetworkEnvironment
): BlockchainNetwork | undefined {
  if (environment === 'mainnet') return MAINNET_NETWORKS.find((n) => n.id === id);
  if (environment === 'devnet') return DEVNET_NETWORKS.find((n) => n.id === id);
  return BLOCKCHAIN_NETWORKS.find((n) => n.id === id);
}

/** Get only networks that are live (mining available). */
export function getLiveNetworks(environment?: NetworkEnvironment): BlockchainNetwork[] {
  const list = environment === 'devnet' ? DEVNET_NETWORKS : environment === 'mainnet' ? MAINNET_NETWORKS : BLOCKCHAIN_NETWORKS;
  return list.filter((n) => n.status === 'live');
}

/** Network IDs that are incentivized testnets (e.g. Boing). Shown with a special badge in the UI. */
export const INCENTIVIZED_TESTNET_IDS: string[] = ['boing-devnet'];

/** Add a new network at runtime (e.g. from API). Returns the validated network or throws. Use parseNetwork() for safe parse. */
export function registerNetwork(raw: unknown): BlockchainNetwork {
  const result = parseNetwork(raw);
  if (!result.success) throw result.error;
  return result.data;
}
