import { NextResponse } from 'next/server';
import { getEnv, getSessionCookie, getUserIdFromSession } from '@/lib/auth-server';

function rowToNetwork(row: Record<string, unknown>, stats?: { minerCount: number; totalBalanceRaw: string; currency: string } | null) {
  const env = (row.environment as string) === 'mainnet' ? 'mainnet' : 'devnet';
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    description: row.description ?? '',
    icon: row.icon ?? '⛓',
    algorithm: row.algorithm,
    environment: env,
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
    listedAt: typeof row.created_at === 'string' ? row.created_at : undefined,
    ...(stats && { minerCount: stats.minerCount, totalBalanceRaw: stats.totalBalanceRaw, currency: stats.currency }),
  };
}

/** GET: List networks listed by the current user (network account). */
export async function GET(request: Request) {
  try {
    const token = getSessionCookie(request);
    if (!token) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { DB } = await getEnv();
    const userRow = await DB.prepare('select account_type, network_name from users where id = ?').bind(userId).first();
    if (!userRow || (userRow.account_type as string) !== 'network') {
      return NextResponse.json({ error: 'Only network accounts can list their networks' }, { status: 403 });
    }
    const networkName = (userRow.network_name as string)?.trim() || null;
    const rows = networkName
      ? await DB.prepare(
          `select * from network_listings where requested_by_user_id = ? or (requested_by_user_id is null and name = ?) order by created_at desc`
        )
          .bind(userId, networkName)
          .all()
      : await DB.prepare(
          'select * from network_listings where requested_by_user_id = ? order by created_at desc'
        )
          .bind(userId)
          .all();
    const { results } = rows;
    const listingRows = (results ?? []) as Record<string, unknown>[];

    const networks = await Promise.all(
      listingRows.map(async (r) => {
        const id = r.id as string;
        const env = (r.environment as string) === 'mainnet' ? 'mainnet' : 'devnet';
        let minerCount = 0;
        let totalBalanceRaw = '0';
        let currency = (r.symbol as string) || '—';
        try {
          const countRow = await DB.prepare(
            'select count(*) as c from miner_balances where network_id = ? and environment = ?'
          )
            .bind(id, env)
            .first();
          minerCount = Number((countRow as { c?: number })?.c ?? 0);
          const sumRow = await DB.prepare(
            'select sum(cast(balance_raw as real)) as total, max(currency) as currency from miner_balances where network_id = ? and environment = ?'
          )
            .bind(id, env)
            .first();
          if (sumRow && (sumRow as { total?: number | null }).total != null) {
            totalBalanceRaw = String((sumRow as { total: number }).total);
            currency = (sumRow as { currency?: string }).currency ?? currency;
          }
        } catch {
          // D1 or table might not exist; keep defaults
        }
        return rowToNetwork(r, { minerCount, totalBalanceRaw, currency });
      })
    );
    return NextResponse.json({ networks });
  } catch (err) {
    console.error('Networks my fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch your networks' }, { status: 500 });
  }
}
