import { describe, expect, it } from 'vitest';
import {
  mergeBoingDevnetFromOfficialApi,
  parseBoingOfficialNetworksResponse,
  type BoingOfficialNetworksBundle,
} from './boing-official-api';

describe('parseBoingOfficialNetworksResponse', () => {
  it('returns null when ok is not true', () => {
    expect(parseBoingOfficialNetworksResponse({ ok: false })).toBeNull();
    expect(parseBoingOfficialNetworksResponse({})).toBeNull();
  });

  it('returns null when meta is missing required fields', () => {
    expect(
      parseBoingOfficialNetworksResponse({
        ok: true,
        meta: { boing_testnet_download_tag: 't' },
        networks: [],
      }),
    ).toBeNull();
  });

  it('parses a minimal valid payload', () => {
    const json = {
      ok: true,
      meta: {
        boing_testnet_download_tag: 'testnet-v0.1.8',
        chain_id_hex: '0x1',
        public_testnet_rpc_url: 'https://testnet-rpc.boing.network/',
        official_bootnodes: ['/ip4/1.2.3.4/tcp/4001'],
        cli_long_flags: '--foo',
        docs: { guide: 'https://example.com' },
      },
      networks: [
        {
          id: 'boing-devnet',
          platform: 'windows',
          node_download_url: 'https://github.com/Boing-Network/boing.network/releases/download/t/z.zip',
          node_command_template: 'boing-node.exe --data-dir {dataDir}',
          node_binary_sha256: 'a'.repeat(64),
        },
      ],
    };
    const bundle = parseBoingOfficialNetworksResponse(json);
    expect(bundle).not.toBeNull();
    expect(bundle!.meta.boing_testnet_download_tag).toBe('testnet-v0.1.8');
    expect(bundle!.meta.official_bootnodes).toEqual(['/ip4/1.2.3.4/tcp/4001']);
    expect(bundle!.meta.docs).toEqual({ guide: 'https://example.com' });
    expect(bundle!.byId.get('boing-devnet')?.node_download_url).toContain('z.zip');
    expect(bundle!.byId.get('boing-devnet')?.node_binary_sha256).toBe('a'.repeat(64));
  });

  it('defaults cli_long_flags when meta.cli_long_flags is absent', () => {
    const bundle = parseBoingOfficialNetworksResponse({
      ok: true,
      meta: {
        boing_testnet_download_tag: 't',
        chain_id_hex: '0x1',
        public_testnet_rpc_url: 'https://x/',
        official_bootnodes: [],
      },
      networks: [],
    });
    expect(bundle?.meta.cli_long_flags).toBe('kebab-case');
  });

  it('skips non-record network rows and still returns bundle', () => {
    const bundle = parseBoingOfficialNetworksResponse({
      ok: true,
      meta: {
        boing_testnet_download_tag: 't',
        chain_id_hex: '0x1',
        public_testnet_rpc_url: 'https://x/',
        official_bootnodes: [],
      },
      networks: [null, 'bad', { id: '' }, { id: 'good', node_download_url: 'https://u' }],
    });
    expect(bundle?.byId.size).toBe(1);
    expect(bundle?.byId.get('good')?.node_download_url).toBe('https://u');
  });
});

function sampleOfficialBundle(): BoingOfficialNetworksBundle {
  return {
    meta: {
      boing_testnet_download_tag: 'testnet-v0.1.8',
      chain_id_hex: '0xabc',
      public_testnet_rpc_url: 'https://testnet-rpc.boing.network/',
      official_bootnodes: [],
      cli_long_flags: '',
    },
    byId: new Map([
      [
        'boing-devnet',
        {
          id: 'boing-devnet',
          node_download_url: 'https://win.zip',
          node_binary_sha256: 'b'.repeat(64),
          node_command_template: 'boing-node-win.exe --data-dir {dataDir} --rpc-port 8545',
        },
      ],
      [
        'boing-devnet-linux',
        {
          id: 'boing-devnet-linux',
          node_download_url: 'https://linux.zip',
          node_binary_sha256: 'c'.repeat(64),
          node_command_template: 'boing-node-linux --data-dir {dataDir}',
        },
      ],
      [
        'boing-devnet-macos',
        {
          id: 'boing-devnet-macos',
          node_download_url: 'https://mac.zip',
          node_command_template: 'boing-node-macos --data-dir {dataDir}',
        },
      ],
    ]),
  };
}

