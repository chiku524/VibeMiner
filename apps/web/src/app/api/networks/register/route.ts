import { NextResponse } from 'next/server';
import { parseNetwork, FEE_CONFIG, getNetworkById, normalizeNodeFieldsForListing } from '@vibeminer/shared';
import { getEnv, getSessionCookie, getUserIdFromSession } from '@/lib/auth-server';

/**
 * Automated network registration. No admin approval.
 * Requires an authenticated network account (account_type === 'network').
 * - Validates payload against schema
 * - Devnet: free, instant listing
 * - Mainnet: requires listing fee (feeTxHash or feeConfirmed for now; full payment integration TBD)
 */
export async function POST(request: Request) {
  try {
    const token = getSessionCookie(request);
    if (!token) {
      return NextResponse.json({ error: 'Sign in required to request a listing' }, { status: 401 });
    }
    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
    }

    const { DB } = await getEnv();
    const userRow = await DB.prepare(
      'select account_type from users where id = ?'
    )
      .bind(userId)
      .first();
    if (!userRow || (userRow.account_type as string) !== 'network') {
      return NextResponse.json(
        { error: 'Only network accounts can request a listing. Register as a network to continue.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { feeConfirmed, feeTxHash, ...networkPayload } = body as Record<string, unknown>;

    const result = parseNetwork(networkPayload);
    if (!result.success) {
      const flat = result.error.flatten();
      const firstField = flat.fieldErrors && Object.keys(flat.fieldErrors).length > 0
        ? Object.entries(flat.fieldErrors)[0]
        : null;
      const detailMsg = firstField?.[1]?.[0];
      const errorMessage = detailMsg ? `Validation failed: ${detailMsg}` : 'Validation failed';
      return NextResponse.json(
        { error: errorMessage, details: flat },
        { status: 400 }
      );
    }

    const network = result.data;
    const isMainnet = network.environment === 'mainnet';

    // Require use case and connectivity for listing (reduce spam / unusable entries)
    const desc = typeof network.description === 'string' ? network.description.trim() : '';
    if (desc.length < 20) {
      return NextResponse.json(
        {
          error: 'Please provide a clear description of your network and its use case (at least 20 characters).',
          seeAlso: '/fees',
        },
        { status: 400 }
      );
    }

    const nodeNorm = normalizeNodeFieldsForListing({
      nodeDownloadUrl: network.nodeDownloadUrl,
      nodeCommandTemplate: network.nodeCommandTemplate,
      nodeDiskGb: network.nodeDiskGb,
      nodeRamMb: network.nodeRamMb,
      nodeBinarySha256: network.nodeBinarySha256,
      nodePresets: network.nodePresets,
    });
    if (!nodeNorm.ok) {
      return NextResponse.json(
        { error: `Node config validation failed: ${nodeNorm.error}. Download URLs must be from allowed hosts (e.g. GitHub).` },
        { status: 400 }
      );
    }

    // Require either pool (mining) OR node config (PoS / full node)
    const hasPool = !!(network.poolUrl?.trim() && network.poolPort != null && network.poolPort >= 1 && network.poolPort <= 65535);
    const hasNode = !!(nodeNorm.nodeDownloadUrl && nodeNorm.nodeCommandTemplate);
    if (!hasPool && !hasNode) {
      return NextResponse.json(
        {
          error: 'Provide either mining pool (URL + port) for PoW networks, or node config (download URL + command) for PoS/node-only networks.',
        },
        { status: 400 }
      );
    }
    if (network.poolUrl?.trim() && (!network.poolPort || network.poolPort < 1 || network.poolPort > 65535)) {
      return NextResponse.json(
        { error: 'When providing a pool URL, a valid pool port (1–65535) is required.' },
        { status: 400 }
      );
    }

    if (isMainnet && FEE_CONFIG.NETWORK_LISTING.devnetFree) {
      const paid = feeConfirmed === true || (typeof feeTxHash === 'string' && feeTxHash.length > 0);
      if (!paid) {
        return NextResponse.json(
          {
            error: 'Mainnet listing requires payment',
            feeAmount: FEE_CONFIG.NETWORK_LISTING.amount,
            feeDescription: FEE_CONFIG.NETWORK_LISTING.description,
            seeAlso: '/fees',
          },
          { status: 402 }
        );
      }
    }

    const id = network.id + (network.environment === 'devnet' ? '-devnet' : '');
    const existing = await DB.prepare(
      'select id from network_listings where id = ?'
    )
      .bind(id)
      .first();

    if (existing) {
      return NextResponse.json(
        { error: 'Network with this id already listed', id },
        { status: 409 }
      );
    }

    const staticExists = getNetworkById(network.id, network.environment);
    if (staticExists) {
      return NextResponse.json(
        { error: 'Network already exists in registry', id: network.id },
        { status: 409 }
      );
    }

    await DB.prepare(
      `insert into network_listings (
        id, name, symbol, algorithm, environment, description, icon,
        pool_url, pool_port, website, reward_rate, min_payout, status,
        requested_by_user_id, listing_fee_paid, node_download_url, node_command_template, node_disk_gb, node_ram_mb, node_binary_sha256, node_presets_json
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        network.name,
        network.symbol,
        network.algorithm,
        network.environment,
        network.description ?? '',
        network.icon ?? '⛓',
        network.poolUrl ?? null,
        network.poolPort ?? null,
        network.website ?? null,
        network.rewardRate ?? null,
        network.minPayout ?? null,
        network.status ?? 'live',
        userId,
        isMainnet ? 1 : 0,
        nodeNorm.nodeDownloadUrl,
        nodeNorm.nodeCommandTemplate,
        nodeNorm.nodeDiskGb,
        nodeNorm.nodeRamMb,
        nodeNorm.nodeBinarySha256,
        nodeNorm.nodePresetsJson
      )
      .run();

    return NextResponse.json({
      success: true,
      network: {
        id,
        name: network.name,
        symbol: network.symbol,
        environment: network.environment,
        status: network.status ?? 'live',
      },
      message: 'Network listed automatically. No admin approval required.',
    });
  } catch (err) {
    console.error('Network register error:', err);
    return NextResponse.json(
      { error: 'Registration failed. Try again or contact support.' },
      { status: 500 }
    );
  }
}
