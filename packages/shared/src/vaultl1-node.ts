/**
 * VaultL1 one-click node policy for VibeMiner desktop — mirrors Boing testnet layout:
 * OS download zips from **public** GitHub releases + role presets (PC A / PC B / local dual).
 *
 * Binaries are rehosted on the public VibeMiner release tag `vaultl1-bin-v0.6.3` so the desktop
 * can download without auth (source vaultl1 repo may be private).
 */

export const VAULTL1_NETWORK_ID = 'vaultl1-local';

export const VAULTL1_CHAIN_ID_LAN = 'vault-net-1';
export const VAULTL1_CHAIN_ID_LOCAL = 'vault-net-local';

export const VAULTL1_SUGGESTED_NODE_DISK_GB = 2;
export const VAULTL1_SUGGESTED_NODE_RAM_MB = 512;

/** Pinned public zip rehost (vaultl1 repo may be private — assets published on VibeMiner releases). */
export const VAULTL1_DEFAULT_DOWNLOAD_TAG = 'vaultl1-bin-v0.6.3';

const VAULTL1_RELEASE_BASE = `https://github.com/chiku524/VibeMiner/releases/download/${VAULTL1_DEFAULT_DOWNLOAD_TAG}`;

export const VAULTL1_DEFAULT_WINDOWS_DOWNLOAD_URL = `${VAULTL1_RELEASE_BASE}/release-windows-x86_64.zip`;
export const VAULTL1_DEFAULT_LINUX_DOWNLOAD_URL = `${VAULTL1_RELEASE_BASE}/release-linux-x86_64.zip`;
export const VAULTL1_DEFAULT_MACOS_AARCH64_DOWNLOAD_URL = `${VAULTL1_RELEASE_BASE}/release-macos-aarch64.zip`;

/** Optional SHA-256 of official GitHub zip assets (refresh when cutting a new tag). */
export const VAULTL1_ZIP_SHA256_WINDOWS =
  '7911d05c6c34a1c58b3a3496dfc27c0246c31671fc4053deefa6ab8d3f227efb';
export const VAULTL1_ZIP_SHA256_LINUX =
  'c238833ca89d416e3ebc4da93603c0345f996822922d5e9188eb3cfe45a4d565';
export const VAULTL1_ZIP_SHA256_MACOS_AARCH64 =
  'f07f4c04a0159f257216237bef4186e0b0cc1bc87d16ccaf54f731ea34448466';

export const VAULTL1_WINDOWS_BINARY = 'vaultd-windows-x86_64.exe';
export const VAULTL1_LINUX_BINARY = 'vaultd-linux-x86_64';
export const VAULTL1_MACOS_AARCH64_BINARY = 'vaultd-macos-aarch64';

/** Env var: absolute path to vaultd (skip zip download). Same pattern as Boing. */
export const VIBEMINER_VAULTD_EXE_ENV = 'VIBEMINER_VAULTD_EXE';

/** Supported chain features for this pin (vaultl1 v0.6.3+). */
export const VAULTL1_FEATURE_CLOSE_DEAL = true;
export const VAULTL1_FEATURE_ACCESS_KEY_WRAP = true;
export const VAULTL1_FEATURE_ACCESS_REVOKE = true;
export const VAULTL1_FEATURE_HYBRID_BLOCKS = true;
export const VAULTL1_FEATURE_FAUCET = true;
export const VAULTL1_FEATURE_NOTES = [
  'storage/CloseDeal — owner ends open deals and frees capacity',
  'access/GrantAccess + key_wrap — ECDH-sealed content keys for sharing',
  'access/RevokeAccess — wipe key_wrap on revoke',
  'REST /vaultl1/access/grants?grantee=&owner=',
  'hybrid blocks — propose on tx; empty heartbeat every --empty-block-interval (30s)',
  'two-validator unstick — slim state clone + P2P keepalive',
  'REST faucet GET/POST /vaultl1/faucet (alice, 1e9 uvault / minute)',
  'explorer history GET /vaultl1/blocks and /vaultl1/txs/{hash}',
  'light headers + bank Merkle proofs vs app_hash',
  'P2P hello version (mixed 0.5.x / 0.6.x peers are dropped)',
  'vaultd query net --peer for two-node compare',
  'mempool prune — unapplicable txs cannot spam empty LAN blocks',
] as const;

