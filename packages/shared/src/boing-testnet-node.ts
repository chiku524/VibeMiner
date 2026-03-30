/**
 * Boing testnet node policy: align VibeMiner-offered commands with public RPC + faucet expectations
 * (--faucet-enable, bootnodes). CORS for boing.finance is enforced in boing-node itself; users need a
 * recent binary from boing.network releases.
 *
 * **New RPC methods:** VibeMiner only runs whatever is inside the downloaded zip. Read-only methods such as
 * `boing_getQaRegistry` (QA transparency / boing.observer) require a boing-node build that includes them.
 * After you publish a new GitHub release with updated binaries, bump {@link BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}
 * and matching URLs in `networks.ts` + docs. See `docs/BOING_QA_RPC_AND_RELEASES.md`.
 */

/** JSON-RPC method for live rule registry (Boing Observer / transparency). Requires recent boing-node. */
export const BOING_RPC_METHOD_GET_QA_REGISTRY = 'boing_getQaRegistry';

/** Pinned release for default downloads when no listing overrides exist (includes `boing_getQaRegistry`). */
export const BOING_TESTNET_DEFAULT_DOWNLOAD_TAG = 'testnet-v0.1.4';

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

export const BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL = `https://github.com/chiku524/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-windows-x86_64.zip`;

export const BOING_TESTNET_DEFAULT_LINUX_DOWNLOAD_URL = `https://github.com/chiku524/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-linux-x86_64.zip`;

export const BOING_TESTNET_DEFAULT_MACOS_AARCH64_DOWNLOAD_URL = `https://github.com/chiku524/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-macos-aarch64.zip`;

/**
 * SHA-256 of official GitHub **zip** assets for {@link BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}.
 * Used when upgrading stale D1/API listing URLs (see `patchBlockchainNetworkJsonForBoing`).
 */
export const BOING_TESTNET_ZIP_SHA256_WINDOWS = '50898a02f3cba1effe0c91a6f0ea48d3eed62ab87b7aeb3ebb653b30a1248f65';

export const BOING_TESTNET_ZIP_SHA256_LINUX = 'a96987461201f00d618afad5a494b52837663f90f6d9d3d5c097b6843cad17ab';

export const BOING_TESTNET_ZIP_SHA256_MACOS_AARCH64 = '26fd3477dfead760b3a04d5449173cbb7468286f33a51eec09d07d96982c0718';

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

const CHIKU524_BOING_RELEASE_DL = 'github.com/chiku524/boing.network/releases/download/';
/** Tags before QA transparency RPC (`boing_getQaRegistry`) existed in published Windows zips. */
const STALE_TESTNET_TAG_RE = /\/download\/(testnet-v0\.1\.(?:0|1|2))\//;

function upgradeChiku524BoingZipUrl(url: string): { url: string; sha256: string } | null {
  if (!url.includes(CHIKU524_BOING_RELEASE_DL)) return null;
  if (!STALE_TESTNET_TAG_RE.test(url)) return null;
  const next = url.replace(STALE_TESTNET_TAG_RE, `/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/`);
  let sha256 = BOING_TESTNET_ZIP_SHA256_WINDOWS;
  if (next.includes('release-linux-x86_64')) sha256 = BOING_TESTNET_ZIP_SHA256_LINUX;
  else if (next.includes('release-macos-aarch64')) sha256 = BOING_TESTNET_ZIP_SHA256_MACOS_AARCH64;
  return { url: next, sha256 };
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
      const up = upgradeChiku524BoingZipUrl(row.nodeDownloadUrl);
      if (up) {
        row.nodeDownloadUrl = up.url;
        row.nodeBinarySha256 = up.sha256;
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
    const up = upgradeChiku524BoingZipUrl(out.nodeDownloadUrl);
    if (up) {
      out.nodeDownloadUrl = up.url;
      out.nodeBinarySha256 = up.sha256;
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
