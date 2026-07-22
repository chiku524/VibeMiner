/**
 * Boing testnet node policy: align VibeMiner-offered commands with public RPC + faucet expectations
 * (--faucet-enable, bootnodes). CORS for boing.finance is enforced in boing-node itself; users need a
 * recent binary from boing.network releases.
 *
 * **New RPC methods:** VibeMiner only runs whatever is inside the downloaded zip. Read-only methods such as
 * `boing_getQaRegistry` (QA transparency / boing.observer) require a boing-node build that includes them.
 * After you publish a new GitHub release with updated binaries, bump {@link BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}
 * and matching URLs here (offline fallback) + docs. **Live installs:** VibeMiner’s `GET /api/networks` merges
 * {@link fetchBoingOfficialNetworks} from `https://boing.network/api/networks` over these defaults when the fetch
 * succeeds (see `boing-official-api.ts`). See `docs/BOING_QA_RPC_AND_RELEASES.md`.
 *
 * **Native AMM / canonical pool:** VibeMiner does not configure a pool `AccountId`. Operators deploy the pool
 * via Boing Express + SDK (or scripts) against this node’s `http://127.0.0.1:8545` (or public RPC), then
 * publish the frozen hex per Boing `OPS-CANONICAL-TESTNET-NATIVE-AMM-POOL.md`. See `boing-developer-resources.ts`
 * (`BOING_TESTNET_TOOLKIT_LINKS`) for dashboard links to native AMM + ops docs.
 *
 * **Canonical RPC hints + DEX discovery tuning:** the desktop app injects **`BOING_TESTNET_CANONICAL_NATIVE_ENV`**
 * when starting a node whose network id contains `boing`, unless already set in the environment or
 * **`VIBEMINER_SKIP_BOING_CANONICAL_DEFAULTS=1`**. Values match public testnet (`tools/boing-node-public-testnet.env.example`
 * in boing.network), including **`BOING_CANONICAL_NATIVE_*`** and **`BOING_DEX_*`** scan/decimal defaults for
 * **`boing_listDexPools`** / **`boing_listDexTokens`**. Self-hosted nodes without VibeMiner still set these on the **boing-node** process
 * (see `docs/RUNBOOK.md`). Restarting **public** RPC after changing hints is **infra** (operators restart the process).
 */

/** JSON-RPC method for live rule registry (Boing Observer / transparency). Requires recent boing-node. */
export const BOING_RPC_METHOD_GET_QA_REGISTRY = 'boing_getQaRegistry';

/** Pinned release for default downloads when no listing overrides exist (50k faucet + stake one-click). */
export const BOING_TESTNET_DEFAULT_DOWNLOAD_TAG = 'testnet-v0.1.10';

/**
 * Bootnode multiaddrs — keep in sync with `website/src/config/testnet.ts` (`PUBLIC_BOOTNODES` fallback).
 * Comma-separated list matches `boing-node --bootnodes` (dials each on startup).
 */
export const BOING_TESTNET_BOOTNODES = [
  '/ip4/73.84.106.121/tcp/4001',
  '/ip4/73.84.106.121/tcp/4001',
] as const;

/** Comma-separated multiaddrs for `--bootnodes`. */
export const BOING_TESTNET_BOOTNODES_CLI = BOING_TESTNET_BOOTNODES.join(',');

/** Public JSON-RPC used by faucet pages and boing.observer (not the same as a local VibeMiner node). */
export const BOING_TESTNET_PUBLIC_RPC_URL = 'https://testnet-rpc.boing.network/';

/**
 * Default public-testnet canonical native DEX AccountIds for `boing_getNetworkInfo.end_user`.
 * The Tauri app applies these when spawning `boing-node` if unset — keep in sync with
 * `boing.network/tools/boing-node-public-testnet.env.example` and `node.rs` (`BOING_TESTNET_CANONICAL_NATIVE_DEFAULTS`).
 * **Source of truth:** `boing-sdk` `canonicalTestnet.ts` + `canonicalTestnetDex.ts` (live testnet stack on public RPC).
 */
