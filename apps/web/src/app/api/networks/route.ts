import { NextResponse } from 'next/server';
import {
  getMainnetNetworksListed,
  getDevnetNetworks,
  parseStoredNodePresetsJson,
  patchBlockchainNetworkJsonForBoing,
  mergeBoingDevnetFromOfficialApi,
} from '@vibeminer/shared';
import { getEnv } from '@/lib/auth-server';
import { getBoingOfficialBundleCached } from '@/lib/boing-official-cache';

/** Returns mainnet and devnet networks: static list + dynamic listings from D1. Excludes placeholder "Your Network". */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const env = searchParams.get('env'); // 'mainnet' | 'devnet' | null (all)

    const staticMainnet = getMainnetNetworksListed();
    const staticDevnet = getDevnetNetworks();

    let dynamicMainnet: unknown[] = [];
    let dynamicDevnet: unknown[] = [];

    try {
      const { DB } = await getEnv();
      const mainnetRows = await DB.prepare(
        "select * from network_listings where environment = 'mainnet' and status = 'live'"
      ).all();
      const devnetRows = await DB.prepare(
        "select * from network_listings where environment = 'devnet' and status = 'live'"
      ).all();

      dynamicMainnet = (mainnetRows.results ?? []).map((r: Record<string, unknown>) =>
        rowToNetwork(r, 'mainnet')
      );
      dynamicDevnet = (devnetRows.results ?? []).map((r: Record<string, unknown>) =>
        rowToNetwork(r, 'devnet')
      );
    } catch {
      // D1 not available (local dev without wrangler); use static only
    }

    // Merge: dynamic (registered) overrides static for same id; no duplicates
    const mergeById = (staticList: unknown[], dynamicList: unknown[]) => {
      const byId = new Map<string, unknown>();
      for (const n of staticList) (n as { id?: string }).id && byId.set((n as { id: string }).id, n);
      for (const n of dynamicList) (n as { id?: string }).id && byId.set((n as { id: string }).id, n);
      return Array.from(byId.values());
    };
    const boingOfficial = await getBoingOfficialBundleCached();

    const mainnet = mergeById(staticMainnet, dynamicMainnet as typeof staticMainnet).map((n) =>
      patchBlockchainNetworkJsonForBoing(n as Record<string, unknown>)
    );
    const devnet = mergeById(staticDevnet, dynamicDevnet as typeof staticDevnet)
      .map((n) => patchBlockchainNetworkJsonForBoing(n as Record<string, unknown>))
      .map((n) => mergeBoingDevnetFromOfficialApi(n as Record<string, unknown>, boingOfficial));

    if (env === 'mainnet') {
      return NextResponse.json({ mainnet });
    }
    if (env === 'devnet') {
      return NextResponse.json({ devnet });
    }
    return NextResponse.json({ mainnet, devnet });
  } catch (err) {
    console.error('Networks fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch networks' }, { status: 500 });
  }
}

function rowToNetwork(row: Record<string, unknown>, environment: 'mainnet' | 'devnet') {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    description: row.description ?? '',
    icon: row.icon ?? '⛓',
    algorithm: row.algorithm,
    environment,
    status: row.status ?? 'live',
    poolUrl: row.pool_url ?? undefined,
    poolPort: row.pool_port ?? undefined,
    website: row.website ?? undefined,
    rewardRate: row.reward_rate ?? undefined,
    minPayout: row.min_payout ?? undefined,
    nodeDownloadUrl: row.node_download_url ?? undefined,
    nodeCommandTemplate: row.node_command_template ?? undefined,
    nodeDiskGb: typeof row.node_disk_gb === 'number' ? row.node_disk_gb : undefined,
    nodeRamMb: typeof row.node_ram_mb === 'number' ? row.node_ram_mb : undefined,
    nodeBinarySha256: row.node_binary_sha256 ?? undefined,
    nodePresets: parseStoredNodePresetsJson(
      typeof row.node_presets_json === 'string' ? row.node_presets_json : undefined
    ),
    listedAt: typeof row.created_at === 'string' ? row.created_at : undefined,
  };
}
