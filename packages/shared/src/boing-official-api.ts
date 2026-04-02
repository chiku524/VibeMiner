/**
 * Live merge from Boing's public {@link BOING_OFFICIAL_NETWORKS_API_URL} (`meta` + per-OS rows).
 * Constants in `boing-testnet-node.ts` remain the offline fallback when fetch fails.
 *
 * @see https://github.com/chiku524/boing.network/blob/main/docs/VIBEMINER-INTEGRATION.md §3.1 / §6
 */

export const BOING_OFFICIAL_NETWORKS_API_URL = 'https://boing.network/api/networks';

export interface BoingOfficialNetworksMeta {
  boing_testnet_download_tag: string;
  chain_id_hex: string;
  public_testnet_rpc_url: string;
  official_bootnodes: string[];
  cli_long_flags: string;
  docs?: Record<string, string>;
}

/** One row from Boing `networks[]` (snake_case fields from Cloudflare worker). */
export interface BoingOfficialNetworkRow {
  id: string;
  platform?: string;
  name?: string;
  rpc_url?: string;
  bootnodes?: string[];
  website?: string;
  chain_id_hex?: string;
  node_download_url?: string;
  node_command_template?: string;
  node_binary_sha256?: string;
}

export type BoingOfficialNetworksBundle = {
  meta: BoingOfficialNetworksMeta;
  byId: Map<string, BoingOfficialNetworkRow>;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * Parse JSON from `GET https://boing.network/api/networks`. Returns null if shape is unexpected.
 */
export function parseBoingOfficialNetworksResponse(json: unknown): BoingOfficialNetworksBundle | null {
  if (!isRecord(json) || json.ok !== true) return null;

  const metaRaw = json.meta;
  if (!isRecord(metaRaw)) return null;

  const tag = metaRaw.boing_testnet_download_tag;
  const chain = metaRaw.chain_id_hex;
  const rpc = metaRaw.public_testnet_rpc_url;
  const boots = metaRaw.official_bootnodes;
  if (typeof tag !== 'string' || typeof chain !== 'string' || typeof rpc !== 'string' || !Array.isArray(boots)) {
    return null;
  }

  const official_bootnodes = boots.filter((b): b is string => typeof b === 'string');
  const cliRaw = metaRaw.cli_long_flags;
  const docsRaw = metaRaw.docs;

  const meta: BoingOfficialNetworksMeta = {
    boing_testnet_download_tag: tag,
    chain_id_hex: chain,
    public_testnet_rpc_url: rpc,
    official_bootnodes,
    cli_long_flags: typeof cliRaw === 'string' ? cliRaw : 'kebab-case',
    docs: isRecord(docsRaw)
      ? Object.fromEntries(
          Object.entries(docsRaw).filter((e): e is [string, string] => typeof e[1] === 'string')
        )
      : undefined,
  };

  const networks = json.networks;
  if (!Array.isArray(networks)) return null;

  const byId = new Map<string, BoingOfficialNetworkRow>();
  for (const n of networks) {
    if (!isRecord(n)) continue;
    const id = n.id;
    if (typeof id !== 'string' || !id) continue;

    const bootnodes = Array.isArray(n.bootnodes)
      ? n.bootnodes.filter((b): b is string => typeof b === 'string')
      : undefined;

    byId.set(id, {
      id,
      platform: typeof n.platform === 'string' ? n.platform : undefined,
      name: typeof n.name === 'string' ? n.name : undefined,
      rpc_url: typeof n.rpc_url === 'string' ? n.rpc_url : undefined,
      bootnodes,
      website: typeof n.website === 'string' ? n.website : undefined,
      chain_id_hex: typeof n.chain_id_hex === 'string' ? n.chain_id_hex : undefined,
      node_download_url: typeof n.node_download_url === 'string' ? n.node_download_url : undefined,
      node_command_template: typeof n.node_command_template === 'string' ? n.node_command_template : undefined,
      node_binary_sha256: typeof n.node_binary_sha256 === 'string' ? n.node_binary_sha256 : undefined,
    });
  }

  return { meta, byId };
}

/**
 * Fetch and parse Boing official network listings. Uses global `fetch` (Node 18+, Next.js, modern runtimes).
 */
export async function fetchBoingOfficialNetworks(options?: {
  signal?: AbortSignal;
  timeoutMs?: number;
}): Promise<BoingOfficialNetworksBundle | null> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(BOING_OFFICIAL_NETWORKS_API_URL, {
      signal: options?.signal ?? ac.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return parseBoingOfficialNetworksResponse(json);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function presetRemoteListingId(presetId: string): string | null {
  const p = presetId.toLowerCase();
  if (p.startsWith('windows')) return 'boing-devnet';
  if (p.startsWith('linux')) return 'boing-devnet-linux';
  if (p.startsWith('macos')) return 'boing-devnet-macos';
  // Registered listings sometimes use generic ids (Windows zip on both presets).
  if (p === 'full-node' || p === 'validator') return 'boing-devnet';
  return null;
}

function appendValidatorFlag(template: string): string {
  const t = template.trim();
  if (/\s--validator(?:\s|$)/.test(t)) return t;
  return `${t} --validator`;
}

/**
 * When Boing API returns rows, overlay download URL, SHA, and command templates onto `boing-devnet` presets.
 * Validator presets reuse the same OS row with `--validator` appended to the official full-node template.
 */
export function mergeBoingDevnetFromOfficialApi(
  n: Record<string, unknown>,
  official: BoingOfficialNetworksBundle | null
): Record<string, unknown> {
  if (!official) return n;
  const id = typeof n.id === 'string' ? n.id : '';
  if (id !== 'boing-devnet') return n;

  const presets = n.nodePresets;
  if (!Array.isArray(presets) || presets.length === 0) return n;

  const out: Record<string, unknown> = {
    ...n,
    nodePresets: presets.map((p) => (isRecord(p) ? { ...p } : p)),
  };

  const presetArr = out.nodePresets;
  if (!Array.isArray(presetArr)) return out;

  for (let i = 0; i < presetArr.length; i++) {
    const p = presetArr[i];
    if (!isRecord(p)) continue;
    const presetId = typeof p.presetId === 'string' ? p.presetId : '';
    const remoteId = presetRemoteListingId(presetId);
    if (!remoteId) continue;

    const row = official.byId.get(remoteId);
    if (!row) continue;

    const isValidator = presetId.toLowerCase().includes('validator');

    if (typeof row.node_download_url === 'string' && row.node_download_url.trim()) {
      p.nodeDownloadUrl = row.node_download_url.trim();
    }
    if (typeof row.node_binary_sha256 === 'string' && /^[a-fA-F0-9]{64}$/.test(row.node_binary_sha256)) {
      p.nodeBinarySha256 = row.node_binary_sha256.toLowerCase();
    }

    if (typeof row.node_command_template === 'string' && row.node_command_template.trim()) {
      const base = row.node_command_template.trim();
      p.commandTemplate = isValidator ? appendValidatorFlag(base) : base;
    }
  }

  const win = official.byId.get('boing-devnet');
  if (win) {
    if (typeof win.node_download_url === 'string' && win.node_download_url.trim()) {
      out.nodeDownloadUrl = win.node_download_url.trim();
    }
    if (typeof win.node_command_template === 'string' && win.node_command_template.trim()) {
      out.nodeCommandTemplate = win.node_command_template.trim();
    }
    if (typeof win.node_binary_sha256 === 'string' && /^[a-fA-F0-9]{64}$/.test(win.node_binary_sha256)) {
      out.nodeBinarySha256 = win.node_binary_sha256.toLowerCase();
    }
  }

  return out;
}
