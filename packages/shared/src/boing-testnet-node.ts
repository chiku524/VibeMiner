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

/** Pinned release for default Windows download when no listing overrides exist. */
export const BOING_TESTNET_DEFAULT_DOWNLOAD_TAG = 'testnet-v0.1.3';

export const BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL = `https://github.com/chiku524/boing.network/releases/download/${BOING_TESTNET_DEFAULT_DOWNLOAD_TAG}/release-windows-x86_64.zip`;

/** Matches bootnode-style Boing testnet full node + JSON-RPC faucet (see boing.network scripts). */
export const BOING_TESTNET_DEFAULT_WINDOWS_COMMAND_TEMPLATE =
  'boing-node-windows-x86_64.exe --data-dir {dataDir} --p2p-listen /ip4/0.0.0.0/tcp/4001 --bootnodes /ip4/73.84.106.121/tcp/4001 --rpc-port 8545 --faucet-enable';

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
  } else if (typeof out.nodeCommandTemplate === 'string') {
    out.nodeCommandTemplate = ensureBoingFaucetInCommandTemplate(out.nodeCommandTemplate);
  }

  const hasPresets = Array.isArray(out.nodePresets) && out.nodePresets.length > 0;
  const hasUrl = typeof out.nodeDownloadUrl === 'string' && out.nodeDownloadUrl.trim().length > 0;
  const hasTpl = typeof out.nodeCommandTemplate === 'string' && out.nodeCommandTemplate.trim().length > 0;

  if (id === 'boing-devnet' && !hasPresets && (!hasUrl || !hasTpl)) {
    if (!hasUrl) out.nodeDownloadUrl = BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL;
    if (!hasTpl) out.nodeCommandTemplate = BOING_TESTNET_DEFAULT_WINDOWS_COMMAND_TEMPLATE;
    if (out.nodeDiskGb == null) out.nodeDiskGb = 5;
    if (out.nodeRamMb == null) out.nodeRamMb = 2048;
  }

  return out;
}
