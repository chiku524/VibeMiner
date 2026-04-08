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
 */

/** JSON-RPC method for live rule registry (Boing Observer / transparency). Requires recent boing-node. */
export const BOING_RPC_METHOD_GET_QA_REGISTRY = 'boing_getQaRegistry';

/** Pinned release for default downloads when no listing overrides exist (includes `boing_getQaRegistry`). */
export const BOING_TESTNET_DEFAULT_DOWNLOAD_TAG = 'testnet-v0.1.8';

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

const BOING_TESTNET_NODE_ARGS_CORE = `--p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes ${BOING_TESTNET_BOOTNODES_CLI} --rpc-port 8545 --faucet-enable`;

export const BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL = `https://github.com/Boing-Network/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-windows-x86_64.zip`;

export const BOING_TESTNET_DEFAULT_LINUX_DOWNLOAD_URL = `https://github.com/Boing-Network/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-linux-x86_64.zip`;

export const BOING_TESTNET_DEFAULT_MACOS_AARCH64_DOWNLOAD_URL = `https://github.com/Boing-Network/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-macos-aarch64.zip`;

/**
 * SHA-256 of official GitHub **zip** assets for {@link BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}.
 * Used when upgrading stale D1/API listing URLs (see `patchBlockchainNetworkJsonForBoing`).
 * Refresh from `website/scripts/network-listings-release-sql.mjs <tag>` when you cut a new release.
 */
export const BOING_TESTNET_ZIP_SHA256_WINDOWS =
  '2cea7a6f093990c02bf405a20caf3b68bb59b434b69421449ab6bb4fec96a16a';

export const BOING_TESTNET_ZIP_SHA256_LINUX =
  '70355e6e6c6c9f33804957df1c215a531bec0c329fe5c1fc48f3d23350bd296c';

export const BOING_TESTNET_ZIP_SHA256_MACOS_AARCH64 =
  '435216299129a6bcc04d4775cf7956315246c4860bf2fd8a769df93bea7e7bbc';

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

/** Canonical GitHub org for official node zips (see Boing `HANDOFF-DEPENDENT-PROJECTS.md`). */
const CANONICAL_BOING_GITHUB_ORG_PATH = 'github.com/Boing-Network/boing.network/';
const CANONICAL_BOING_RELEASE_DL = `${CANONICAL_BOING_GITHUB_ORG_PATH}releases/download/`;
/** Tags before QA transparency RPC (`boing_getQaRegistry`) existed in published Windows zips. */
const STALE_TESTNET_TAG_RE = /\/download\/(testnet-v0\.1\.(?:0|1|2|3|4|5|6|7))\//;

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
