import { describe, expect, it } from 'vitest';
import {
  BOING_TESTNET_CANONICAL_NATIVE_ENV,
  BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL,
  BOING_TESTNET_ZIP_SHA256_LINUX,
  BOING_TESTNET_ZIP_SHA256_MACOS_AARCH64,
  BOING_TESTNET_ZIP_SHA256_WINDOWS,
  patchBlockchainNetworkJsonForBoing,
} from './boing-testnet-node';

describe('BOING_TESTNET_CANONICAL_NATIVE_ENV', () => {
  it('multihop swap router matches boing-sdk canonicalTestnetDex (swap2 / full-stack bundle)', () => {
    expect(BOING_TESTNET_CANONICAL_NATIVE_ENV.BOING_CANONICAL_NATIVE_DEX_MULTIHOP_SWAP_ROUTER).toBe(
      '0xf801cd1aa5ec402f89a2f394b49e6b0c136264d8945b16a4a6a81a188b18acc1',
    );
  });
});

describe('patchBlockchainNetworkJsonForBoing', () => {
  it('does not modify networks without a Boing id', () => {
    const input: Record<string, unknown> = {
      id: 'ethereum-mainnet',
      nodeDownloadUrl:
        'https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.5/release-windows-x86_64.zip',
    };
    expect(patchBlockchainNetworkJsonForBoing(input)).toEqual(input);
  });

  it('upgrades stale legacy-org zip tags to canonical Boing-Network URL and current tag', () => {
    const out = patchBlockchainNetworkJsonForBoing({
      id: 'boing-devnet',
      nodeDownloadUrl:
        'https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.5/release-windows-x86_64.zip',
    });
    expect(out.nodeDownloadUrl).toBe(BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL);
    expect(out.nodeBinarySha256).toBe(BOING_TESTNET_ZIP_SHA256_WINDOWS);
  });

  it('normalizes legacy org when the tag is already current', () => {
    const out = patchBlockchainNetworkJsonForBoing({
      id: 'boing-devnet',
      nodeDownloadUrl:
        'https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.8/release-linux-x86_64.zip',
    });
    expect(out.nodeDownloadUrl).toBe(
      'https://github.com/Boing-Network/boing.network/releases/download/testnet-v0.1.8/release-linux-x86_64.zip',
    );
    expect(out.nodeBinarySha256).toBe(BOING_TESTNET_ZIP_SHA256_LINUX);
  });

  it('does not touch nodeDownloadUrl when already canonical Boing-Network + current tag', () => {
    const url = BOING_TESTNET_DEFAULT_WINDOWS_DOWNLOAD_URL;
    const out = patchBlockchainNetworkJsonForBoing({
      id: 'boing-devnet',
      nodeDownloadUrl: url,
    });
    expect(out.nodeDownloadUrl).toBe(url);
    expect(out.nodeBinarySha256).toBeUndefined();
  });

  it('patches nodePresets entries for stale macOS zip URLs', () => {
    const out = patchBlockchainNetworkJsonForBoing({
      id: 'boing-devnet',
      nodePresets: [
        {
          nodeDownloadUrl:
            'https://github.com/chiku524/boing.network/releases/download/testnet-v0.1.4/release-macos-aarch64.zip',
        },
      ],
    });
    const presets = out.nodePresets as Record<string, unknown>[];
    expect(presets[0].nodeDownloadUrl).toContain('Boing-Network/boing.network');
    expect(presets[0].nodeDownloadUrl).toContain('testnet-v0.1.8');
    expect(presets[0].nodeBinarySha256).toBe(BOING_TESTNET_ZIP_SHA256_MACOS_AARCH64);
  });
});
