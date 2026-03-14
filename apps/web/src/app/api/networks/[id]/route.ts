import { NextResponse } from 'next/server';
import { parseNetwork, validateNodeConfig } from '@vibeminer/shared';
import { getEnv, getSessionCookie, getUserIdFromSession } from '@/lib/auth-server';

/** PATCH: Update a network listing. Only the account that requested it can update. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getSessionCookie(request);
    if (!token) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Network id required' }, { status: 400 });
    }

    const { DB } = await getEnv();
    const row = await DB.prepare(
      'select * from network_listings where id = ? and requested_by_user_id = ?'
    )
      .bind(id, userId)
      .first();

    if (!row) {
      return NextResponse.json({ error: 'Network not found or you do not have permission to edit it' }, { status: 404 });
    }

    const body = await request.json() as Record<string, unknown>;
    const result = parseNetwork({
      id: body.id ?? row.id,
      name: body.name ?? row.name,
      symbol: body.symbol ?? row.symbol,
      algorithm: body.algorithm ?? row.algorithm,
      environment: body.environment ?? row.environment,
      description: body.description ?? row.description ?? '',
      icon: body.icon ?? row.icon ?? '⛓',
      status: body.status ?? row.status ?? 'live',
      poolUrl: body.poolUrl ?? row.pool_url ?? undefined,
      poolPort: body.poolPort ?? row.pool_port ?? undefined,
      website: body.website ?? row.website ?? undefined,
      rewardRate: body.rewardRate ?? row.reward_rate ?? undefined,
      minPayout: body.minPayout ?? row.min_payout ?? undefined,
      nodeDownloadUrl: body.nodeDownloadUrl ?? row.node_download_url ?? undefined,
      nodeCommandTemplate: body.nodeCommandTemplate ?? row.node_command_template ?? undefined,
      nodeDiskGb: body.nodeDiskGb ?? row.node_disk_gb ?? undefined,
      nodeRamMb: body.nodeRamMb ?? row.node_ram_mb ?? undefined,
      nodeBinarySha256: body.nodeBinarySha256 ?? row.node_binary_sha256 ?? undefined,
    });

    if (!result.success) {
      const flat = result.error.flatten();
      const firstField = flat.fieldErrors && Object.keys(flat.fieldErrors).length > 0
        ? Object.entries(flat.fieldErrors)[0]
        : null;
      const detailMsg = firstField?.[1]?.[0];
      return NextResponse.json(
        { error: detailMsg ? `Validation failed: ${detailMsg}` : 'Validation failed', details: flat },
        { status: 400 }
      );
    }

    const network = result.data;
    const desc = typeof network.description === 'string' ? network.description.trim() : '';
    if (desc.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters.' },
        { status: 400 }
      );
    }

    let nodeConfig: { nodeDownloadUrl?: string; nodeCommandTemplate?: string; nodeDiskGb?: number; nodeRamMb?: number; nodeBinarySha256?: string } | null = null;
    if (network.nodeDownloadUrl?.trim() && network.nodeCommandTemplate?.trim()) {
      const nodeResult = validateNodeConfig({
        nodeDownloadUrl: network.nodeDownloadUrl.trim(),
        nodeCommandTemplate: network.nodeCommandTemplate.trim(),
        nodeDiskGb: network.nodeDiskGb,
        nodeRamMb: network.nodeRamMb,
        nodeBinarySha256: network.nodeBinarySha256?.trim(),
      });
      if (!nodeResult.success) {
        return NextResponse.json(
          { error: `Node config: ${nodeResult.error}` },
          { status: 400 }
        );
      }
      nodeConfig = nodeResult.data;
    }
    const hasPool = !!(network.poolUrl?.trim() && network.poolPort != null && network.poolPort >= 1 && network.poolPort <= 65535);
    const hasNode = !!nodeConfig;
    if (!hasPool && !hasNode) {
      return NextResponse.json(
        { error: 'Provide either mining pool (URL + port) or node config (download URL + command).' },
        { status: 400 }
      );
    }

    await DB.prepare(
      `update network_listings set
        name = ?, symbol = ?, algorithm = ?, description = ?, icon = ?,
        pool_url = ?, pool_port = ?, website = ?, reward_rate = ?, min_payout = ?,
        node_download_url = ?, node_command_template = ?, node_disk_gb = ?, node_ram_mb = ?, node_binary_sha256 = ?,
        updated_at = datetime('now')
      where id = ? and requested_by_user_id = ?`
    )
      .bind(
        network.name,
        network.symbol,
        network.algorithm,
        network.description ?? '',
        network.icon ?? '⛓',
        network.poolUrl ?? null,
        network.poolPort ?? null,
        network.website ?? null,
        network.rewardRate ?? null,
        network.minPayout ?? null,
        nodeConfig?.nodeDownloadUrl ?? null,
        nodeConfig?.nodeCommandTemplate ?? null,
        nodeConfig?.nodeDiskGb ?? null,
        nodeConfig?.nodeRamMb ?? null,
        nodeConfig?.nodeBinarySha256 ?? null,
        id,
        userId
      )
      .run();

    return NextResponse.json({
      success: true,
      network: {
        id,
        name: network.name,
        symbol: network.symbol,
        environment: network.environment,
        status: network.status,
      },
    });
  } catch (err) {
    console.error('Network update error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