/** localStorage keys for LAN join form. */
export const VAULTL1_PEER_HOST_STORAGE_KEY = 'vibeminer.vaultl1.peerHost';
export const VAULTL1_PEER_ADDRESS_STORAGE_KEY = 'vibeminer.vaultl1.peerAddress';
export const VAULTL1_PEER_PUBKEY_STORAGE_KEY = 'vibeminer.vaultl1.peerPubKey';
export const VAULTL1_GENESIS_PATH_STORAGE_KEY = 'vibeminer.vaultl1.genesisPath';

export function isVaultL1NetworkId(id: string): boolean {
  return id.toLowerCase().includes('vaultl1');
}

export type VaultL1Role = 'pc-a' | 'pc-b' | 'local-a' | 'local-b';
export type VaultL1OsKey = 'windows' | 'linux' | 'macos-arm64';

/** Role inferred from preset id (substring match). */
export function vaultL1RoleFromPresetId(presetId: string): VaultL1Role | null {
  const p = presetId.toLowerCase();
  if (p.includes('local-a') || p.endsWith('-locala')) return 'local-a';
  if (p.includes('local-b') || p.endsWith('-localb')) return 'local-b';
  if (p.includes('pc-a') || p.includes('machine-a') || (p.includes('coordinator') && !p.includes('b')))
    return 'pc-a';
  if (p.includes('pc-b') || p.includes('machine-b') || p.includes('joiner')) return 'pc-b';
  return null;
}

export function isVaultL1CoordinatorRole(role: VaultL1Role | null): boolean {
  return role === 'pc-a' || role === 'local-a';
}

export function isVaultL1JoinerRole(role: VaultL1Role | null): boolean {
  return role === 'pc-b' || role === 'local-b';
}

function tpl(
  binary: string,
  moniker: string,
  peerPlaceholder: string,
  ports: { rpc: number; api: number; p2p: number },
  bind: 'lan' | 'loopback',
): string {
  const host = bind === 'lan' ? '0.0.0.0' : '127.0.0.1';
  return [
    binary,
    'start',
    '--home {dataDir}',
    `--rpc-addr ${host}:${ports.rpc}`,
    `--api-addr ${host}:${ports.api}`,
    `--p2p-listen ${host}:${ports.p2p}`,
    `--peers ${peerPlaceholder}`,
    '--node-key validator',
    `--moniker ${moniker}`,
    '--block-interval 1s',
    '--empty-block-interval 30s',
  ].join(' ');
}

function commandsForBinary(binary: string): Record<VaultL1Role, string> {
  return {
    'pc-a': tpl(binary, 'machine-a', '{peerHost}:26656', { rpc: 26657, api: 1317, p2p: 26656 }, 'lan'),
    'pc-b': tpl(binary, 'machine-b', '{peerHost}:26656', { rpc: 26657, api: 1317, p2p: 26656 }, 'lan'),
    'local-a': tpl(binary, 'node-a', '127.0.0.1:26666', { rpc: 26657, api: 1317, p2p: 26656 }, 'loopback'),
    'local-b': tpl(binary, 'node-b', '127.0.0.1:26656', { rpc: 26667, api: 1327, p2p: 26666 }, 'loopback'),
  };
}

/**
 * Default one-click: **PC A (LAN coordinator)** for the current OS
 * (same idea as Boing preferring local validator for platform).
 */
export function pickVaultL1NodePresetIdForPlatform(
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

  const matchesOs = (id: string, label: string) => {
    const p = id.toLowerCase();
    const l = label.toLowerCase();
    if (token === 'macos') {
      return p.includes('mac') || p.includes('darwin') || l.includes('mac');
    }
    if (!token) return true;
    return p.includes(token) || l.includes(token);
  };

  const preferredRoles = ['pc-a', 'local-a', 'pc-b', 'local-b'];
  for (const role of preferredRoles) {
    const hit = presets.find((p) => {
      if (!matchesOs(p.presetId, p.label ?? '')) return false;
      return vaultL1RoleFromPresetId(p.presetId) === role;
    });
    if (hit) return hit.presetId;
  }

  const anyOs = presets.find((p) => matchesOs(p.presetId, p.label ?? ''));
  return anyOs?.presetId ?? presets[0]?.presetId ?? null;
}

