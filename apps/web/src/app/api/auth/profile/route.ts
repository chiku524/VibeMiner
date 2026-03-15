import { NextResponse } from 'next/server';
import {
  getSessionCookie,
  getUserIdFromSession,
  getEnv,
  MAX_DISPLAY_NAME_LEN,
  MAX_NETWORK_NAME_LEN,
  MAX_NETWORK_WEBSITE_LEN,
} from '@/lib/auth-server';

function trim(str: unknown): string | null {
  if (str == null) return null;
  const s = typeof str === 'string' ? str.trim() : String(str).trim();
  return s === '' ? null : s;
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** PATCH: Update current user profile (display_name; for network accounts also network_name, network_website). */
export async function PATCH(request: Request) {
  try {
    const token = getSessionCookie(request);
    if (!token) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }
    const userId = await getUserIdFromSession(token);
    if (!userId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const displayName = trim(body.display_name);
    const networkName = trim(body.network_name);
    const networkWebsite = trim(body.network_website);

    if (displayName !== null && displayName.length > MAX_DISPLAY_NAME_LEN) {
      return NextResponse.json(
        { error: `Display name must be at most ${MAX_DISPLAY_NAME_LEN} characters` },
        { status: 400 }
      );
    }
    if (networkName !== null && networkName.length > MAX_NETWORK_NAME_LEN) {
      return NextResponse.json(
        { error: `Network name must be at most ${MAX_NETWORK_NAME_LEN} characters` },
        { status: 400 }
      );
    }
    if (networkWebsite !== null) {
      if (networkWebsite.length > MAX_NETWORK_WEBSITE_LEN) {
        return NextResponse.json(
          { error: `Website URL must be at most ${MAX_NETWORK_WEBSITE_LEN} characters` },
          { status: 400 }
        );
      }
      if (!isValidUrl(networkWebsite)) {
        return NextResponse.json({ error: 'Website must be a valid http or https URL' }, { status: 400 });
      }
    }

    const { DB } = await getEnv();
    const userRow = await DB.prepare('select account_type from users where id = ?').bind(userId).first();
    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const accountType = userRow.account_type as string;

    if (accountType !== 'network' && (networkName !== null || networkWebsite !== null)) {
      return NextResponse.json(
        { error: 'Only network accounts can set network name and website' },
        { status: 403 }
      );
    }

    if (accountType === 'network') {
      await DB.prepare(
        `update users set display_name = ?, network_name = ?, network_website = ?, updated_at = datetime('now') where id = ?`
      )
        .bind(displayName ?? null, networkName ?? null, networkWebsite ?? null, userId)
        .run();
    } else {
      await DB.prepare(
        `update users set display_name = ?, updated_at = datetime('now') where id = ?`
      )
        .bind(displayName ?? null, userId)
        .run();
    }

    const row = await DB.prepare(
      'select id, email, account_type, display_name, network_name, network_website, created_at, updated_at, (select 1 from admin_users a where a.user_id = u.id limit 1) as is_admin from users u where u.id = ?'
    )
      .bind(userId)
      .first();

    if (!row) {
      return NextResponse.json({ error: 'Failed to load updated profile' }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        account_type: row.account_type,
        display_name: row.display_name,
        network_name: row.network_name,
        network_website: row.network_website,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_admin: !!(row as { is_admin?: number }).is_admin,
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
