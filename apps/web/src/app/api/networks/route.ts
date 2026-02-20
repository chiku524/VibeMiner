import { NextResponse } from 'next/server';
import { getMainnetNetworksListed, getDevnetNetworks } from '@vibeminer/shared';
import { getEnv } from '@/lib/auth-server';

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

    const mainnet = [...staticMainnet, ...(dynamicMainnet as typeof staticMainnet)];
    const devnet = [...staticDevnet, ...(dynamicDevnet as typeof staticDevnet)];

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
    /** ISO date when listed (for discovery: newest first). Only on dynamically listed networks. */
    listedAt: typeof row.created_at === 'string' ? row.created_at : undefined,
  };
}
