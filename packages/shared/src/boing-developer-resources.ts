import { BOING_TESTNET_PUBLIC_RPC_URL } from './boing-testnet-node';

/** Default JSON-RPC when a Boing node is running from VibeMiner (same as boing-node --rpc-port 8545). */
export const BOING_LOCAL_RPC_DEFAULT = 'http://127.0.0.1:8545';

export type BoingToolkitLink = {
  label: string;
  href: string;
  hint?: string;
};

/** Curated links for testnet QA, deploy, reference token/NFT, and operator tooling. */
export const BOING_TESTNET_TOOLKIT_LINKS: BoingToolkitLink[] = [
  {
    label: 'Faucet',
    href: 'https://boing.network/faucet',
    hint: 'Request testnet BOING via the public RPC configured on that page.',
  },
  {
    label: 'QA registry & pool (boing.observer)',
    href: 'https://boing.observer/qa',
    hint: 'Live rules require public RPC with boing_getQaRegistry and boing_qaPoolConfig.',
  },
  {
    label: 'Testnet join & bootnodes',
    href: 'https://boing.network/testnet/join',
  },
  {
    label: 'Boing SDK (TypeScript)',
    href: 'https://github.com/Boing-Network/boing.network/tree/main/boing-sdk#readme',
    hint: 'qaCheck, simulate, submit — use with a node RPC URL.',
  },
  {
    label: 'Express, Observer & partners (handoff)',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/HANDOFF-DEPENDENT-PROJECTS.md',
    hint: 'Central backlog for extension, explorer, and dApps; verification commands incl. native-boing-tutorial print-native-dex-routes; pairs with THREE-CODEBASE-ALIGNMENT.md.',
  },
  {
    label: 'Pre-flight RPC (VibeMiner operators)',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/PRE-VIBEMINER-NODE-COMMANDS.md',
    hint: 'preflight-rpc, check-testnet-rpc — smoke public RPC before/after tunnel or node upgrades.',
  },
  {
    label: 'dApp integration (native DEX, wallet RPC)',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-DAPP-INTEGRATION.md',
    hint: 'Swap pre-flight, simulateTransaction; routing via boing-sdk — see tutorial §7c3 for print-native-dex-routes env.',
  },
  {
    label: 'Native AMM — calldata & CREATE2',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/NATIVE-AMM-CALLDATA.md',
    hint: 'Deploy constant-product pool bytecode; precompute pool AccountId before submit.',
  },
  {
    label: 'Ops — publish canonical testnet pool id',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md',
    hint: 'After pool is on-chain: hex + deploy method for RPC spec, TESTNET, and boing.finance.',
  },
  {
    label: 'Self-hosted RPC + pool (operators)',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/DEVNET-OPERATOR-NATIVE-AMM.md',
    hint: 'CORS, deploy pool on your node, point Express / boing.finance at your RPC.',
  },
  {
    label: 'QA & deploy rules',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/QUALITY-ASSURANCE-NETWORK.md',
  },
  {
    label: 'Reference token (calldata)',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-REFERENCE-TOKEN.md',
  },
  {
    label: 'Reference NFT (calldata)',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/BOING-REFERENCE-NFT.md',
  },
  {
    label: 'Boing Network Hub (desktop)',
    href: 'https://github.com/Boing-Network/boing.network/releases?q=desktop-hub&expanded=true',
    hint: 'QA operator flows; download latest Hub release from boing.network.',
  },
  {
    label: 'Verify public RPC (operator)',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/INFRASTRUCTURE-SETUP.md',
    hint: 'Run scripts/verify-public-testnet-rpc.mjs after upgrading the node behind the tunnel.',
  },
  {
    label: 'RUNBOOK — canonical native DEX RPC hints',
    href: 'https://github.com/Boing-Network/boing.network/blob/main/docs/RUNBOOK.md',
    hint: 'BOING_CANONICAL_NATIVE_* and BOING_DEX_* on boing-node; VibeMiner injects testnet defaults when unset (BOING_TESTNET_CANONICAL_NATIVE_ENV).',
  },
];

export { BOING_TESTNET_PUBLIC_RPC_URL };
