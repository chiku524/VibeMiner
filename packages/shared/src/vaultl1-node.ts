/**
 * VaultL1 one-click node policy for VibeMiner desktop.
 * Binary: `vaultd` (set VIBEMINER_VAULTD_EXE or let the desktop auto-discover a local build).
 * Two equal validators → both machines must stay online for blocks (2/3 power quorum).
 */

export const VAULTL1_NETWORK_ID = 'vaultl1-local';

export const VAULTL1_CHAIN_ID_LAN = 'vault-net-1';
export const VAULTL1_CHAIN_ID_LOCAL = 'vault-net-local';

export const VAULTL1_SUGGESTED_NODE_DISK_GB = 2;
export const VAULTL1_SUGGESTED_NODE_RAM_MB = 512;

/** Env var: absolute path to vaultd / vaultd.exe (skip download). */
export const VIBEMINER_VAULTD_EXE_ENV = 'VIBEMINER_VAULTD_EXE';

/** localStorage keys for LAN join form (per machine role in the webview). */
export const VAULTL1_PEER_HOST_STORAGE_KEY = 'vibeminer.vaultl1.peerHost';
export const VAULTL1_PEER_ADDRESS_STORAGE_KEY = 'vibeminer.vaultl1.peerAddress';
export const VAULTL1_PEER_PUBKEY_STORAGE_KEY = 'vibeminer.vaultl1.peerPubKey';
export const VAULTL1_GENESIS_PATH_STORAGE_KEY = 'vibeminer.vaultl1.genesisPath';

export function isVaultL1NetworkId(id: string): boolean {
  return id.toLowerCase().includes('vaultl1');
}

export type VaultL1Role = 'pc-a' | 'pc-b' | 'local-a' | 'local-b';

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

/**
 * Default one-click: LAN coordinator for OS, else local dual A.
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

  const score = (id: string) => {
    const p = id.toLowerCase();
    let s = 0;
    if (token) {
      if (token === 'macos') {
        if (p.includes('mac') || p.includes('darwin')) s += 10;
      } else if (p.includes(token)) s += 10;
    }
    if (p.includes('pc-a') || p.includes('machine-a')) s += 5;
    if (p.includes('local-a')) s += 3;
    return s;
  };

  let best = presets[0]!;
  let bestScore = score(best.presetId);
  for (const p of presets.slice(1)) {
    const sc = score(p.presetId);
    if (sc > bestScore) {
      best = p;
      bestScore = sc;
    }
  }
  // Prefer OS-scoped pc-a if available
  const osPcA = presets.find((p) => {
    const id = p.presetId.toLowerCase();
    if (!token) return false;
    const osMatch =
      token === 'macos'
        ? id.includes('mac') || id.includes('darwin')
        : id.includes(token);
    return osMatch && (id.includes('pc-a') || id.includes('machine-a'));
  });
  if (osPcA) return osPcA.presetId;
  return best.presetId;
}

function tpl(
  moniker: string,
  peerPlaceholder: string,
  ports: { rpc: number; api: number; p2p: number },
  bind: 'lan' | 'loopback',
): string {
  const host = bind === 'lan' ? '0.0.0.0' : '127.0.0.1';
  return [
    'vaultd start',
    '--home {dataDir}',
    `--rpc-addr ${host}:${ports.rpc}`,
    `--api-addr ${host}:${ports.api}`,
    `--p2p-listen ${host}:${ports.p2p}`,
    `--peers ${peerPlaceholder}`,
    '--node-key validator',
    `--moniker ${moniker}`,
  ].join(' ');
}

/** LAN PC A (coordinator): default P2P ports, peers other host:26656 */
export const VAULTL1_CMD_PC_A = tpl('machine-a', '{peerHost}:26656', {
  rpc: 26657,
  api: 1317,
  p2p: 26656,
}, 'lan');

/** LAN PC B (joiner) */
export const VAULTL1_CMD_PC_B = tpl('machine-b', '{peerHost}:26656', {
  rpc: 26657,
  api: 1317,
  p2p: 26656,
}, 'lan');

/** Same-PC dual A */
export const VAULTL1_CMD_LOCAL_A = tpl('node-a', '127.0.0.1:26666', {
  rpc: 26657,
  api: 1317,
  p2p: 26656,
}, 'loopback');

/** Same-PC dual B */
export const VAULTL1_CMD_LOCAL_B = tpl('node-b', '127.0.0.1:26656', {
  rpc: 26667,
  api: 1327,
  p2p: 26666,
}, 'loopback');

/** Replace `{peerHost}` in a VaultL1 start template. */
export function applyVaultL1PeerHostToCommandTemplate(
  template: string,
  peerHost: string,
): string {
  const host = peerHost.trim() || '127.0.0.1';
  // Reject path chars / shell — host or IPv4 / IPv6-ish only
  if (!/^[0-9a-zA-Z.:_-]+$/.test(host) || host.length > 64) {
    return template;
  }
  return template.replaceAll('{peerHost}', host);
}

export function buildVaultL1NodePresets(): Array<{
  presetId: string;
  label: string;
  description: string;
  commandTemplate: string;
  nodeDiskGb: number;
  nodeRamMb: number;
}> {
  const disk = VAULTL1_SUGGESTED_NODE_DISK_GB;
  const ram = VAULTL1_SUGGESTED_NODE_RAM_MB;
  const rows: Array<{
    os: string;
    osLabel: string;
    role: VaultL1Role;
    label: string;
    description: string;
    commandTemplate: string;
  }> = [];

  for (const [os, osLabel] of [
    ['windows', 'Windows'],
    ['linux', 'Linux'],
    ['macos-arm64', 'macOS (Apple Silicon)'],
  ] as const) {
    rows.push(
      {
        os,
        osLabel,
        role: 'pc-a',
        label: `${osLabel} — PC A (LAN coordinator)`,
        description:
          'Builds shared genesis after you paste PC B address+pubkey. Share genesis-shared.json with B. Peers B_IP:26656.',
        commandTemplate: VAULTL1_CMD_PC_A,
      },
      {
        os,
        osLabel,
        role: 'pc-b',
        label: `${osLabel} — PC B (LAN joiner)`,
        description:
          'Creates validator key (copy address+pubkey to A). Import genesis JSON from A, set A_IP, then start.',
        commandTemplate: VAULTL1_CMD_PC_B,
      },
    );
  }

  // Same-PC dual (one OS of command; works on all — use any). Capped under schema max 12 presets.
  rows.push(
    {
      os: 'any',
      osLabel: 'Any OS',
      role: 'local-a',
      label: 'Local dual — node A (same PC)',
      description:
        'First of two processes on one machine (ports 26656/26657/1317). Start B after and keep both running.',
      commandTemplate: VAULTL1_CMD_LOCAL_A,
    },
    {
      os: 'any',
      osLabel: 'Any OS',
      role: 'local-b',
      label: 'Local dual — node B (same PC)',
      description:
        'Second process (ports 26666/26667/1327). Same genesis — desktop builds local dual genesis automatically.',
      commandTemplate: VAULTL1_CMD_LOCAL_B,
    },
  );

  return rows.map((r) => ({
    presetId:
      r.role === 'local-a' || r.role === 'local-b'
        ? r.role
        : `${r.os}-${r.role}`,
    label: r.label,
    description: r.description,
    commandTemplate: r.commandTemplate,
    nodeDiskGb: disk,
    nodeRamMb: ram,
  }));
}
