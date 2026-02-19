import { NextResponse } from 'next/server';
import { parseNetwork, FEE_CONFIG, getNetworkById } from '@vibeminer/shared';
import { getEnv } from '@/lib/auth-server';

/**
 * Automated network registration. No admin approval.
 * - Validates payload against schema
 * - Devnet: free, instant listing
 * - Mainnet: requires listing fee (feeTxHash or feeConfirmed for now; full payment integration TBD)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feeConfirmed, feeTxHash, ...networkPayload } = body as Record<string, unknown>;

    const result = parseNetwork(networkPayload);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
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
    if (!network.poolUrl?.trim()) {
      return NextResponse.json(
        { error: 'Pool URL is required so miners can connect to your network.' },
        { status: 400 }
      );
    }
    if (network.poolPort == null || network.poolPort < 1 || network.poolPort > 65535) {
      return NextResponse.json(
        { error: 'A valid pool port (1–65535) is required.' },
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

    const { DB } = await getEnv();

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
        listing_fee_paid
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        isMainnet ? 1 : 0
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