/** Replace `{peerHost}` in a VaultL1 start template. */
export function applyVaultL1PeerHostToCommandTemplate(
  template: string,
  peerHost: string,
): string {
  const host = peerHost.trim() || '127.0.0.1';
  if (!/^[0-9a-zA-Z.:_-]+$/.test(host) || host.length > 64) {
    return template;
  }
  return template.split('{peerHost}').join(host);
}

type PresetRow = {
  presetId: string;
  label: string;
  description: string;
  commandTemplate: string;
  nodeDownloadUrl: string;
  nodeBinarySha256?: string;
  nodeDiskGb: number;
  nodeRamMb: number;
};

/**
 * Up to 12 presets: 3 OS × 4 roles (LAN A/B + local dual A/B).
 * Each row carries its own download URL (Boing-style).
 */
export function buildVaultL1NodePresets(): PresetRow[] {
  const disk = VAULTL1_SUGGESTED_NODE_DISK_GB;
  const ram = VAULTL1_SUGGESTED_NODE_RAM_MB;

  const osSpecs: Array<{
    os: VaultL1OsKey;
    osLabel: string;
    binary: string;
    downloadUrl: string;
    sha: string;
  }> = [
    {
      os: 'windows',
      osLabel: 'Windows (x86_64)',
      binary: VAULTL1_WINDOWS_BINARY,
      downloadUrl: VAULTL1_DEFAULT_WINDOWS_DOWNLOAD_URL,
      sha: VAULTL1_ZIP_SHA256_WINDOWS,
    },
    {
      os: 'linux',
      osLabel: 'Linux (x86_64)',
      binary: VAULTL1_LINUX_BINARY,
      downloadUrl: VAULTL1_DEFAULT_LINUX_DOWNLOAD_URL,
      sha: VAULTL1_ZIP_SHA256_LINUX,
    },
    {
      os: 'macos-arm64',
      osLabel: 'macOS (Apple Silicon)',
      binary: VAULTL1_MACOS_AARCH64_BINARY,
      downloadUrl: VAULTL1_DEFAULT_MACOS_AARCH64_DOWNLOAD_URL,
      sha: VAULTL1_ZIP_SHA256_MACOS_AARCH64,
    },
  ];

  const roleMeta: Array<{
    role: VaultL1Role;
    short: string;
    description: string;
  }> = [
    {
      role: 'pc-a',
      short: 'LAN PC A (coordinator)',
      description:
        'Default for a first machine on the LAN. Paste PC B address+pubkey, set B’s IP, Run. Share genesis-shared.json with B.',
    },
    {
      role: 'pc-b',
      short: 'LAN PC B (joiner)',
      description:
        'Second LAN machine. Run once to reveal identity for A, then import genesis from A and set A’s IP.',
    },
    {
      role: 'local-a',
      short: 'Local dual — node A',
      description:
        'Same PC only. Start this first (ports 26656/26657/1317). Then start local dual B.',
    },
    {
      role: 'local-b',
      short: 'Local dual — node B',
      description:
        'Same PC only. Ports 26666/26667/1327. Requires local dual A first (auto-shared genesis).',
    },
  ];

  const out: PresetRow[] = [];
  for (const os of osSpecs) {
    const cmds = commandsForBinary(os.binary);
    for (const r of roleMeta) {
      const sha = os.sha.trim();
      out.push({
        presetId: `${os.os}-${r.role}`,
        label: `${os.osLabel} — ${r.short}`,
        description: r.description,
        commandTemplate: cmds[r.role],
        nodeDownloadUrl: os.downloadUrl,
        ...(sha && /^[a-fA-F0-9]{64}$/.test(sha) ? { nodeBinarySha256: sha } : {}),
        nodeDiskGb: disk,
        nodeRamMb: ram,
      });
    }
  }
  return out;
}
