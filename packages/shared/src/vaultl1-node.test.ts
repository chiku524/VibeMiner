import { describe, expect, it } from 'vitest';
import {
  applyVaultL1PeerHostToCommandTemplate,
  buildVaultL1NodePresets,
  isVaultL1NetworkId,
  pickVaultL1NodePresetIdForPlatform,
  vaultL1RoleFromPresetId,
  VAULTL1_CMD_PC_A,
  VAULTL1_NETWORK_ID,
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
    expect(vaultL1RoleFromPresetId('local-a')).toBe('local-a');
    expect(vaultL1RoleFromPresetId('local-b')).toBe('local-b');
  });

  it('substitutes peer host safely', () => {
    const out = applyVaultL1PeerHostToCommandTemplate(VAULTL1_CMD_PC_A, '192.168.1.20');
    expect(out).toContain('--peers 192.168.1.20:26656');
    expect(out).not.toContain('{peerHost}');
  });

  it('builds valid listing for schema/hasNodeConfig', () => {
    const presets = buildVaultL1NodePresets();
    expect(presets.length).toBeGreaterThanOrEqual(6);
    expect(presets.length).toBeLessThanOrEqual(12);
    const raw = {
      id: VAULTL1_NETWORK_ID,
      name: 'VaultL1 (LAN)',
      symbol: 'VAULT',
      description: 'lab',
      icon: '◆',
      algorithm: 'PoA',
      environment: 'devnet',
      status: 'live',
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