export const BOING_TESTNET_CHAIN_ID = '6913';
export const BOING_TESTNET_CHAIN_NAME = 'Boing Testnet';

export const BOING_TESTNET_CANONICAL_NATIVE_ENV: Readonly<Record<string, string>> = {
  BOING_CHAIN_ID: BOING_TESTNET_CHAIN_ID,
  BOING_CHAIN_NAME: BOING_TESTNET_CHAIN_NAME,
  BOING_CANONICAL_NATIVE_CP_POOL:
    '0x7247ddc3180fdc4d3fd1e716229bfa16bad334a07d28aa9fda9ad1bfa7bdacc3',
  BOING_CANONICAL_NATIVE_DEX_FACTORY:
    '0x58112627fc84618a27b82e9af82bc9a51761c6d3cca1260c93d56d22b6c481a1',
  BOING_CANONICAL_NATIVE_DEX_MULTIHOP_SWAP_ROUTER:
    '0xf801cd1aa5ec402f89a2f394b49e6b0c136264d8945b16a4a6a81a188b18acc1',
  BOING_CANONICAL_NATIVE_DEX_LEDGER_ROUTER_V2:
    '0x33334ff73c44c93335ac5e69938a52ea65fa77b062d1961ed22c131adaa31e0f',
  BOING_CANONICAL_NATIVE_DEX_LEDGER_ROUTER_V3:
    '0x2c90ffcddeb2683219b4b8143a91d7b93f249bcb0d9523c8b4f2111de668b79a',
  BOING_CANONICAL_NATIVE_AMM_LP_VAULT:
    '0x937d09ee8e4dcc521c812566ad4930792e74ad004ecb3ae2cc73dc015813aa8d',
  BOING_CANONICAL_NATIVE_LP_SHARE_TOKEN:
    '0x101201403f573e5b1d6d5c6b93d52d12c68957f4a228d5dad76e78c747044421',
  BOING_DEX_TOKEN_METADATA_SCAN_BLOCKS: '8192',
  BOING_DEX_DISCOVERY_MAX_RECEIPT_SCANS: '500000',
  BOING_DEX_TOKEN_DECIMALS_JSON: '{}',
} as const;

const BOING_TESTNET_NODE_ARGS_CORE = `--p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes ${BOING_TESTNET_BOOTNODES_CLI} --rpc-port 8545 --faucet-enable`;

export const BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL = `https://github.com/Boing-Network/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-windows-x86_64.zip`;

export const BOING_TESTNET_DEFAULT_LINUX_DOWNLOAD_URL = `https://github.com/Boing-Network/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-linux-x86_64.zip`;

export const BOING_TESTNET_DEFAULT_MACOS_AARCH64_DOWNLOAD_URL = `https://github.com/Boing-Network/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-macos-aarch64.zip`;

/**
 * SHA-256 of official GitHub **zip** assets for {@link BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}.
 * Used when upgrading stale D1/API listing URLs (see `patchBlockchainNetworkJsonForBoing`).
 * Refresh from `website/scripts/network-listings-release-sql.mjs <tag>` when you cut a new release, or run `node scripts/print-boing-testnet-zip-shas.mjs <tag>`.
 */
export const BOING_TESTNET_ZIP_SHA256_WINDOWS =
  '76c89f0e25069bb4462244778291c673590b818547f637af9205b1efa2ffce8e';

export const BOING_TESTNET_ZIP_SHA256_LINUX =
  'b576df6288d9ead28dd9ba380850e97738b7f9cf058ab95ed925293162409561';

export const BOING_TESTNET_ZIP_SHA256_MACOS_AARCH64 =
  '5ddd479223be9a195dd6b33f60cd1001836af754720bde5766f44e0e8d7b984f';

/** Full node + faucet (matches Boing testnet join / INFRASTRUCTURE-SETUP). */
export const BOING_TESTNET_DEFAULT_WINDOWS_COMMAND_TEMPLATE =
  `boing-node-windows-x86_64.exe --data-dir {dataDir} ${BOING_TESTNET_NODE_ARGS_CORE}`;

