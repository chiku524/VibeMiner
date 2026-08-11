import { describe, expect, it } from 'vitest';
import {
  applyVaultL1PeerHostToCommandTemplate,
  buildVaultL1NodePresets,
  isVaultL1NetworkId,
  pickVaultL1NodePresetIdForPlatform,
  vaultL1RoleFromPresetId,
  VAULTL1_DEFAULT_WINDOWS_DOWNLOAD_URL,
  VAULTL1_NETWORK_ID,
  VAULTL1_WINDOWS_BINARY,
} from './vaultl1-node';
import { hasNodeConfig } from './nodes';
import { parseNetwork } from './schema';

describe('vaultl1-node', () => {
  it('identifies network id', () => {
    expect(isVaultL1NetworkId(VAULTL1_NETWORK_ID)).toBe(true);
    expect(isVaultL1NetworkId('boing-devnet')).toBe(false);
  });

  it('parses roles from preset ids', () => {
    expect(vaultL1RoleFromPresetId('windows-pc-a')).toBe('pc-a');
    expect(vaultL1RoleFromPresetId('linux-pc-b')).toBe('pc-b');
    expect(vaultL1RoleFromPresetId('macos-arm64-local-a')).toBe('local-a');
    expect(vaultL1RoleFromPresetId('windows-local-b')).toBe('local-b');
  });

  it('substitutes peer host safely', () => {
    const presets = buildVaultL1NodePresets();
    const pcA = presets.find((p) => p.presetId === 'windows-pc-a')!;
    const out = applyVaultL1PeerHostToCommandTemplate(pcA.commandTemplate, '192.168.1.20');
    expect(out).toContain('--peers 192.168.1.20:26656');
    expect(out).toContain(VAULTL1_WINDOWS_BINARY);
    expect(out).not.toContain('{peerHost}');
  });

  it('pins vaultl1-bin-v0.5.1 rehost with SHA256', () => {
    const presets = buildVaultL1NodePresets();
    expect(presets.every((p) => p.nodeDownloadUrl.includes('vaultl1-bin-v0.5.1'))).toBe(true);
    expect(presets.every((p) => p.nodeBinarySha256 && p.nodeBinarySha256.length === 64)).toBe(
      true,
    );
  });

  it('builds Boing-style presets with download URLs (3 OS × 4 roles)', () => {
    const presets = buildVaultL1NodePresets();
    expect(presets.length).toBe(12);
    expect(
      presets.every((p) =>
        p.nodeDownloadUrl.startsWith('https://github.com/chiku524/VibeMiner/releases/download/')
      )
    ).toBe(true);
    expect(presets.every((p) => p.commandTemplate.includes('start'))).toBe(true);
    const raw = {
      id: VAULTL1_NETWORK_ID,
      name: 'VaultL1 (LAN)',
      symbol: 'VAULT',
      description: 'lab',
      icon: '◆',
      algorithm: 'PoA',
      environment: 'devnet',
      status: 'live',
      nodeDownloadUrl: VAULTL1_DEFAULT_WINDOWS_DOWNLOAD_URL,
      nodePresets: presets,
    };
    const parsed = parseNetwork(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(hasNodeConfig(parsed.data)).toBe(true);
    }
  });

  it('picks OS pc-a by default', () => {
    const presets = buildVaultL1NodePresets();
    const id = pickVaultL1NodePresetIdForPlatform(presets, 'windows');
    expect(id).toBe('windows-pc-a');
  });
});