describe('mergeBoingDevnetFromOfficialApi', () => {
  it('returns input when id is not boing-devnet', () => {
    const n = { id: 'other', nodePresets: [{ presetId: 'windows' }] };
    expect(mergeBoingDevnetFromOfficialApi(n, sampleOfficialBundle())).toBe(n);
  });

  it('returns input when official is null', () => {
    const n = { id: 'boing-devnet', nodePresets: [{ presetId: 'windows' }] };
    expect(mergeBoingDevnetFromOfficialApi(n, null)).toBe(n);
  });

  it('returns input when nodePresets is missing or empty', () => {
    const base = { id: 'boing-devnet' };
    expect(mergeBoingDevnetFromOfficialApi({ ...base }, sampleOfficialBundle())).toEqual(base);
    expect(mergeBoingDevnetFromOfficialApi({ ...base, nodePresets: [] }, sampleOfficialBundle())).toEqual({
      ...base,
      nodePresets: [],
    });
  });

  it('overlays per-OS presets and top-level Windows row', () => {
    const official = sampleOfficialBundle();
    const out = mergeBoingDevnetFromOfficialApi(
      {
        id: 'boing-devnet',
        nodePresets: [
          { presetId: 'windows', commandTemplate: 'old' },
          { presetId: 'linux', commandTemplate: 'old' },
          { presetId: 'macos-arm64', commandTemplate: 'old' },
        ],
      },
      official,
    );
    const presets = out.nodePresets as Record<string, unknown>[];
    expect(presets[0].nodeDownloadUrl).toBe('https://win.zip');
    expect(presets[0].nodeBinarySha256).toBe('b'.repeat(64));
    expect(presets[0].commandTemplate).toBe(
      'boing-node-win.exe --data-dir {dataDir} --rpc-port 8545',
    );
    expect(presets[1].nodeDownloadUrl).toBe('https://linux.zip');
    expect(presets[2].nodeDownloadUrl).toBe('https://mac.zip');
    expect(out.nodeDownloadUrl).toBe('https://win.zip');
    expect(out.nodeCommandTemplate).toBe('boing-node-win.exe --data-dir {dataDir} --rpc-port 8545');
    expect(out.nodeBinarySha256).toBe('b'.repeat(64));
  });

  it('appends --validator for validator presets', () => {
    const out = mergeBoingDevnetFromOfficialApi(
      {
        id: 'boing-devnet',
        nodePresets: [{ presetId: 'windows-validator', commandTemplate: 'old' }],
      },
      sampleOfficialBundle(),
    );
    const presets = out.nodePresets as Record<string, unknown>[];
    expect(presets[0].commandTemplate).toBe(
      'boing-node-win.exe --data-dir {dataDir} --rpc-port 8545 --validator',
    );
  });

  it('does not append duplicate --validator', () => {
    const official = sampleOfficialBundle();
    const row = official.byId.get('boing-devnet')!;
    official.byId.set('boing-devnet', {
      ...row,
      node_command_template: 'boing.exe --data-dir {dataDir} --validator',
    });
    const out = mergeBoingDevnetFromOfficialApi(
      {
        id: 'boing-devnet',
        nodePresets: [{ presetId: 'windows-validator' }],
      },
      official,
    );
    const presets = out.nodePresets as Record<string, unknown>[];
    expect(presets[0].commandTemplate).toBe('boing.exe --data-dir {dataDir} --validator');
  });

  it('ignores invalid preset SHA256 from official row', () => {
    const official = sampleOfficialBundle();
    const win = official.byId.get('boing-devnet')!;
    official.byId.set('boing-devnet', { ...win, node_binary_sha256: 'not-hex' });
    const out = mergeBoingDevnetFromOfficialApi(
      {
        id: 'boing-devnet',
        nodePresets: [{ presetId: 'windows' }],
      },
      official,
    );
    const presets = out.nodePresets as Record<string, unknown>[];
    expect(presets[0].nodeBinarySha256).toBeUndefined();
  });
});