export const BOING_TESTNET_DEFAULT_LINUX_COMMAND_TEMPLATE =
  `boing-node-linux-x86_64 --data-dir {dataDir} ${BOING_TESTNET_NODE_ARGS_CORE}`;

export const BOING_TESTNET_DEFAULT_MACOS_AARCH64_COMMAND_TEMPLATE =
  `boing-node-macos-aarch64 --data-dir {dataDir} ${BOING_TESTNET_NODE_ARGS_CORE}`;

/** Validator mode (append after full-node template pattern). */
export const BOING_TESTNET_DEFAULT_WINDOWS_VALIDATOR_COMMAND_TEMPLATE = `${BOING_TESTNET_DEFAULT_WINDOWS_COMMAND_TEMPLATE} --validator`;

export const BOING_TESTNET_DEFAULT_LINUX_VALIDATOR_COMMAND_TEMPLATE = `${BOING_TESTNET_DEFAULT_LINUX_COMMAND_TEMPLATE} --validator`;

export const BOING_TESTNET_DEFAULT_MACOS_AARCH64_VALIDATOR_COMMAND_TEMPLATE = `${BOING_TESTNET_DEFAULT_MACOS_AARCH64_COMMAND_TEMPLATE} --validator`;

/**
 * Public stake-derived validator: same CLI as local validator (`--validator`).
 * VibeMiner injects `BOING_VALIDATOR_SET=stake`, `BOING_VALIDATOR_KEY`, and `BOING_LEADER_ELECTION=vrf`,
 * then faucets + Bonds on the public testnet RPC (min stake 10_000).
 */
export const BOING_TESTNET_DEFAULT_WINDOWS_PUBLIC_VALIDATOR_COMMAND_TEMPLATE =
  BOING_TESTNET_DEFAULT_WINDOWS_VALIDATOR_COMMAND_TEMPLATE;

export const BOING_TESTNET_DEFAULT_LINUX_PUBLIC_VALIDATOR_COMMAND_TEMPLATE =
  BOING_TESTNET_DEFAULT_LINUX_VALIDATOR_COMMAND_TEMPLATE;

export const BOING_TESTNET_DEFAULT_MACOS_AARCH64_PUBLIC_VALIDATOR_COMMAND_TEMPLATE =
  BOING_TESTNET_DEFAULT_MACOS_AARCH64_VALIDATOR_COMMAND_TEMPLATE;

/** Preset ids containing these substrings get stake-set env + one-click Bond. */
export function isBoingPublicStakeValidatorPreset(presetId: string): boolean {
  const p = presetId.toLowerCase();
  return p.includes('public-validator') || p.includes('stake-validator');
}

/** Suggested disk (GiB) for testnet — aligned with VIBEMINER-INTEGRATION.md / heavier receipts+state. */
export const BOING_TESTNET_SUGGESTED_NODE_DISK_GB = 10;

/** Suggested RAM (MiB) for testnet node process. */
export const BOING_TESTNET_SUGGESTED_NODE_RAM_MB = 2048;

export function isBoingNetworkId(id: string): boolean {
  return id.toLowerCase().includes('boing');
}

/** Insert `--faucet-enable` if missing (before `--validator` when present). */
export function ensureBoingFaucetInCommandTemplate(template: string): string {
  const t = template.trim();
  if (!t) return t;
  if (/\bfaucet-enable\b/i.test(t)) return t;
  const m = t.match(/\s--validator(?:\s|$)/);
  if (m && m.index != null) {
    const i = m.index;
    return `${t.slice(0, i)} --faucet-enable${t.slice(i)}`;
  }
  return `${t} --faucet-enable`;
}

/**
 * Replace or insert `--bootnodes` using live `meta.official_bootnodes` (comma-joined).
 * No-op when `bootnodes` is empty.
 */
export function applyBoingBootnodesToCommandTemplate(
  template: string,
  bootnodes: readonly string[],
): string {
  const t = template.trim();
  if (!t || bootnodes.length === 0) return t;
  const cli = bootnodes.map((b) => b.trim()).filter(Boolean).join(',');
  if (!cli) return t;
  if (/\s--bootnodes\s+\S+/.test(t)) {
    return t.replace(/\s--bootnodes\s+\S+/, ` --bootnodes ${cli}`);
  }
  const rpc = t.match(/\s--rpc-port(?:\s|$)/);
  if (rpc && rpc.index != null) {
    return `${t.slice(0, rpc.index)} --bootnodes ${cli}${t.slice(rpc.index)}`;
  }
  return `${t} --bootnodes ${cli}`;
}

/**
 * Parse a user/operator bootnode field (comma or whitespace separated multiaddrs).
 * Example: `/ip4/192.168.1.20/tcp/4001, /ip4/73.84.106.121/tcp/4001`
 */
export function parseBoingBootnodesInput(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** localStorage key for optional custom Boing bootnodes (two-PC / lab). */
export const BOING_CUSTOM_BOOTNODES_STORAGE_KEY = 'vibeminer.boing.customBootnodes';

/**
 * Default Boing one-click preset for an OS: **local validator** (produces blocks even when
 * public bootnodes are unreachable). Full node and public-stake presets remain selectable.
 */
export function pickBoingNodePresetIdForPlatform(
  presets: ReadonlyArray<{ presetId: string; label?: string }>,
  platform: string,
): string | null {
  if (presets.length === 0) return null;
  const os = platform.toLowerCase();
  const token =
    os === 'windows'
      ? 'windows'
      : os === 'macos' || os === 'darwin'
        ? 'macos'
        : os === 'linux'
          ? 'linux'
          : null;
  if (!token) return presets[0]?.presetId ?? null;

  const matchesOs = (p: { presetId: string; label?: string }) => {
    const id = p.presetId.toLowerCase();
    const label = (p.label ?? '').toLowerCase();
    if (token === 'macos') {
      return (
        id.includes('mac') ||
        id.includes('darwin') ||
        label.includes('mac') ||
        label.includes('darwin')
      );
    }
    return id.includes(token) || label.includes(token);
  };

  const localValidator = presets.find((p) => {
    if (!matchesOs(p)) return false;
    const id = p.presetId.toLowerCase();
    return (
      id.includes('validator') &&
      !id.includes('public') &&
      !id.includes('stake')
    );
  });
  if (localValidator) return localValidator.presetId;

  const full = presets.find((p) => {
    if (!matchesOs(p)) return false;
    const id = p.presetId.toLowerCase();
    return !id.includes('validator') && !id.includes('stake');
  });
  if (full) return full.presetId;

  return presets.find(matchesOs)?.presetId ?? presets[0]?.presetId ?? null;
}

/** Canonical GitHub org for official node zips (see Boing `HANDOFF-DEPENDENT-PROJECTS.md`). */
const CANONICAL_BOING_GITHUB_ORG_PATH = 'github.com/Boing-Network/boing.network/';
const CANONICAL_BOING_RELEASE_DL = `${CANONICAL_BOING_GITHUB_ORG_PATH}releases/download/`;
/** Tags before QA transparency RPC (`boing_getQaRegistry`) existed in published Windows zips. */
const STALE_TESTNET_TAG_RE = /\/download\/(testnet-v0\.1\.(?:0|1|2|3|4|5|6|7|8|9))\//;

function zipSha256ForOfficialBoingUrl(url: string): string | undefined {
  let h: string;
  if (url.includes('release-linux-x86_64')) h = BOING_TESTNET_ZIP_SHA256_LINUX;
  else if (url.includes('release-macos-aarch64')) h = BOING_TESTNET_ZIP_SHA256_MACOS_AARCH64;
  else h = BOING_TESTNET_ZIP_SHA256_WINDOWS;
  if (!h || !/^[0-9a-f]{64}$/i.test(h)) return undefined;
  return h;
}

/**
 * Normalize legacy org host and upgrade stale testnet zip tags on official Boing release URLs.
 * Returns null when the URL is not an official Boing GitHub release download or nothing changed.
 */
function upgradeOfficialBoingZipUrl(url: string): { url: string; sha256?: string } | null {
  let next = url.replace(/github\.com\/chiku524\/boing\.network\//g, CANONICAL_BOING_GITHUB_ORG_PATH);
  if (!next.includes(CANONICAL_BOING_RELEASE_DL)) return null;
  if (STALE_TESTNET_TAG_RE.test(next)) {
    next = next.replace(STALE_TESTNET_TAG_RE, `/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/`);
  }
  if (next === url) return null;
  const sha256 = zipSha256ForOfficialBoingUrl(next);
  return sha256 === undefined ? { url: next } : { url: next, sha256 };
}

function patchPresets(presets: unknown): unknown {
  if (!Array.isArray(presets)) return presets;
  return presets.map((p) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return p;
    const row = { ...(p as Record<string, unknown>) };
    if (typeof row.commandTemplate === 'string') {
      row.commandTemplate = ensureBoingFaucetInCommandTemplate(row.commandTemplate);
    }
    return row;
  });
}

function patchBoingStaleReleaseZipUrlsInPresets(presets: unknown): unknown {
  if (!Array.isArray(presets)) return presets;
  return presets.map((p) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return p;
    const row = { ...(p as Record<string, unknown>) };
    if (typeof row.nodeDownloadUrl === 'string') {
      const up = upgradeOfficialBoingZipUrl(row.nodeDownloadUrl);
      if (up) {
        row.nodeDownloadUrl = up.url;
        if (up.sha256) row.nodeBinarySha256 = up.sha256;
        else delete row.nodeBinarySha256;
      }
    }
    return row;
  });
}

/**
 * Apply Boing faucet flag and (for bare `boing-devnet`) default Windows URL/template when missing.
 * Safe for API JSON objects before/without full Zod parse.
 */
export function patchBlockchainNetworkJsonForBoing(n: Record<string, unknown>): Record<string, unknown> {
  const id = typeof n.id === 'string' ? n.id : '';
  if (!isBoingNetworkId(id)) return n;

  const out: Record<string, unknown> = { ...n };

  if (Array.isArray(out.nodePresets) && out.nodePresets.length > 0) {
    out.nodePresets = patchPresets(out.nodePresets);
    out.nodePresets = patchBoingStaleReleaseZipUrlsInPresets(out.nodePresets);
  } else if (typeof out.nodeCommandTemplate === 'string') {
    out.nodeCommandTemplate = ensureBoingFaucetInCommandTemplate(out.nodeCommandTemplate);
  }

  if (typeof out.nodeDownloadUrl === 'string') {
    const up = upgradeOfficialBoingZipUrl(out.nodeDownloadUrl);
    if (up) {
      out.nodeDownloadUrl = up.url;
      if (up.sha256) out.nodeBinarySha256 = up.sha256;
      else delete out.nodeBinarySha256;
    }
  }

  const hasPresets = Array.isArray(out.nodePresets) && out.nodePresets.length > 0;
  const hasUrl = typeof out.nodeDownloadUrl === 'string' && out.nodeDownloadUrl.trim().length > 0;
  const hasTpl = typeof out.nodeCommandTemplate === 'string' && out.nodeCommandTemplate.trim().length > 0;

  if (id === 'boing-devnet' && !hasPresets && (!hasUrl || !hasTpl)) {
    if (!hasUrl) out.nodeDownloadUrl = BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL;
    if (!hasTpl) out.nodeCommandTemplate = BOING_TESTNET_DEFAULT_WINDOWS_COMMAND_TEMPLATE;
    if (out.nodeDiskGb == null) out.nodeDiskGb = BOING_TESTNET_SUGGESTED_NODE_DISK_GB;
    if (out.nodeRamMb == null) out.nodeRamMb = BOING_TESTNET_SUGGESTED_NODE_RAM_MB;
  }

  return out;
}
